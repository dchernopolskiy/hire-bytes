import { useEffect } from 'react';
import { VolumeX, Volume2, X, Crown, Clock } from 'lucide-react';

export const ParticipantsList = ({
  participants,
  isCreator,
  mutedUsers,
  onMuteToggle,
  onKick,
  onClose
}) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.participants-panel') && 
          !event.target.closest('.participants-button')) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const formatDuration = (joinedAt) => {
    const duration = Date.now() - new Date(joinedAt).getTime();
    const minutes = Math.floor(duration / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  return (
    <div className="participants-panel absolute top-16 right-4 w-72 bg-gray-800/95 rounded-lg shadow-xl backdrop-blur-sm border border-gray-700/50 z-50">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Participants</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700/50 rounded-md text-gray-400 
              transition-colors flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className="flex items-center justify-between p-3 rounded-md bg-gray-700/30 hover:bg-gray-700/50 transition-colors border border-gray-700/50"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-medium">
                  {participant.username[0].toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">
                      {participant.username}
                    </span>
                    {participant.userId === localStorage.getItem('userId') && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded">You</span>
                    )}
                    {participant.isCreator && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(participant.joinedAt)}</span>
                  </div>
                </div>
              </div>

              {isCreator && participant.userId !== localStorage.getItem('userId') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onMuteToggle(participant.userId)}
                    className={`p-1.5 rounded-md transition-colors ${
                      mutedUsers.has(participant.userId)
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600'
                    }`}
                    title={mutedUsers.has(participant.userId) ? 'Unmute user' : 'Mute user'}
                  >
                    {mutedUsers.has(participant.userId) ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onKick(participant.userId)}
                    className="p-1.5 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30 transition-colors"
                    title="Remove user"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};