import { useState, useEffect, useCallback, useRef } from 'react';

export const useCodeSync = (socket, roomId) => {
  const [code, setCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('javascript');
  const [syncState, setSyncState] = useState('synchronized');
  const [pendingChanges, setPendingChanges] = useState([]);
  const [lastSyncedVersion, setLastSyncedVersion] = useState(0);
  const initialLoadRef = useRef(false);

  // Handle incoming code updates
  useEffect(() => {
    if (!socket) return;

    const handleRoomState = (state) => {
      if (!initialLoadRef.current && state.code) {
        setCode(state.code);
        setLanguage(state.language);
        initialLoadRef.current = true;
        setLastSyncedVersion(0); // Reset version on initial load
      }
    };

    const handleCodeUpdate = (newCode) => {
      if (initialLoadRef.current) {
        setCode(newCode);
        setLastSyncedVersion(prev => prev + 1);
        setSyncState('synchronized');
      }
    };

    socket.on('room_state', handleRoomState);
    socket.on('receive_code', handleCodeUpdate);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('receive_code', handleCodeUpdate);
    };
  }, [socket]);

  // Debounced code change handler
  const handleCodeChange = useCallback((newCode) => {
    if (!initialLoadRef.current) return;
    
    setCode(newCode);
    setPendingChanges(prev => [...prev, { code: newCode, timestamp: Date.now() }]);

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