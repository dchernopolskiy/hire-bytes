import { memo } from 'react';
import { Users, Brain, Settings, Clock, Code2 } from 'lucide-react';
import { languageOptions } from '../pages/languageConfig';

export const RoomHeader = memo(({ 
  language, 
  onLanguageChange, 
  sessionTime, 
  participants,
  showParticipants,
  setShowParticipants,
  showSettings,
  setShowSettings,
  onAnalysisPanelToggle,
  showAnalysisPanel,
  isCreator 
}) => {
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Code2 className="w-5 h-5 text-gray-400" />
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-gray-700/50 text-white px-3 py-2 rounded-md border border-gray-600 
              focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
          >
            {Object.entries(languageOptions).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Session Timer */}
          <div className="flex items-center space-x-2 text-sm text-gray-400 bg-gray-700/30 
            px-3 py-1.5 rounded-md">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(sessionTime)}</span>
          </div>
          
          {/* Participants Counter */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-colors
              ${showParticipants 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'}`}
          >
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </button>

          {/* AI Analysis Toggle (Creator Only) */}
          {isCreator && (
            <button
              onClick={onAnalysisPanelToggle}
              className={`p-2 rounded-md transition-colors ${
                showAnalysisPanel 
                  ? 'bg-blue-500/20 text-blue-400' 
                  : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
              }`}
              title="Toggle AI Analysis Panel"
            >
              <Brain className="w-5 h-5" />
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-md transition-colors
              ${showSettings 
                ? 'bg-blue-500/20 text-blue-400' 
                : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'}`}
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
});

RoomHeader.displayName = 'RoomHeader';