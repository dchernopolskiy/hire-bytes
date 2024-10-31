import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { motion, AnimatePresence } from 'framer-motion';
import { languageOptions, getLanguageExtension, getDefaultTemplate } from './languageConfig';
import ReactMarkdown from 'react-markdown';
import { Users, Brain, X, VolumeX, Volume2, ClipboardCopy } from 'lucide-react';
import { EditorView, Decoration } from '@codemirror/view';

// Helper function to generate colors from usernames
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const cursorTimeoutRef = useRef(null);
  
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState('// Start coding here');
  const [language, setLanguage] = useState('javascript');
  const [participants, setParticipants] = useState([]);
  const [showParticipants, setShowParticipants] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [notes, setNotes] = useState('');
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [mutedUsers, setMutedUsers] = useState(new Set());
  const [cursors, setCursors] = useState(new Map());
  const [isJoined, setIsJoined] = useState(false);
  const [isCreator, setIsCreator] = useState(localStorage.getItem('isCreator') === 'true');
  const [isUserMuted, setIsUserMuted] = useState(false);
  const [lastCursorActivity, setLastCursorActivity] = useState(new Map());
  const CURSOR_TIMEOUT = 60000; // 1 minute for cursor disappearance
  const [sharedSelection, setSharedSelection] = useState(null);
  const [selections, setSelections] = useState(new Map());

  const selectionHighlights = useMemo(() => {
    return EditorView.decorations.of((view) => {
      let decorations = [];
      selections.forEach(({ username, selection }, userId) => {
        const color = stringToColor(username);
        decorations.push(Decoration.mark({
          attributes: {
            style: `background-color: ${color}33;
                   border-bottom: 2px solid ${color};`
          }
        }).range(selection.from, selection.to));
      });
      return Decoration.set(decorations);
    });
  }, [selections]);

      // notification helper
      const addNotification = useCallback((message, type) => {
      const id = Date.now();
      setNotifications(prev => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }, []);

      useEffect(() => {
      if (isCreator) {
        setShowAnalysisPanel(true);
      }
    }, [isCreator]); 

    // Socket initialization
    useEffect(() => {
      const newSocket = io(import.meta.env.VITE_API_URL);
      setSocket(newSocket);
      return () => newSocket.disconnect();
    }, []);

    // Socket event handlers setup
    useEffect(() => {
      if (!socket) return;

    // Handle user joined event
    socket.on('user_joined', (user) => {
      console.log('User joined:', user);
      setParticipants(prev => [...prev.filter(p => p.userId !== user.userId), user]);
      addNotification(`${user.username} joined the room`, 'info');
    });

    // Handle code updates
    socket.on('receive_code', (newCode) => {
      console.log('Received code update');
      setCode(newCode);
    });

    // Handle cursor updates
    socket.on('cursor_update', ({ userId, username, position }) => {
      if (userId !== localStorage.getItem('userId')) {
        setCursors(prev => new Map(prev).set(userId, { username, position }));
      }
    });

    // Handle user mute events
    socket.on('user_muted', (userId) => {
      if (userId === localStorage.getItem('userId')) {
        setIsUserMuted(true);
        addNotification("You've been muted by the host", 'muted');
      }
      setMutedUsers(prev => new Set([...prev, userId]));
    });

    // Handle user unmute events
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

    // Handle kick events
    socket.on('kicked', (userId) => {
      if (userId === localStorage.getItem('userId')) {
        addNotification("You've been removed from the room", 'kicked');
        setTimeout(() => navigate('/'), 2000);
      } else {
        // Remove kicked user from participants list
        setParticipants(prev => prev.filter(p => p.userId !== userId));
      }
    });

    // Handle highlighting code
    socket.on('selection_update', ({ userId, username, selection }) => {
      if (userId !== localStorage.getItem('userId')) {
        setSelections(prev => {
          const newSelections = new Map(prev);
          if (selection.from === selection.to) {
            // If it's just a cursor position, remove the highlight
            newSelections.delete(userId);
          } else {
            // If there's a selection, add it
            newSelections.set(userId, { username, selection });
          }
          return newSelections;
        });
      }
    });

    // Handle user left events
    socket.on('user_left', (userId) => {
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });
      setParticipants(prev => {
        const filtered = prev.filter(p => p.userId !== userId);
        const leftUser = prev.find(p => p.userId === userId);
        if (leftUser) {
          addNotification(`${leftUser.username} left the room`, 'info');
        }
        return filtered;
      });
    });

    // Join room on connection
    const username = localStorage.getItem('username');
    const userId = localStorage.getItem('userId');
    if (username && userId) {
      socket.emit('join_room', { roomId, userId, username, isCreator });

      socket.on('room_state', ({ code: initialCode, language: initialLanguage, participants: initialParticipants }) => {
        console.log('Received initial state:', { initialCode, initialLanguage, initialParticipants });
        if (initialCode) setCode(initialCode);
        if (initialLanguage) setLanguage(initialLanguage);
        if (initialParticipants) setParticipants(initialParticipants);
        setIsJoined(true);
      });
    }

    // Add error handler
    socket.on('error', ({ message }) => {
      addNotification(message, 'error');
      if (message === 'Room not found') {
        // Redirect to home if room doesn't exist
        navigate('/');
      }
    });

    socket.on('room_state', ({ code: initialCode, language: initialLanguage, participants: initialParticipants }) => {
      console.log('Received initial state:', { initialCode, initialLanguage, initialParticipants });
      if (initialCode) setCode(initialCode);
      if (initialLanguage) setLanguage(initialLanguage);
      if (initialParticipants) setParticipants(initialParticipants);
      setIsJoined(true);  // This will remove the join form
    });

    // Cleanup
    return () => {
      socket.off('user_joined');
      socket.off('receive_code');
      socket.off('cursor_update');
      socket.off('user_muted');
      socket.off('user_unmuted');
      socket.off('kicked');
      socket.off('user_left');
      socket.off('room_state');
    };
  }, [socket, roomId, navigate, isCreator, addNotification]);

  // Handle code changes (keep only this version)
  const handleCodeChange = useCallback((value) => {
    if (isUserMuted) {
      addNotification("You cannot edit code while muted", 'muted');
      return;
    }
    
    setCode(value);
    if (socket) {
      socket.emit('code_change', { roomId, code: value });
    }
  }, [socket, roomId, isUserMuted]);

  // Handle language changes
  const handleLanguageChange = useCallback((newLanguage) => {
    setLanguage(newLanguage);
    if (!code || code === getDefaultTemplate(language)) {
      setCode(getDefaultTemplate(newLanguage));
    }
  }, [code, language]);

  // Handle cursor updates
const handleCursorUpdate = useCallback((view) => {
  if (!socket || !view) return;

  if (cursorTimeoutRef.current) {
    clearTimeout(cursorTimeoutRef.current);
  }

  cursorTimeoutRef.current = setTimeout(() => {
    const selection = view.state.selection.main;
    const pos = view.coordsAtPos(selection.head);
    
    if (!pos) return;

    // Get the editor container and its scroll
    const editorContainer = view.scrollDOM;
    const rect = editorContainer.getBoundingClientRect();
    const scrollPos = {
      top: editorContainer.scrollTop,
      left: editorContainer.scrollLeft
    };

    // Calculate position relative to the text content
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

    setLastCursorActivity(prev => new Map(prev).set(localStorage.getItem('userId'), Date.now()));
  }, 50);
}, [socket, roomId]);

// Add cursor cleanup
useEffect(() => {
  const interval = setInterval(() => {
    const now = Date.now();
    setCursors(prev => {
      const newCursors = new Map(prev);
      for (const [userId, cursor] of newCursors) {
        const lastActivity = lastCursorActivity.get(userId);
        if (lastActivity && now - lastActivity > CURSOR_TIMEOUT) {
          newCursors.delete(userId);
        }
      }
      return newCursors;
    });
  }, 10000); // Check every 10 seconds

  return () => clearInterval(interval);
}, [lastCursorActivity]);

  const handleSelection = useCallback((viewUpdate) => {
    if (!socket) return;
    
    const { from, to } = viewUpdate.state.selection.main;
    // Always emit the selection update, not just for non-empty selections
    socket.emit('selection_update', {
      roomId,
      userId: localStorage.getItem('userId'),
      username: localStorage.getItem('username'),
      selection: { from, to }
    });

    // Update local selections state
    setSelections(prev => {
      const newSelections = new Map(prev);
      if (from === to) {
        // Clear selection when there's no active selection
        newSelections.delete(localStorage.getItem('userId'));
      } else {
        // Update selection when text is selected
        newSelections.set(localStorage.getItem('userId'), {
          username: localStorage.getItem('username'),
          selection: { from, to }
        });
      }
      return newSelections;
    });
  }, [socket, roomId]);

  // Handle user muting
  const handleMuteToggle = useCallback((userId) => {
    if (!socket || !isCreator) return;
    
    if (mutedUsers.has(userId)) {
      socket.emit('unmute_user', { roomId, userId });
    } else {
      socket.emit('mute_user', { roomId, userId });
    }
  }, [socket, roomId, isCreator, mutedUsers]);

  // Handle code analysis
  const handleAnalyzeCode = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch('https://hirebytes.onrender.com/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code,
          language
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Analysis failed');
      }

      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysis(`Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

//participant menu closure
  const participantsRef = useRef(null);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (participantsRef.current && !participantsRef.current.contains(event.target)) {
      setShowParticipants(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);

  // Join Room Form component
  const JoinRoomForm = () => {
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!username.trim()) {
        setError('Please enter a name');
        return;
      }
      const userId = Math.random().toString(36).substr(2, 9);
      localStorage.setItem('username', username);
      localStorage.setItem('userId', userId);
      localStorage.setItem('isCreator', 'false'); // Add this line to ensure proper role
      socket?.emit('join_room', { roomId, userId, username, isCreator: false });
    };

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
          <h2 className="text-2xl font-bold text-white mb-6">Join Room</h2>
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

  // Remote cursor component
const RemoteCursor = ({ position, username }) => {
  if (!position?.x || !position?.y) return null;

  const cursorColor = stringToColor(username);
  const editorContainer = document.querySelector('.cm-editor');
  if (!editorContainer) return null;

  // Adjust position based on scroll
  const scrollPos = {
    top: editorContainer.scrollTop,
    left: editorContainer.scrollLeft
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x - scrollPos.left}px`,
        top: `${position.y - scrollPos.top}px`,
        pointerEvents: 'none',
        zIndex: 50,
        transform: 'translate(-2px, 0)',
      }}
    >
      <div 
        className="w-0.5 h-5"
        style={{ 
          backgroundColor: cursorColor,
          boxShadow: `0 0 2px ${cursorColor}`
        }} 
      />sss
      <span 
        className="px-1.5 py-0.5 text-xs rounded whitespace-nowrap text-white absolute left-0 -top-6"
        style={{ 
          backgroundColor: cursorColor,
          boxShadow: `0 0 4px ${cursorColor}88`
        }}
      >
        {username}
      </span>
    </div>
  );
};

// AnalysisPanel component
  const AnalysisPanel = ({ 
    isAnalyzing, 
    handleAnalyzeCode, 
    analysis, 
    showAnalysisPanel, 
    setShowAnalysisPanel,
    notes,
    setNotes,
    setNotifications
  }) => {
  const textareaRef = useRef(null);
  const copyNotes = () => {
    navigator.clipboard.writeText(notes);
    setNotifications(prev => [...prev, { 
      id: Date.now(), 
      message: 'Notes copied to clipboard', 
      type: 'success' 
    }]);
  };

  const insertBulletPoint = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const beforeCursor = notes.substr(0, start);
    const afterCursor = notes.substr(start);
    const newText = `${beforeCursor}• ${afterCursor}`;
    setNotes(newText);
    textarea.focus();
  };

  const toggleBold = () => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = notes.substring(start, end);
    
    if (selectedText) {
      const beforeSelection = notes.substring(0, start);
      const afterSelection = notes.substring(end);
      const newText = `${beforeSelection}**${selectedText}**${afterSelection}`;
      setNotes(newText);
      textarea.focus();
    }
  };

  return (
    <div className="w-80 border-l border-gray-700 flex flex-col bg-gray-900">
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Analysis & Notes</h2>
          <button
            onClick={() => setShowAnalysisPanel(false)}
            className="p-1 hover:bg-gray-700 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-yellow-400 mt-2">
          ⚠️ Analysis and notes are only visible to you (the interviewer)
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Analysis Section */}
        <div className="space-y-4">
          <button
            onClick={handleAnalyzeCode}
            disabled={isAnalyzing}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50
              text-white px-4 py-2 rounded-md transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              focus:ring-offset-gray-800 disabled:cursor-not-allowed
              flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              'Analyzing...'
            ) : (
              <>
                <Brain className="w-4 h-4" />
                Analyze Code
              </>
            )}
          </button>

          {analysis && (
            <div className="bg-gray-800 rounded-md p-4">
              <h3 className="text-sm font-medium text-gray-400 mb-2">Analysis Results</h3>
              <p className="text-sm whitespace-pre-wrap">{analysis}</p>
            </div>
          )}
        </div>

        {/* Notes Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-400">Interview Notes</h3>
            <div className="flex gap-2">
              <button
                onClick={insertBulletPoint}
                className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded text-gray-300"
                title="Add bullet point"
              >
                •
              </button>
              <button
                onClick={toggleBold}
                className="p-1.5 px-2 bg-gray-700 hover:bg-gray-600 rounded font-bold text-gray-300"
                title="Bold text"
              >
                B
              </button>
            </div>
          </div>
          
          <textarea
            ref={textareaRef}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onFocus={(e) => e.preventDefault()}
            placeholder="Take notes during the interview...
- Use bullet points
- Use **bold** text for emphasis"
            className="w-full h-64 px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              placeholder:text-gray-600 text-sm font-mono"
          />

          <button
            onClick={copyNotes}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-md
              transition-colors text-sm flex items-center justify-center gap-2"
          >
            <ClipboardCopy className="w-4 h-4" />
            Copy Notes
          </button>
        </div>
      </div>
    </div>
  );
};

  // Show join screen if not joined and not creator
  if (!isJoined && !localStorage.getItem('isCreator')) {
    return <JoinRoomForm />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* Main coding area */}
        <div className={`flex-1 flex flex-col ${showAnalysisPanel ? 'mr-80' : ''}`}>
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(languageOptions).map(([key, value]) => (
                  <option key={key} value={key} className="bg-gray-800">
                    {value.name}
                  </option>
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
            <div className="flex items-center space-x-2">
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
          </div>
          
          {/* Editor with cursor tracking */}
          <div className="flex-1 overflow-hidden relative">
          <CodeMirror
            value={code}
            height="100%"
            theme={vscodeDark}
            extensions={[
              getLanguageExtension(language),
              selectionHighlights  // Add this
            ]}
            onChange={handleCodeChange}
            editable={!isUserMuted}
            onUpdate={(viewUpdate) => {
              if (viewUpdate.selectionSet) {
                handleCursorUpdate(viewUpdate.view);
                handleSelection(viewUpdate);
              }
            }}
            className="h-full"
            basicSetup={{
              lineNumbers: true,
              highlightActiveLineGutter: true,
              highlightSpecialChars: true,
              foldGutter: true,
              drawSelection: true,
              dropCursor: true,
              allowMultipleSelections: true,
              indentOnInput: true,
              bracketMatching: true,
              closeBrackets: true,
              autocompletion: true,
              rectangularSelection: true,
              crosshairCursor: true,
              highlightActiveLine: true,
              highlightSelectionMatches: true,
              closeBracketsKeymap: true,
              defaultKeymap: true,
              searchKeymap: true,
              historyKeymap: true,
              foldKeymap: true,
              completionKeymap: true,
              lintKeymap: true,
            }}
          />
            
            {/* Remote cursors */}
            <div className="absolute inset-0 pointer-events-none">
              {Array.from(cursors.entries()).map(([userId, { username, position }]) => (
                userId !== localStorage.getItem('userId') && (
                  <RemoteCursor
                    key={userId}
                    position={position}
                    username={username}
                  />
                )
              ))}
            </div>
          </div>
        </div>

      {showAnalysisPanel && isCreator && (
        <AnalysisPanel
          isAnalyzing={isAnalyzing}
          handleAnalyzeCode={handleAnalyzeCode}
          analysis={analysis}
          showAnalysisPanel={showAnalysisPanel}
          setShowAnalysisPanel={setShowAnalysisPanel}
          notes={notes}
          setNotes={setNotes}
          setNotifications={setNotifications}
        />
      )}
      </div>


      {/* Participants List */}
        {showParticipants && (
          <div 
            ref={participantsRef}
            className="absolute top-16 left-4 w-64 bg-gray-800 rounded-md shadow-lg z-50"
          >
          <div className="p-4">
            <h3 className="text-sm font-medium mb-2">Participants</h3>
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
                        onClick={() => handleMuteToggle(participant.userId)}
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
                        onClick={() => socket?.emit('kick_user', { roomId, userId: participant.userId })}
                        className="p-1 rounded-md bg-red-500/20 text-red-500 hover:bg-red-500/30"
                        title="Kick user"
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
      )}

      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(({ id, message, type }) => (
          <motion.div
            key={id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 p-4 rounded-md shadow-lg z-[100] ${
              type === 'kicked' ? 'bg-red-500/20 text-red-400 border border-red-500/20' : 
              type === 'muted' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/20' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/20'
            }`}
          >
            {message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default RoomPage;