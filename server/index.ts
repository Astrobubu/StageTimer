import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

interface TimerItem {
  id: string;
  name: string;
  duration: number;
  order: number;
}

interface Room {
  id: string;
  agenda: TimerItem[];
  currentItemId: string | null;
  currentTimeLeft: number;
  isRunning: boolean;
  message: string | null;
  controller: string | null;
  viewers: Set<string>;
  intervalId?: NodeJS.Timeout;
}

const rooms = new Map<string, Room>();

// Timer tick function
const startRoomTimer = (roomId: string) => {
  const room = rooms.get(roomId);
  if (!room || room.intervalId) return;

  room.intervalId = setInterval(() => {
    if (room.isRunning && room.currentTimeLeft > 0) {
      room.currentTimeLeft -= 1;

      // Broadcast to all clients in room
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });

      // Stop when timer reaches 0
      if (room.currentTimeLeft <= 0) {
        room.isRunning = false;
        room.currentTimeLeft = 0;
        if (room.intervalId) {
          clearInterval(room.intervalId);
          room.intervalId = undefined;
        }

        // Auto-advance to next timer
        const currentIndex = room.agenda.findIndex(item => item.id === room.currentItemId);
        if (currentIndex !== -1 && currentIndex < room.agenda.length - 1) {
          const nextItem = room.agenda[currentIndex + 1];
          room.currentItemId = nextItem.id;
          room.currentTimeLeft = nextItem.duration;
          io.to(roomId).emit('agenda-state', {
            agenda: room.agenda,
            currentItemId: room.currentItemId,
            currentTimeLeft: room.currentTimeLeft,
            isRunning: room.isRunning,
            message: room.message,
          });
        }
      }
    }
  }, 1000);
};

const stopRoomTimer = (roomId: string) => {
  const room = rooms.get(roomId);
  if (room && room.intervalId) {
    clearInterval(room.intervalId);
    room.intervalId = undefined;
  }
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', ({ roomId, role }: { roomId: string; role: 'controller' | 'viewer' }) => {
    console.log(`${socket.id} joining room ${roomId} as ${role}`);

    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        id: roomId,
        agenda: [],
        currentItemId: null,
        currentTimeLeft: 0,
        isRunning: false,
        message: null,
        controller: null,
        viewers: new Set(),
      });
    }

    const room = rooms.get(roomId)!;
    socket.join(roomId);

    if (role === 'controller') {
      room.controller = socket.id;
    } else {
      room.viewers.add(socket.id);
    }

    // Send current state
    socket.emit('agenda-state', {
      agenda: room.agenda,
      currentItemId: room.currentItemId,
      currentTimeLeft: room.currentTimeLeft,
      isRunning: room.isRunning,
      message: room.message,
    });

    // Broadcast connection count
    io.to(roomId).emit('connection-status', {
      viewerCount: room.viewers.size,
      hasController: room.controller !== null,
    });
  });

  socket.on('update-agenda', ({ roomId, agenda }: { roomId: string; agenda: TimerItem[] }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      room.agenda = agenda;
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });
    }
  });

  socket.on('select-timer', ({ roomId, itemId }: { roomId: string; itemId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      const item = room.agenda.find(i => i.id === itemId);
      if (item) {
        stopRoomTimer(roomId);
        room.currentItemId = itemId;
        room.currentTimeLeft = item.duration;
        room.isRunning = false;
        io.to(roomId).emit('agenda-state', {
          agenda: room.agenda,
          currentItemId: room.currentItemId,
          currentTimeLeft: room.currentTimeLeft,
          isRunning: room.isRunning,
          message: room.message,
        });
      }
    }
  });

  socket.on('timer-start', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      room.isRunning = true;
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });
      startRoomTimer(roomId);
    }
  });

  socket.on('timer-pause', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      room.isRunning = false;
      stopRoomTimer(roomId);
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });
    }
  });

  socket.on('timer-reset', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      const currentItem = room.agenda.find(i => i.id === room.currentItemId);
      if (currentItem) {
        room.currentTimeLeft = currentItem.duration;
        room.isRunning = false;
        stopRoomTimer(roomId);
        io.to(roomId).emit('agenda-state', {
          agenda: room.agenda,
          currentItemId: room.currentItemId,
          currentTimeLeft: room.currentTimeLeft,
          isRunning: room.isRunning,
          message: room.message,
        });
      }
    }
  });

  socket.on('adjust-time', ({ roomId, minutes }: { roomId: string; minutes: number }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      room.currentTimeLeft = Math.max(0, room.currentTimeLeft + (minutes * 60));
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });
    }
  });

  socket.on('send-message', ({ roomId, message }: { roomId: string; message: string }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      room.message = message;
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });
    }
  });

  socket.on('clear-message', ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room && room.controller === socket.id) {
      room.message = null;
      io.to(roomId).emit('agenda-state', {
        agenda: room.agenda,
        currentItemId: room.currentItemId,
        currentTimeLeft: room.currentTimeLeft,
        isRunning: room.isRunning,
        message: room.message,
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    rooms.forEach((room, roomId) => {
      if (room.controller === socket.id) {
        room.controller = null;
      }
      room.viewers.delete(socket.id);

      io.to(roomId).emit('connection-status', {
        viewerCount: room.viewers.size,
        hasController: room.controller !== null,
      });

      if (room.controller === null && room.viewers.size === 0) {
        stopRoomTimer(roomId);
        rooms.delete(roomId);
        console.log(`Room ${roomId} deleted (empty)`);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
