import { VolumeX, Volume2, X } from 'lucide-react';

export const ParticipantsList = ({
  participants,
  isCreator,
  mutedUsers,
  onMuteToggle,
  onKick,
  onClose
}) => {
  return (
    <div 
      className="absolute top-16 left-4 w-64 bg-gray-800 rounded-md shadow-lg z-50"
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium">Participants</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-700 rounded-md text-gray-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div
              key={participant.userId}
              className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700/50"
            >
              <span className="text-sm text-gray-300">{participant.username}</span>
              {isCreator && participant.userId !== localStorage.getItem('userId') && (
                <div className="flex gap-2">
                  <button
                    onClick={() => onMuteToggle(participant.userId)}
                    className={`p-1 rounded-md transition-colors ${
                      mutedUsers.has(participant.userId)
                        ? 'bg-yellow-500/20 text-yellow-500'
                        : 'bg-gray-700 text-gray-400'
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
                    className="p-1 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30"
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