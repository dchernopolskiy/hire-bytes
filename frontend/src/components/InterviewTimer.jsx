import { useState, useEffect, useCallback } from 'react';
import { Clock, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';

export const InterviewTimer = ({ onTimeUpdate }) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  
  // Format time as mm:ss or hh:mm:ss
  const formatTime = useCallback((seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    let interval;
    if (isRunning) {
      interval = setInterval(() => {
        setTime(prev => {
          const newTime = prev + 1;
          // Show warning at 45 minutes
          if (newTime === 45 * 60) {
            setShowWarning(true);
          }
          onTimeUpdate?.(newTime);
          return newTime;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, onTimeUpdate]);

  const toggleTimer = () => setIsRunning(prev => !prev);
  const resetTimer = () => {
    setTime(0);
    setIsRunning(false);
    setShowWarning(false);
    onTimeUpdate?.(0);
  };

  return (
    <div className="relative group">
      <div className="flex items-center space-x-2 bg-gray-800/50 backdrop-blur-sm rounded-lg 
        border border-gray-700/50 p-2">
        <div className="w-20 text-center font-mono text-lg">
          {formatTime(time)}
        </div>
        
        <div className="flex space-x-1">
          <button
            onClick={toggleTimer}
            className={`p-1.5 rounded-md transition-colors ${
              isRunning ? 'bg-yellow-500/20 text-yellow-500' : 'bg-green-500/20 text-green-500'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-1.5 rounded-md bg-gray-700/50 text-gray-400 
              hover:bg-gray-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showWarning && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-yellow-500/10 
          text-yellow-500 text-xs rounded-md p-2 flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Interview running for 45 minutes</span>
        </div>
      )}
    </div>
  );
};