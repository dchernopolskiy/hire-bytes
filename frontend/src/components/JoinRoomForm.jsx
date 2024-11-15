import { useState, useEffect } from 'react';

export const JoinRoomForm = ({ socket, roomId, onJoin }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('JoinRoomForm mounted', { socket, roomId });
    // Check if user is the creator
    const storedUsername = localStorage.getItem('username');
    const isCreator = localStorage.getItem('isCreator') === 'true';
    const userId = localStorage.getItem('userId');
    
    if (storedUsername && isCreator && userId && socket) {
      console.log('Auto-joining as creator', { storedUsername, userId });
      socket.emit('join_room', { 
        roomId, 
        userId,
        username: storedUsername,
        isCreator: true
      });
      onJoin?.();
    }
  }, [socket, roomId, onJoin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting to join room', { username, roomId });
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const { userId } = await response.json();
      localStorage.setItem('username', username);
      localStorage.setItem('userId', userId);
      localStorage.setItem('isCreator', 'false');

      if (socket) {
        socket.emit('join_room', { 
          roomId, 
          userId, 
          username, 
          isCreator: false 
        });
        onJoin?.();
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md mx-4">
        <h2 className="text-2xl font-bold text-white mb-6">Join Interview Room</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md 
                text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}
          <button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md
              transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Join Room
          </button>
        </form>
      </div>
    </div>
  );
};