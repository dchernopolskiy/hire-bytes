import { useState, useEffect, useCallback, useRef } from 'react';

export const useCollaboration = (socket, roomId) => {
  const [participants, setParticipants] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [isUserMuted, setIsUserMuted] = useState(false);
  const [activeSelections, setActiveSelections] = useState(new Map());
  const cursorUpdateThrottleRef = useRef(null);

  // Track active participants
  useEffect(() => {
    if (!socket) return;
  
    const handleCursorUpdate = (data) => {
      console.log('Collaboration hook received cursor_update:', data);
      
      if (data.userId === localStorage.getItem('userId')) {
        console.log('Ignoring own cursor update');
        return;
      }
  
      setCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          username: data.username,
          position: data.position,
          isTyping: data.isTyping,
          timestamp: Date.now()
        });
        console.log('Updated cursors map:', Array.from(next.entries()));
        return next;
      });
    };
  
    console.log('Setting up cursor_update listener');
    socket.on('cursor_update', handleCursorUpdate);
  
    return () => {
      console.log('Cleaning up cursor_update listener');
      socket.off('cursor_update', handleCursorUpdate);
    };
  }, [socket]);

  // Handle cursor activity
  const handleCursorActivity = useCallback(
    (cursorInfo) => {
      if (!socket || !roomId) return;

      // Throttle cursor updates
      if (cursorUpdateThrottleRef.current) {
        clearTimeout(cursorUpdateThrottleRef.current);
      }

      cursorUpdateThrottleRef.current = setTimeout(() => {
        const userId = localStorage.getItem('userId');
        const username = localStorage.getItem('username');

        socket.emit('cursor_activity', {
          roomId,
          userId,
          username,
          position: cursorInfo.position,
          isTyping: cursorInfo.isTyping || false
        });
      }, 50); // 50ms throttle
    },
    [socket, roomId]
  );

  // Handle remote cursor updates
  useEffect(() => {
    if (!socket) return;

    const handleCursorUpdate = (data) => {
      console.log('Collaboration hook received cursor update:', data);
      setCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          username: data.username,
          position: data.position,
          isTyping: data.isTyping,
          timestamp: Date.now()
        });
        console.log('Updated cursors map:', Array.from(next.entries()));
        return next;
      });
    };

    socket.on('cursor_update', handleCursorUpdate);

    return () => {
      socket.off('cursor_update', handleCursorUpdate);
    };
  }, [socket]);

  // Handle selection sync
  const handleSelectionSync = useCallback((ranges) => {
    if (!socket || !roomId) return;

    socket.emit('selection_update', {
      roomId,
      userId: localStorage.getItem('userId'),
      ranges
    });
  }, [socket, roomId]);

  useEffect(() => {
    if (!socket) return;

    const handleSelectionUpdate = ({ userId, ranges }) => {
      setActiveSelections(prev => {
        const next = new Map(prev);
        next.set(userId, ranges);
        return next;
      });

      // Clear selection after delay
      setTimeout(() => {
        setActiveSelections(prev => {
          const next = new Map(prev);
          next.delete(userId);
          return next;
        });
      }, 5000);
    };

    socket.on('selection_update', handleSelectionUpdate);
    return () => socket.off('selection_update', handleSelectionUpdate);
  }, [socket]);

  // Handle muting
  const handleMuteToggle = useCallback((userId) => {
    if (!socket || !roomId) return;

    socket.emit(mutedUsers.has(userId) ? 'unmute_user' : 'mute_user', {
      roomId,
      userId
    });
  }, [socket, roomId, mutedUsers]);

  useEffect(() => {
    if (!socket) return;

    const handleMute = (userId) => {
      setMutedUsers(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
      if (userId === localStorage.getItem('userId')) {
        setIsUserMuted(true);
        addNotification('You have been muted by the interviewer');
      }
    };

    const handleUnmute = (userId) => {
      setMutedUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      if (userId === localStorage.getItem('userId')) {
        setIsUserMuted(false);
        addNotification('You have been unmuted by the interviewer');
      }
    };

    socket.on('user_muted', handleMute);
    socket.on('user_unmuted', handleUnmute);

    return () => {
      socket.off('user_muted', handleMute);
      socket.off('user_unmuted', handleUnmute);
    };
  }, [socket]);

  // Handle kicking users
  const handleKickUser = useCallback((userId) => {
    if (!socket || !roomId) return;
    socket.emit('kick_user', { roomId, userId });
  }, [socket, roomId]);

  // Clean up inactive cursors
  useEffect(() => {
    const interval = setInterval(() => {
      setCursors(prev => {
        const now = Date.now();
        const next = new Map();
        
        for (const [userId, cursor] of prev.entries()) {
          if (now - cursor.timestamp < 10000) { // Remove cursors inactive for 10s
            next.set(userId, cursor);
          }
        }
        
        return next;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Notification helper
  const addNotification = useCallback((message, type = 'info') => {
    const event = new CustomEvent('add-notification', {
      detail: { message, type }
    });
    window.dispatchEvent(event);
  }, []);

  return {
    participants,
    cursors,
    mutedUsers,
    isUserMuted,
    activeSelections,
    handleCursorActivity,
    handleSelectionSync,
    handleMuteToggle,
    handleKickUser,
    addNotification
  };
};