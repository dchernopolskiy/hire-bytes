import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Code2, Zap } from 'lucide-react';

export function LandingPage() {
  const [roomInfo, setRoomInfo] = useState(null);
  const [username, setUsername] = useState('');
  const [showCopied, setShowCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const createRoom = async () => {
    if (!username.trim()) {
      setError('Name needed (anything works)');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('https://hirebytes.onrender.com/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ username }),
        // Add timeout and retry logic
        signal: AbortSignal.timeout(15000) // 15 second timeout
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create room');
      }

      const data = await response.json();
      const shareableLink = `${window.location.origin}/room/${data.roomId}`;
      
      // Store creator info in localStorage
      localStorage.setItem('username', username);
      localStorage.setItem('userId', data.userId);
      localStorage.setItem('isCreator', 'true');
      
      setRoomInfo({ ...data, shareableLink });
    } catch (error) {
      console.error('Failed to create room:', error);
      if (error.name === 'AbortError') {
        setError('Connection timed out. Please try again or check your internet connection.');
      } else if (error.message.includes('Failed to fetch')) {
        setError('Unable to connect to the server. Please try again in a few moments.');
      } else {
        setError(error.message || 'Something went wrong. Try again?');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (roomInfo) {
      try {
        await navigator.clipboard.writeText(roomInfo.shareableLink);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy:', error);
        // Fallback for browsers that don't support clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = roomInfo.shareableLink;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
      }
    }
  };

  const enterRoom = () => {
    if (roomInfo) {
      navigate(`/room/${roomInfo.roomId}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Code2 className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">HireBytes</h1>
          </div>
          
          <h2 className="text-xl text-gray-400 mb-12">
            No BS interview collaboration tool
          </h2>

          <div className="bg-gray-800/50 rounded-lg backdrop-blur-sm border border-gray-700 p-6 shadow-xl">
            <div className="space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-2 rounded-md"
                >
                  {error}
                </motion.div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  placeholder="Enter anything"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isLoading) {
                      createRoom();
                    }
                  }}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                    placeholder:text-gray-600"
                />
              </div>

              <button
                onClick={createRoom}
                disabled={isLoading}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
                  text-white px-4 py-2 rounded-md transition-colors duration-200
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  focus:ring-offset-gray-800 disabled:cursor-not-allowed
                  flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Create Room
                  </>
                )}
              </button>

              {roomInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative">
                    <input
                      readOnly
                      value={roomInfo.shareableLink}
                      className="w-full px-4 py-2 bg-gray-900/50 border border-gray-700 
                        rounded-md font-mono text-sm text-gray-300"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2
                        text-gray-400 hover:text-white px-2 py-1 rounded
                        transition-colors duration-200"
                    >
                      Copy
                    </button>
                  </div>
                  
                  {showCopied && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="bg-green-500/10 border border-green-500/20 
                        text-green-400 px-4 py-2 rounded-md text-center"
                    >
                      Copied to clipboard!
                    </motion.div>
                  )}

                  <button
                    onClick={enterRoom}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md
                      transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 mt-4"
                  >
                    Enter Room
                  </button>

                  <p className="text-sm text-gray-400">
                    You can either enter directly or share the link with others to start collaborating.
                    The room will automatically close after 30 minutes of inactivity.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          <div className="mt-8 text-center text-gray-500 text-sm">
            <p>No sign-up required. No data stored. Just code.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default LandingPage;