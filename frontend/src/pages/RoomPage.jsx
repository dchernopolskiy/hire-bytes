import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Brain } from 'lucide-react';
import { languageOptions, getLanguageExtension, getDefaultTemplate } from './languageConfig';
import { CodeEditor } from '../components/CodeEditor';
import { AnalysisPanel } from '../components/AnalysisPanel';
import { ParticipantsList } from '../components/ParticipantsList';
import { NotificationOverlay } from '../components/NotificationOverlay';
import { JoinRoomForm } from '../components/JoinRoomForm';

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const cursorTimeoutRef = useRef(null);
  
  // Core state
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [cursors, setCursors] = useState(new Map());
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator] = useState(localStorage.getItem('isCreator') === 'true');
  const [isUserMuted, setIsUserMuted] = useState(false);
  const [lastCursorActivity, setLastCursorActivity] = useState(new Map());
  const [selections, setSelections] = useState(new Map());
  const [activeHighlights, setActiveHighlights] = useState(new Map());

  const CURSOR_TIMEOUT = 60000; // 1 minute for cursor disappearance

  // Notification helper
  const addNotification = useCallback((message, type) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL);
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  // Handle cursor tracking
const handleCursorActivity = useCallback((view) => {
  if (!socket || !view) return;

  // Check if we're currently focused on a textarea or input
  if (document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.tagName === 'INPUT') {
    return;
  }

  // Check if we're interacting with the editor
  const editorElement = view.dom;
  const isMouseInEditor = (event) => {
    if (!event) return false;
    const rect = editorElement.getBoundingClientRect();
    return (
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    );
  };

  if (!isMouseInEditor(window.event)) return;

  if (cursorTimeoutRef.current) {
    clearTimeout(cursorTimeoutRef.current);
  }

  cursorTimeoutRef.current = setTimeout(() => {
    const selection = view.state.selection.main;
    const pos = view.coordsAtPos(selection.head);
    
    if (!pos) return;

    const editorContainer = view.scrollDOM;
    const rect = editorContainer.getBoundingClientRect();
    const scrollPos = {
      top: editorContainer.scrollTop,
      left: editorContainer.scrollLeft
    };

    const relativePos = {
      x: pos.left - rect.left + scrollPos.left,
      y: pos.top - rect.top + scrollPos.top
    };

    socket.emit('cursor_move', {
      roomId,
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      position: relativePos
    });

    setLastCursorActivity(prev => 
      new Map(prev).set(localStorage.getItem('userId'), Date.now())
    );
  }, 50);
}, [socket, roomId]);

  // Handle code selection
  const handleSelection = useCallback((viewUpdate) => {
    if (!socket || !viewUpdate.view) return;
    
    const selection = viewUpdate.state.selection.main;
    if (selection.from === selection.to) return; // Skip if no selection
    
    const selectedText = viewUpdate.state.doc.sliceString(selection.from, selection.to);
    
    socket.emit('code_selection', {
      roomId,
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      selection: {
        from: selection.from,
        to: selection.to,
        text: selectedText
      }
    });
  }, [socket, roomId]);

  // Handle code changes
  const handleCodeChange = useCallback((value) => {
    if (isUserMuted) {
      addNotification("You cannot edit code while muted", 'muted');
      return;
    }
    
    setCode(value);
    if (socket) {
      socket.emit('code_change', { roomId, code: value });
    }
  }, [socket, roomId, isUserMuted, addNotification]);

  // Handle language changes
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    if (socket) {
      socket.emit('language_change', { roomId, language: newLanguage });
    }
    if (!code || code === getDefaultTemplate(language)) {
      setCode(getDefaultTemplate(newLanguage));
    }
  }, [socket, code, language, roomId]);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    // Handle user joined event
    socket.on('user_joined', (user) => {
      setParticipants(prev => [...prev.filter(p => p.userId !== user.userId), user]);
      addNotification(`${user.username} joined the room`, 'info');
    });

    // Handle code updates
    socket.on('receive_code', setCode);
    socket.on('language_changed', setLanguage);

    // Handle cursor updates
    socket.on('cursor_update', ({ userId, username, position }) => {
      if (userId !== localStorage.getItem('userId')) {
        setCursors(prev => new Map(prev).set(userId, { username, position }));
      }
    });

    // Handle selection updates
    socket.on('code_selection_update', ({ userId, username, selection }) => {
      if (userId !== localStorage.getItem('userId')) {
        setActiveHighlights(prev => {
          const newHighlights = new Map(prev);
          newHighlights.set(userId, {
            username,
            selection,
            color: stringToColor(username)
          });
          return newHighlights;
        });
      }
    });

    // Handle user mute/unmute events
    socket.on('user_muted', (userId) => {
      if (userId === localStorage.getItem('userId')) {
        setIsUserMuted(true);
        addNotification("You've been muted by the host", 'muted');
      }
      setMutedUsers(prev => new Set([...prev, userId]));
    });

    socket.on('user_unmuted', (userId) => {
      if (userId === localStorage.getItem('userId')) {
        setIsUserMuted(false);
        addNotification("You've been unmuted", 'unmuted');
      }
      setMutedUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    // Handle room state
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    if (username && userId) {
      socket.emit('join_room', { roomId, userId, username, isCreator });
    }

    socket.on('room_state', ({ code: initialCode, language: initialLanguage, participants: initialParticipants }) => {
      if (initialCode) setCode(initialCode);
      if (initialLanguage) setLanguage(initialLanguage);
      if (initialParticipants) setParticipants(initialParticipants);
      setIsJoined(true);
    });

    // Handle errors
    socket.on('error', ({ message }) => {
      addNotification(message, 'error');
      if (message === 'Room not found') {
        navigate('/');
      }
    });

    // Cleanup
    return () => {
      socket.off('user_joined');
      socket.off('receive_code');
      socket.off('cursor_update');
      socket.off('code_selection_update');
      socket.off('user_muted');
      socket.off('user_unmuted');
      socket.off('room_state');
      socket.off('error');
    };
  }, [socket, roomId, navigate, isCreator, addNotification]);

  // Handle code analysis
  const handleAnalyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Analysis failed');
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      addNotification(`Analysis failed: ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show join screen if not joined and not creator
  if (!isJoined && !localStorage.getItem('isCreator')) {
    return <JoinRoomForm socket={socket} roomId={roomId} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Main coding area */}
        <div className={`flex-1 flex flex-col ${showAnalysisPanel ? 'mr-80' : ''}`}>
          {/* Header */}
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 
                  focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(languageOptions).map(([key, value]) => (
                  <option key={key} value={key}>{value.name}</option>
                ))}
              </select>
              <button
                onClick={() => setShowParticipants(!showParticipants)}
                className="p-2 hover:bg-gray-700 rounded-md"
                title="Show Participants"
              >
                <Users className="w-5 h-5" />
              </button>
            </div>
            
            {isCreator && (
              <button
                onClick={() => setShowAnalysisPanel(!showAnalysisPanel)}
                className="p-2 hover:bg-gray-700 rounded-md"
                title="Toggle Analysis Panel"
              >
                <Brain className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Code Editor */}
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
            onCursorActivity={handleCursorActivity}
            onSelection={handleSelection}
            isUserMuted={isUserMuted}
            cursors={cursors}
            selections={selections}
            activeHighlights={activeHighlights}
            getLanguageExtension={getLanguageExtension}
          />
        </div>

        {/* Notes Panel */}
        {showAnalysisPanel && isCreator && (
          <AnalysisPanel
            isAnalyzing={isAnalyzing}
            handleAnalyzeCode={handleAnalyzeCode}
            analysis={analysis}
            onClose={() => setShowAnalysisPanel(false)}
            addNotification={addNotification}
          />
        )}
      </div>

      {/* Participants List */}
      {showParticipants && (
        <ParticipantsList
          participants={participants}
          isCreator={isCreator}
          mutedUsers={mutedUsers}
          onMuteToggle={(userId) => {
            socket?.emit(mutedUsers.has(userId) ? 'unmute_user' : 'mute_user', { roomId, userId });
          }}
          onKick={(userId) => socket?.emit('kick_user', { roomId, userId })}
          onClose={() => setShowParticipants(false)}
        />
      )}

      {/* Notifications */}
      <NotificationOverlay notifications={notifications} />
    </div>
  );
};

export default RoomPage;