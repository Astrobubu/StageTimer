'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useSocket } from '@/hooks/useSocket';
import { createClient } from '@/lib/supabase/client';
import type { TimerItem } from '@/types/timer';

export default function Controller() {
  const params = useParams();
  const roomId = params.roomId as string;

  const {
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
  } = useSocket(roomId, 'controller');

  const [localAgenda, setLocalAgenda] = useState<TimerItem[]>([]);
  const [newTimerName, setNewTimerName] = useState('');
  const [newTimerMinutes, setNewTimerMinutes] = useState('');
  const [newTimerSeconds, setNewTimerSeconds] = useState('');
  const [newTimerIsPause, setNewTimerIsPause] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [roomData, setRoomData] = useState<any>(null);
  const supabase = createClient();

  const viewerUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/room/${roomId}/viewer`
    : '';

  // Load room and timers from Supabase
  useEffect(() => {
    loadRoomData();
  }, [roomId]);

  const loadRoomData = async () => {
    // Get room by room_code
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('room_code', roomId)
      .single();

    if (room) {
      setRoomData(room);

      // Get timers for this room
      const { data: timers, error: timersError } = await supabase
        .from('timer_items')
        .select('*')
        .eq('room_id', room.id)
        .order('order_index', { ascending: true });

      if (timers) {
        const agenda: TimerItem[] = timers.map(t => ({
          id: t.id,
          name: t.name,
          duration: t.duration,
          order: t.order_index,
          isPause: t.is_pause,
        }));
        setLocalAgenda(agenda);
        updateAgenda(agenda);
      }
    }
  };

  // Save agenda to Supabase and server
  const saveAgenda = async (agenda: TimerItem[]) => {
    setLocalAgenda(agenda);
    updateAgenda(agenda);

    if (!roomData) return;

    // Delete all existing timers for this room
    await supabase
      .from('timer_items')
      .delete()
      .eq('room_id', roomData.id);

    // Insert new timers
    const timersToInsert = agenda.map((timer, index) => ({
      room_id: roomData.id,
      name: timer.name,
      duration: timer.duration,
      order_index: index,
      is_pause: timer.isPause || false,
    }));

    if (timersToInsert.length > 0) {
      await supabase
        .from('timer_items')
        .insert(timersToInsert);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const addTimer = async () => {
    const mins = parseInt(newTimerMinutes) || 0;
    const secs = parseInt(newTimerSeconds) || 0;
    const duration = mins * 60 + secs;

    if (duration > 0 && newTimerName.trim() && roomData) {
      // Insert into Supabase to get a UUID
      const { data: newTimerData, error } = await supabase
        .from('timer_items')
        .insert({
          room_id: roomData.id,
          name: newTimerName.trim(),
          duration: duration,
          order_index: localAgenda.length,
          is_pause: newTimerIsPause,
        })
        .select()
        .single();

      if (newTimerData) {
        const newTimer: TimerItem = {
          id: newTimerData.id,
          name: newTimerData.name,
          duration: newTimerData.duration,
          order: newTimerData.order_index,
          isPause: newTimerData.is_pause,
        };
        const updatedAgenda = [...localAgenda, newTimer];
        setLocalAgenda(updatedAgenda);
        updateAgenda(updatedAgenda);
        setNewTimerName('');
        setNewTimerMinutes('');
        setNewTimerSeconds('');
        setNewTimerIsPause(false);
      }
    }
  };

  const deleteTimer = async (id: string) => {
    await saveAgenda(localAgenda.filter(t => t.id !== id));
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(viewerUrl);
  };

  const currentTimer = agendaState.agenda.find(t => t.id === agendaState.currentItemId);
  const currentIndex = agendaState.agenda.findIndex(t => t.id === agendaState.currentItemId);
  const nextTimer = currentIndex !== -1 && currentIndex < agendaState.agenda.length - 1
    ? agendaState.agenda[currentIndex + 1]
    : null;

  const progressPercentage = currentTimer
    ? (agendaState.currentTimeLeft / currentTimer.duration) * 100
    : 0;

  const getProgressColor = () => {
    if (agendaState.currentTimeLeft <= 10) return 'bg-red-500';
    if (agendaState.currentTimeLeft <= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (agendaState.currentTimeLeft <= 10) return 'text-red-500';
    if (agendaState.currentTimeLeft <= 60) return 'text-yellow-500';
    return 'text-white';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="text-indigo-400 hover:text-indigo-300">
            ← Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2">StageTimer Controller</h1>
        <p className="text-gray-400 mb-8">Room ID: {roomId}</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Timer Display */}
          <div className="lg:col-span-2 space-y-6">
            {/* Next Timer Indicator */}
            {nextTimer && (
              <div className="bg-blue-900/50 border border-blue-700 rounded-lg p-3 text-sm">
                <span className="text-blue-300">Next: </span>
                <span className="font-semibold">{nextTimer.name}</span>
                <span className="text-blue-300 ml-2">({formatTime(nextTimer.duration)})</span>
              </div>
            )}

            {/* Current Timer Display */}
            <div className="bg-slate-800 rounded-2xl p-8 border border-slate-700">
              <div className="text-center">
                {currentTimer ? (
                  <>
                    <h2 className="text-2xl font-semibold mb-4">{currentTimer.name}</h2>
                    <div className={`text-8xl font-bold font-mono mb-6 transition-colors ${getTextColor()}`}>
                      {formatTime(agendaState.currentTimeLeft)}
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-4 bg-slate-700 rounded-full mb-6 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getProgressColor()}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>

                    {/* Control Buttons */}
                    <div className="flex justify-center gap-3 mb-6">
                      <button
                        onClick={() => emitTimerStart()}
                        disabled={agendaState.isRunning || !isConnected}
                        className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        ▶ Start
                      </button>
                      <button
                        onClick={() => emitTimerPause()}
                        disabled={!agendaState.isRunning || !isConnected}
                        className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        ⏸ Pause
                      </button>
                      <button
                        onClick={() => emitTimerReset()}
                        disabled={!isConnected}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-6 py-3 rounded-lg font-semibold transition-colors"
                      >
                        ↻ Reset
                      </button>
                    </div>

                    {/* Time Adjustment */}
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => adjustTime(-1)}
                        disabled={!isConnected}
                        className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        - 1 min
                      </button>
                      <button
                        onClick={() => adjustTime(1)}
                        disabled={!isConnected}
                        className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        + 1 min
                      </button>
                      <button
                        onClick={() => adjustTime(5)}
                        disabled={!isConnected}
                        className="bg-slate-700 hover:bg-slate-600 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        + 5 min
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="py-12 text-gray-400">
                    <p>No timer selected</p>
                    <p className="text-sm mt-2">Create and select a timer from the right panel</p>
                  </div>
                )}
              </div>
            </div>

            {/* Connected Devices */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <h3 className="text-sm font-semibold mb-2">Connected Devices</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-sm text-gray-300">{connectionStatus.viewerCount} viewer{connectionStatus.viewerCount !== 1 ? 's' : ''} connected</span>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Send Message to Viewers</h3>
              <div className="space-y-3">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message to display on viewer screens..."
                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (messageText.trim()) {
                        sendMessage(messageText);
                        setMessageText('');
                      }
                    }}
                    disabled={!isConnected || !messageText.trim()}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Send Message
                  </button>
                  <button
                    onClick={() => clearMessage()}
                    disabled={!isConnected}
                    className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Clear
                  </button>
                </div>
                {agendaState.message && (
                  <div className="bg-indigo-900/50 border border-indigo-700 rounded-lg p-3 text-sm">
                    <span className="text-indigo-300">Current message: </span>
                    <span>{agendaState.message}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Share Link */}
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <h3 className="text-lg font-semibold mb-4">Share Viewer Link</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={viewerUrl}
                  readOnly
                  className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-gray-300 focus:outline-none text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg font-semibold transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Timer Agenda */}
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-semibold mb-4">Timer Agenda</h2>

              {/* Timers List */}
              <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                {localAgenda.map((timer, index) => {
                  const isActive = timer.id === agendaState.currentItemId;
                  return (
                    <div
                      key={timer.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        timer.isPause
                          ? isActive
                            ? 'bg-orange-600 border border-orange-400'
                            : 'bg-orange-900/50 hover:bg-orange-800/50 border border-orange-700'
                          : isActive
                            ? 'bg-indigo-600 border border-indigo-400'
                            : 'bg-slate-700 hover:bg-slate-600 border border-slate-600'
                      }`}
                      onClick={() => selectTimer(timer.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">#{index + 1}</span>
                            {timer.isPause && <span className="text-xs bg-orange-500 px-2 py-0.5 rounded">PAUSE</span>}
                            <h3 className="font-semibold text-sm">{timer.name}</h3>
                          </div>
                          <p className="text-xs text-gray-300 mt-1">{formatTime(timer.duration)}</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTimer(timer.id);
                          }}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add New Timer */}
              <div className="border-t border-slate-700 pt-4">
                <h3 className="text-sm font-semibold mb-3">Add Timer</h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Timer name (e.g., John's Presentation)"
                    value={newTimerName}
                    onChange={(e) => setNewTimerName(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={newTimerMinutes}
                      onChange={(e) => setNewTimerMinutes(e.target.value)}
                      min="0"
                      max="99"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="number"
                      placeholder="Sec"
                      value={newTimerSeconds}
                      onChange={(e) => setNewTimerSeconds(e.target.value)}
                      min="0"
                      max="59"
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newTimerIsPause}
                      onChange={(e) => setNewTimerIsPause(e.target.checked)}
                      className="w-4 h-4 text-orange-600 bg-slate-700 border-slate-600 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-300">Mark as Pause/Break</span>
                  </label>
                  <button
                    onClick={addTimer}
                    className="w-full bg-green-600 hover:bg-green-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors"
                  >
                    + Add Timer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
