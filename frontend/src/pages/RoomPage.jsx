import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Users, Brain, Settings, Clock } from 'lucide-react';
import { languageOptions, getLanguageExtension } from '../pages/languageConfig';
import { CodeEditor } from '../components/CodeEditor';
import { ParticipantsList } from '../components/ParticipantsList';
import { NotificationOverlay } from '../components/NotificationOverlay';
import { JoinRoomForm } from '../components/JoinRoomForm';
import RightPanel from '../components/RightPanel';
import CodeExecutionPanel from '../components/CodeExecutionPanel';


// Header
const RoomHeader = memo(({ 
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
          <select
            value={language}
            onChange={(e) => onLanguageChange(e.target.value)}
            className="bg-gray-700/50 text-white px-3 py-2 rounded-md border border-gray-600 
              focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(languageOptions).map(([key, value]) => (
              <option key={key} value={key}>{value.name}</option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Clock className="w-4 h-4" />
            <span>{formatTime(sessionTime)}</span>
          </div>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className="participants-button flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-gray-700/50"
          >
            <Users className="w-5 h-5" />
            <span>{participants.length}</span>
          </button>

          {isCreator && (
            <button
              onClick={onAnalysisPanelToggle}
              className={`p-2 rounded-md transition-colors ${
                showAnalysisPanel ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-gray-700/50'
              }`}
              title="Toggle Analysis Panel"
            >
              <Brain className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="settings-button p-2 hover:bg-gray-700/50 rounded-md"
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

// Main Room Page Component
const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [socket, setSocket] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator] = useState(localStorage.getItem('isCreator') === 'true');
  
  // Room state
  const [code, setCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [cursors, setCursors] = useState(new Map());
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [isUserMuted, setIsUserMuted] = useState(false);
  
  // UI state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');

  // UI click state
  const participantsRef = useRef(null);
  const settingsRef = useRef(null);
  const participantsButtonRef = useRef(null);
  const settingsButtonRef = useRef(null);
  
  // Analysis state
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Socket connection setup
  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
    });

    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (!socket) return;

    const eventHandlers = {
      user_joined: ({ userId, username }) => {
        setParticipants(prev => [...prev, { userId, username }]);
        addNotification(`${username} joined the room`);
      },
      user_left: (userId) => {
        setParticipants(prev => {
          const user = prev.find(p => p.userId === userId);
          if (user) {
            addNotification(`${user.username} left the room`);
          }
          return prev.filter(p => p.userId !== userId);
        });
      },
      receive_code: (newCode) => setCode(newCode),
      cursor_update: ({ userId, username, position }) => {
        setCursors(prev => new Map(prev.set(userId, { username, position })));
      },
      room_state: ({ code: roomCode, language: roomLang, participants: roomParticipants }) => {
        setCode(roomCode);
        setLanguage(roomLang);
        setParticipants(roomParticipants);
        setIsJoined(true);
      },
      user_muted: (userId) => {
        setMutedUsers(prev => new Set(prev.add(userId)));
        if (userId === localStorage.getItem('userId')) {
          setIsUserMuted(true);
          addNotification('You have been muted by the interviewer');
        }
      },
      user_unmuted: (userId) => {
        setMutedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        if (userId === localStorage.getItem('userId')) {
          setIsUserMuted(false);
          addNotification('You have been unmuted by the interviewer');
        }
      },
      kicked: (userId) => {
        if (userId === localStorage.getItem('userId')) {
          navigate('/');
          addNotification('You have been removed from the room');
        }
      }
    };

    // Register all event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });

    return () => {
      // Cleanup all event handlers
      Object.keys(eventHandlers).forEach(event => {
        socket.off(event);
      });
    };
  }, [socket, navigate]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        // For Participants Panel
        if (showParticipants && 
            participantsRef.current && 
            !participantsRef.current.contains(event.target) &&
            !participantsButtonRef.current?.contains(event.target)) {
          setShowParticipants(false);
        }
        
        // For Settings Panel
        if (showSettings && 
            settingsRef.current && 
            !settingsRef.current.contains(event.target) &&
            !settingsButtonRef.current?.contains(event.target)) {
          setShowSettings(false);
        }
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [showParticipants, showSettings]);

    // Listen for language change
    useEffect(() => {
      if (!socket) return;
    
      socket.on('language_changed', (newLanguage) => {
        console.log('Language changed received:', newLanguage);
        setLanguage(newLanguage);
      });
    
      return () => {
        socket.off('language_changed');
      };
    }, [socket]);
    
    const handleLanguageChange = useCallback((newLang) => {
      console.log('Requesting language change to:', newLang);
      socket?.emit('language_change', { 
        roomId, 
        language: newLang 
      });
    }, [socket, roomId]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Event handlers
  const handleCodeChange = useCallback((newCode) => {
    setCode(newCode);
    socket?.emit('code_change', { roomId, code: newCode });
  }, [socket, roomId]);

  const handleCursorActivity = useCallback((cursorInfo) => {
    socket?.emit('cursor_move', {
      roomId,
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      position: cursorInfo.position,
      isTyping: cursorInfo.isTyping
    });
  }, [socket, roomId]);

  const handleAnalyzeCode = useCallback(async () => {
    if (!code.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis('Failed to analyze code. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language]);

  const addNotification = useCallback((message, type = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const handleMuteToggle = useCallback((userId) => {
    socket?.emit(mutedUsers.has(userId) ? 'unmute_user' : 'mute_user', { roomId, userId });
  }, [socket, roomId, mutedUsers]);

  const handleKickUser = useCallback((userId) => {
    socket?.emit('kick_user', { roomId, userId });
  }, [socket, roomId]);

  if (!isJoined) {
    return <JoinRoomForm socket={socket} roomId={roomId} />;
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      <RoomHeader
        language={language}
        onLanguageChange={handleLanguageChange}
        sessionTime={sessionTime}
        participants={participants}
        showParticipants={showParticipants}
        setShowParticipants={setShowParticipants}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        onAnalysisPanelToggle={() => isCreator && setShowRightPanel(!showRightPanel)}
        showAnalysisPanel={showRightPanel}
        isCreator={isCreator}
      />

      <div className="flex-1 flex">
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg overflow-hidden border border-gray-700/50 bg-gray-900/50">
            <div className="flex flex-col h-full">
              <div className="flex-1 min-h-0"> {/* Add min-h-0 to allow proper flex behavior */}
                <CodeEditor
                  code={code}
                  language={language}
                  onChange={handleCodeChange}
                  onCursorActivity={handleCursorActivity}
                  isUserMuted={isUserMuted}
                  cursors={cursors}
                  fontSize={fontSize}
                  theme={theme}
                  getLanguageExtension={getLanguageExtension}
                  selections={[]}
                  activeHighlights={[]}
                />
              </div>
              <CodeExecutionPanel 
                code={code}
                language={language}
              />
            </div>
          </div>
        </div>
        
        {showRightPanel && (
          <RightPanel
            isCreator={isCreator}
            analysis={analysis}
            isAnalyzing={isAnalyzing}
            handleAnalyzeCode={handleAnalyzeCode}
            onClose={() => setShowRightPanel(false)}
            language={language}
            onCodeChange={handleCodeChange}
          />
        )}
      </div>

      {showParticipants && (
        <ParticipantsList
          participants={participants}
          isCreator={isCreator}
          mutedUsers={mutedUsers}
          onMuteToggle={handleMuteToggle}
          onKick={handleKickUser}
          onClose={() => setShowParticipants(false)}
        />
      )}

      {showSettings && (
        <div className="settings-panel absolute right-4 top-16 w-64 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Settings</h3>
            <button
              onClick={() => setShowSettings(false)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-gray-700/50 rounded-md p-2 border border-gray-600"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(e.target.value)}
                className="w-full bg-gray-700/50 rounded-md p-2 border border-gray-600"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
      )}
      
      <NotificationOverlay notifications={notifications} />
    </div>
  );
};

export default RoomPage;