import { useState, useEffect } from 'react';

export const JoinRoomForm = ({ socket, roomId }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is the creator
    const storedUsername = localStorage.getItem('username');
    const isCreator = localStorage.getItem('isCreator') === 'true';
    const userId = localStorage.getItem('userId');
    
    if (storedUsername && isCreator && userId) {
      // Auto-join if user is the creator
      socket?.emit('join_room', { 
        roomId, 
        userId,
        username: storedUsername,
        isCreator: true
      });
    }
  }, [socket, roomId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Please enter a name');
      return;
    }

    const userId = Math.random().toString(36).substr(2, 9);
    localStorage.setItem('username', username);
    localStorage.setItem('userId', userId);
    localStorage.setItem('isCreator', 'false');
    
    socket?.emit('join_room', { 
      roomId, 
      userId, 
      username, 
      isCreator: false 
    });
  };

  // If user is creator, don't show the form
  if (localStorage.getItem('isCreator') === 'true') {
    return null;
  }

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