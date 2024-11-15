import { useState, useEffect, useCallback } from 'react';

export const useCodeSync = (socket, roomId) => {
  const [code, setCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('javascript');
  const [syncState, setSyncState] = useState('synchronized'); // synchronized, syncing, error
  const [lastSyncedVersion, setLastSyncedVersion] = useState(0);
  const [pendingChanges, setPendingChanges] = useState([]);

  // Handle incoming code updates
  useEffect(() => {
    if (!socket) return;

    const handleCodeUpdate = (newCode) => {
      setCode(newCode);
      setLastSyncedVersion(prev => prev + 1);
      setSyncState('synchronized');
    };

    const handleLanguageChange = (newLanguage) => {
      setLanguage(newLanguage);
    };

    // Reconnection handling
    const handleReconnect = async () => {
      setSyncState('syncing');
      try {
        socket.emit('request_code_state', { roomId });
      } catch (error) {
        console.error('Failed to request code state:', error);
        setSyncState('error');
      }
    };

    socket.on('receive_code', handleCodeUpdate);
    socket.on('language_changed', handleLanguageChange);
    socket.on('reconnect', handleReconnect);

    return () => {
      socket.off('receive_code', handleCodeUpdate);
      socket.off('language_changed', handleLanguageChange);
      socket.off('reconnect', handleReconnect);
    };
  }, [socket, roomId]);

  // Debounced code change handler
  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    socket?.emit('code_change', { roomId, code: newCode });

    // Add change to pending changes
    setPendingChanges(prev => [...prev, { code: newCode, timestamp: Date.now() }]);

    // Emit code change to server with version tracking
    socket?.emit('code_change', {
      roomId,
      code: newCode,
      version: lastSyncedVersion + 1
    });
  }, [socket, roomId, lastSyncedVersion]);

  // Handle language changes
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    socket?.emit('language_change', { roomId, language: newLanguage });
  }, [socket, roomId]);

  // Periodic sync check
  useEffect(() => {
    if (!socket || syncState !== 'syncing') return;

    const checkSync = () => {
      const now = Date.now();
      const oldestPending = pendingChanges[0];

      if (oldestPending && now - oldestPending.timestamp > 5000) {
        // If changes are pending for too long, request resync
        socket.emit('request_code_state', { roomId });
        setPendingChanges([]);
      }
    };

    const interval = setInterval(checkSync, 5000);
    return () => clearInterval(interval);
  }, [socket, roomId, syncState, pendingChanges]);

  return {
    code,
    setCode,
    language,
    setLanguage,
    handleCodeChange,
    handleLanguageChange,
    syncState,
    pendingChanges: pendingChanges.length
  };
};