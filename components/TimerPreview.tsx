interface TimerPreviewProps {
  duration: number;
  timeLeft: number;
  isRunning: boolean;
}

export function TimerPreview({ duration, timeLeft, isRunning }: TimerPreviewProps) {
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (timeLeft / duration) * 100 : 0;

  const getProgressColor = () => {
    if (timeLeft <= 10) return 'bg-red-500';
    if (timeLeft <= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getTextColor = () => {
    if (timeLeft <= 10) return 'text-red-500';
    if (timeLeft <= 60) return 'text-yellow-500';
    return 'text-white';
  };

  return (
    <div className="bg-black rounded-lg p-4 aspect-video flex flex-col relative overflow-hidden">
      <div className="flex-1 flex items-center justify-center">
        <div className={`text-4xl font-bold font-mono ${getTextColor()} transition-colors`}>
          {formatTime(timeLeft)}
        </div>
      </div>
      {isRunning && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      )}
      <div className="w-full h-2 bg-gray-900">
        <div
          className={`h-full transition-all ${getProgressColor()}`}
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
    </div>
  );
}
