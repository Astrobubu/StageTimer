'use client';

import { useParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';

export default function Viewer() {
  const params = useParams();
  const roomId = params.roomId as string;

  const { agendaState, isConnected } = useSocket(roomId, 'viewer');

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTimer = agendaState.agenda.find(t => t.id === agendaState.currentItemId);

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
    <div className="min-h-screen bg-black text-white flex flex-col relative">
      {/* Connection indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Timer display */}
      <div className="flex-1 flex items-center justify-center relative">
        {currentTimer ? (
          <div className="text-center px-8 w-full">
            <div className="text-3xl text-gray-500 mb-8">
              {currentTimer.name}
            </div>
            <div className={`text-[20rem] font-bold font-mono leading-none tracking-tight transition-colors ${getTextColor()}`}>
              {formatTime(agendaState.currentTimeLeft)}
            </div>
          </div>
        ) : (
          // No timer selected
          <div className="text-center px-8">
            <div className="text-4xl text-gray-600">
              Waiting for timer...
            </div>
          </div>
        )}

        {/* Message overlay */}
        {agendaState.message && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-10">
            <div className="text-center px-8 max-w-4xl">
              <div className="text-6xl font-bold leading-tight">
                {agendaState.message}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Progress Bar at bottom */}
      {currentTimer && (
        <div className="w-full h-6 bg-gray-900">
          <div
            className={`h-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
}
