import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useCodeSync } from '../services/useCodeSync';
import { useCollaboration } from '../services/useCollaboration';
import { RoomHeader } from '../components/RoomHeader';
import { CodeEditor } from '../components/CodeEditor';
import { ParticipantsList } from '../components/ParticipantsList';
import { NotificationOverlay } from '../components/NotificationOverlay';
import { JoinRoomForm } from '../components/JoinRoomForm';
import RightPanel from '../components/RightPanel';
import CodeExecutionPanel from '../components/CodeExecutionPanel';
import { languageOptions, getLanguageExtension } from './languageConfig';

export default function RoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  // Core state
  const [socket, setSocket] = useState(null);
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator] = useState(localStorage.getItem('isCreator') === 'true');
  
  // Room state managed by custom hooks
  const {
    code,
    setCode,
    language,
    setLanguage,
    handleCodeChange,
    handleLanguageChange,
  } = useCodeSync(socket, roomId);

  const {
    participants,
    cursors,
    mutedUsers,
    isUserMuted,
    handleCursorActivity,
    handleMuteToggle,
    handleKickUser,
    addNotification
  } = useCollaboration(socket, roomId);
  
  // UI state
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [sessionTime, setSessionTime] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [fontSize, setFontSize] = useState('medium');
  
  // Analysis state
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Single socket initialization with enhanced error handling
  useEffect(() => {
    console.log('Initializing socket connection...');
    const newSocket = io(import.meta.env.VITE_API_URL, {
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      timeout: 10000
    });

    newSocket.on('connect_error', (error) => {
      addNotification('Connection error. Retrying...', 'error');
      console.error('Socket connection error:', error);
    });

    newSocket.on('connect', () => {
      addNotification('Connected to server', 'success');
      console.log('Socket connected successfully');
    });

    newSocket.on('disconnect', (reason) => {
      addNotification('Disconnected from server. Attempting to reconnect...', 'warning');
      console.log('Socket disconnected:', reason);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      newSocket?.disconnect();
    };
  }, []);

  // Room state handling
  useEffect(() => {
    if (!socket) return;
  
    const handleRoomState = (state) => {
      console.log('Received room state', state);
      setIsJoined(true);
    };
  
    socket.on('room_state', handleRoomState);
    return () => socket.off('room_state', handleRoomState);
  }, [socket]);

  // Session timer with persistence
  useEffect(() => {
    const savedTime = parseInt(sessionStorage.getItem(`session_time_${roomId}`)) || 0;
    setSessionTime(savedTime);

    const timer = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 1;
        sessionStorage.setItem(`session_time_${roomId}`, newTime.toString());
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [roomId]);

  // Logging
  useEffect(() => {
    console.log('Room state:', {
      isJoined,
      socketConnected: !!socket,
      participants,
      code
    });
  }, [isJoined, socket, participants, code]);

  // Code analysis handler with rate limiting
  const handleAnalyzeCode = useCallback(async () => {
    if (!code.trim() || isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalysis(data.analysis);
      addNotification('Code analysis completed', 'success');
    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysis('Failed to analyze code. Please try again.');
      addNotification('Code analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  }, [code, language, isAnalyzing]);

  // Room exit handler - potential for onbeforeunload?
  // const handleExit = useCallback(() => {
  //   const confirmExit = window.confirm('Are you sure you want to leave the room?');
  //   if (confirmExit) {
  //     socket?.disconnect();
  //     navigate('/');
  //   }
  // }, [navigate, socket]);

  // Join room gate
  if (!isJoined) {
    return <JoinRoomForm socket={socket} roomId={roomId} onJoin={() => setIsJoined(true)} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
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
        // onExit={handleExit}
      />

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 p-4">
          <div className="h-[calc(100vh-87px)] rounded-lg border border-gray-700 
            bg-gray-900/50 shadow-lg flex flex-col">
            <div className="flex-1 min-h-0">
              <CodeEditor
                code={code}
                language={language}
                onChange={handleCodeChange}
                onCursorActivity={handleCursorActivity}
                isUserMuted={isUserMuted}
                cursors={cursors}
                fontSize={fontSize}
                theme={theme}
                socket={socket}
                roomId={roomId}
                getLanguageExtension={getLanguageExtension}
              />
            </div>
            <CodeExecutionPanel 
              code={code}
              language={language}
            />
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
            socket={socket}
            roomId={roomId}
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
        <div className="absolute right-4 top-16 w-64 bg-gray-800/95 backdrop-blur-sm 
          rounded-lg shadow-xl border border-gray-700 p-4 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Settings</h3>
            <button 
              onClick={() => setShowSettings(false)} 
              className="text-gray-400 hover:text-white transition-colors"
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
                className="w-full bg-gray-700/50 rounded-md p-2 border border-gray-600
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full bg-gray-700/50 rounded-md p-2 border border-gray-600
                  focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
            
            {/* Performance Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Editor Performance</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localStorage.getItem('optimize_cursor_sync') === 'true'}
                    onChange={(e) => {
                      localStorage.setItem('optimize_cursor_sync', e.target.checked);
                      window.location.reload();
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500
                      focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm">Optimize cursor syncing</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localStorage.getItem('disable_animations') === 'true'}
                    onChange={(e) => {
                      localStorage.setItem('disable_animations', e.target.checked);
                      window.location.reload();
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500
                      focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm">Disable animations</span>
                </label>
              </div>
            </div>

            {/* Accessibility Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Accessibility</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localStorage.getItem('high_contrast') === 'true'}
                    onChange={(e) => {
                      localStorage.setItem('high_contrast', e.target.checked);
                      window.location.reload();
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500
                      focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm">High contrast mode</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={localStorage.getItem('reduce_motion') === 'true'}
                    onChange={(e) => {
                      localStorage.setItem('reduce_motion', e.target.checked);
                      window.location.reload();
                    }}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500
                      focus:ring-blue-500 mr-2"
                  />
                  <span className="text-sm">Reduce motion</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <NotificationOverlay 
        notifications={notifications}
        onDismiss={(id) => setNotifications(prev => 
          prev.filter(n => n.id !== id)
        )} 
      />
    </div>
  );
}