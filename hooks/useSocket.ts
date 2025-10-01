import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { TimerItem } from '@/types/timer';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

export interface AgendaState {
  agenda: TimerItem[];
  currentItemId: string | null;
  currentTimeLeft: number;
  isRunning: boolean;
  message: string | null;
}

export interface ConnectionStatus {
  viewerCount: number;
  hasController: boolean;
}

export const useSocket = (roomId: string, role: 'controller' | 'viewer') => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [agendaState, setAgendaState] = useState<AgendaState>({
    agenda: [],
    currentItemId: null,
    currentTimeLeft: 0,
    isRunning: false,
    message: null,
  });
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    viewerCount: 0,
    hasController: false,
  });
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL);

    socketInstance.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      socketInstance.emit('join-room', { roomId, role });
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    socketInstance.on('agenda-state', (state: AgendaState) => {
      setAgendaState(state);
    });

    socketInstance.on('connection-status', (status: ConnectionStatus) => {
      setConnectionStatus(status);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [roomId, role]);

  const updateAgenda = (agenda: TimerItem[]) => {
    if (socket) {
      socket.emit('update-agenda', { roomId, agenda });
    }
  };

  const selectTimer = (itemId: string) => {
    if (socket) {
      socket.emit('select-timer', { roomId, itemId });
    }
  };

  const emitTimerStart = () => {
    if (socket) {
      socket.emit('timer-start', { roomId });
    }
  };

  const emitTimerPause = () => {
    if (socket) {
      socket.emit('timer-pause', { roomId });
    }
  };

  const emitTimerReset = () => {
    if (socket) {
      socket.emit('timer-reset', { roomId });
    }
  };

  const adjustTime = (minutes: number) => {
    if (socket) {
      socket.emit('adjust-time', { roomId, minutes });
    }
  };

  const sendMessage = (message: string) => {
    if (socket) {
      socket.emit('send-message', { roomId, message });
    }
  };

  const clearMessage = () => {
    if (socket) {
      socket.emit('clear-message', { roomId });
    }
  };

  return {
    socket,
    agendaState,
    connectionStatus,
    isConnected,
    updateAgenda,
    selectTimer,
    emitTimerStart,
    emitTimerPause,
    emitTimerReset,
    adjustTime,
    sendMessage,
    clearMessage,
  };
};
