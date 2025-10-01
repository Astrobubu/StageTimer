'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { TimerItem } from '@/types/timer';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface AgendaState {
  agenda: TimerItem[];
  currentItemId: string | null;
  currentTimeLeft: number;
  isRunning: boolean;
  message: string | null;
}

export interface ConnectionStatus {
  viewerCount: number;
}

export function useSupabaseRealtime(roomCode: string, role: 'controller' | 'viewer') {
  const [agendaState, setAgendaState] = useState<AgendaState>({
    agenda: [],
    currentItemId: null,
    currentTimeLeft: 0,
    isRunning: false,
    message: null,
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus] = useState<ConnectionStatus>({ viewerCount: 0 });
  const [roomId, setRoomId] = useState<string | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  const supabase = createClient();

  // Load room and initial state
  useEffect(() => {
    loadRoomData();
  }, [roomCode]);

  // Set up realtime subscription
  useEffect(() => {
    if (!roomId) return;

    const roomChannel = supabase
      .channel(`room:${roomCode}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_state',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newState = payload.new as any;
            setAgendaState((prev) => ({
              ...prev,
              currentItemId: newState.current_timer_id,
              currentTimeLeft: newState.current_time_left,
              isRunning: newState.is_running,
              message: newState.message,
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'timer_items',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          // Reload timers when they change
          loadTimers();
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    setChannel(roomChannel);

    return () => {
      roomChannel.unsubscribe();
    };
  }, [roomId, roomCode]);

  // Client-side countdown
  useEffect(() => {
    if (!agendaState.isRunning || agendaState.currentTimeLeft <= 0 || role !== 'controller') return;

    const interval = setInterval(async () => {
      const newTimeLeft = agendaState.currentTimeLeft - 1;

      if (newTimeLeft <= 0) {
        // Timer finished, auto-advance
        const currentIndex = agendaState.agenda.findIndex(t => t.id === agendaState.currentItemId);
        const nextTimer = currentIndex !== -1 && currentIndex < agendaState.agenda.length - 1
          ? agendaState.agenda[currentIndex + 1]
          : null;

        if (nextTimer) {
          await updateRoomState({
            current_timer_id: nextTimer.id,
            current_time_left: nextTimer.duration,
            is_running: false,
          });
        } else {
          await updateRoomState({
            is_running: false,
            current_time_left: 0,
          });
        }
      } else {
        await updateRoomState({
          current_time_left: newTimeLeft,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [agendaState.isRunning, agendaState.currentTimeLeft, agendaState.currentItemId, agendaState.agenda, role]);

  const loadRoomData = async () => {
    const { data: room } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomCode)
      .single();

    if (room) {
      setRoomId(room.id);
      await loadTimers(room.id);
      await loadRoomState(room.id);
    }
  };

  const loadTimers = async (rid?: string) => {
    const id = rid || roomId;
    if (!id) return;

    const { data: timers } = await supabase
      .from('timer_items')
      .select('*')
      .eq('room_id', id)
      .order('order_index', { ascending: true });

    if (timers) {
      const agenda: TimerItem[] = timers.map(t => ({
        id: t.id,
        name: t.name,
        duration: t.duration,
        order: t.order_index,
        isPause: t.is_pause,
      }));
      setAgendaState((prev) => ({ ...prev, agenda }));
    }
  };

  const loadRoomState = async (rid: string) => {
    const { data: state } = await supabase
      .from('room_state')
      .select('*')
      .eq('room_id', rid)
      .single();

    if (state) {
      setAgendaState((prev) => ({
        ...prev,
        currentItemId: state.current_timer_id,
        currentTimeLeft: state.current_time_left,
        isRunning: state.is_running,
        message: state.message,
      }));
    } else {
      // Create initial state
      await supabase.from('room_state').insert({
        room_id: rid,
        current_timer_id: null,
        current_time_left: 0,
        is_running: false,
        message: null,
      });
    }
  };

  const updateRoomState = async (updates: Partial<{
    current_timer_id: string | null;
    current_time_left: number;
    is_running: boolean;
    message: string | null;
  }>) => {
    if (!roomId) return;

    await supabase
      .from('room_state')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('room_id', roomId);
  };

  const updateAgenda = useCallback((agenda: TimerItem[]) => {
    setAgendaState((prev) => ({ ...prev, agenda }));
  }, []);

  const selectTimer = useCallback(async (timerId: string) => {
    const timer = agendaState.agenda.find(t => t.id === timerId);
    if (timer) {
      await updateRoomState({
        current_timer_id: timerId,
        current_time_left: timer.duration,
        is_running: false,
      });
    }
  }, [agendaState.agenda, roomId]);

  const emitTimerStart = useCallback(async () => {
    await updateRoomState({ is_running: true });
  }, [roomId]);

  const emitTimerPause = useCallback(async () => {
    await updateRoomState({ is_running: false });
  }, [roomId]);

  const emitTimerReset = useCallback(async () => {
    const currentTimer = agendaState.agenda.find(t => t.id === agendaState.currentItemId);
    if (currentTimer) {
      await updateRoomState({
        current_time_left: currentTimer.duration,
        is_running: false,
      });
    }
  }, [agendaState.agenda, agendaState.currentItemId, roomId]);

  const adjustTime = useCallback(async (minutes: number) => {
    const newTime = agendaState.currentTimeLeft + (minutes * 60);
    await updateRoomState({ current_time_left: Math.max(0, newTime) });
  }, [agendaState.currentTimeLeft, roomId]);

  const sendMessage = useCallback(async (message: string) => {
    await updateRoomState({ message });
  }, [roomId]);

  const clearMessage = useCallback(async () => {
    await updateRoomState({ message: null });
  }, [roomId]);

  return {
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
}
