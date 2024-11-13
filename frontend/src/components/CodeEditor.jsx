import { useCallback, useMemo, useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark, vscodeLight } from '@uiw/codemirror-theme-vscode';
import { EditorView } from '@codemirror/view';

// Enhanced color generation for usernames
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

const RemoteCursor = ({ position, username, isTyping, isFocused, lastActive }) => {
  if (!position?.top || !position?.left) return null;

  const cursorColor = stringToColor(username);
  const isIdle = Date.now() - lastActive > 5000; // 5 seconds idle threshold

  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 50,
        transform: 'translate(-2px, 0)',
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: isIdle ? 0.5 : 1,
        transition: 'opacity 0.3s ease'
      }}
    >
      <div 
        className={`w-0.5 h-5 ${isTyping ? 'animate-pulse' : ''}`}
        style={{ 
          backgroundColor: cursorColor,
          boxShadow: `0 0 4px ${cursorColor}`
        }} 
      />
      <div 
        className={`absolute left-0 -top-6 flex items-center space-x-1 whitespace-nowrap 
          px-2 py-1 rounded text-white text-xs transition-all duration-200 
          ${isFocused ? 'ring-2 ring-white/20' : ''}`}
        style={{ 
          backgroundColor: cursorColor,
          boxShadow: `0 0 4px ${cursorColor}88`,
        }}
      >
        <span>{username}</span>
        {isTyping && (
          <span className="flex space-x-1">
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </span>
        )}
        {isFocused && !isTyping && (
          <span className="text-[10px] text-white/80">active</span>
        )}
      </div>
    </div>
  );
};

export const CodeEditor = ({
  code = '',
  language,
  onChange,
  onCursorActivity,
  isUserMuted,
  cursors = new Map(),
  fontSize = 'medium',
  theme = 'dark',
  socket,
  roomId,
  getLanguageExtension,
}) => {
  const editorRef = useRef(null);
  const cursorUpdateTimeoutRef = useRef(null);
  const [focusedUsers, setFocusedUsers] = useState(new Set());
  const [lastActivity, setLastActivity] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  
  // Convert cursor positions from CodeMirror coordinates to screen coordinates
  const convertCursorPosition = useCallback((view, pos) => {
    const editorRect = view.dom.getBoundingClientRect();
    const coords = view.coordsAtPos(pos);
    
    if (!coords) return null;
    
    return {
      top: coords.top - editorRect.top,
      left: coords.left - editorRect.left,
    };
  }, []);

  // Handle cursor position updates with typing indicator
  const handleCursorActivity = useCallback((view) => {
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    // Update typing state
    setIsTyping(true);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1500);

    cursorUpdateTimeoutRef.current = setTimeout(() => {
      const selection = view.state.selection.main;
      const pos = convertCursorPosition(view, selection.head);
      
      if (pos) {
        const userId = localStorage.getItem('userId');
        setLastActivity(prev => ({
          ...prev,
          [userId]: Date.now()
        }));
        
        onCursorActivity?.({
          position: pos,
          isTyping: true,
          lastActive: Date.now()
        });
      }
    }, 50);
  }, [onCursorActivity, convertCursorPosition]);

  // Handle focus events
  const handleFocus = useCallback(() => {
    if (!socket || !roomId) return;

    const userId = localStorage.getItem('userId');
    const username = localStorage.getItem('username');

    socket.emit('focus_change', {
      roomId,
      userId,
      username,
      status: 'focusing'
    });
    
    setFocusedUsers(prev => new Set([...prev, userId]));
    setLastActivity(prev => ({
      ...prev,
      [userId]: Date.now()
    }));
  }, [socket, roomId]);

  const handleBlur = useCallback(() => {
    if (!socket || !roomId) return;

    const userId = localStorage.getItem('userId');
    socket.emit('focus_change', {
      roomId,
      userId,
      status: 'blur'
    });
    
    setFocusedUsers(prev => {
      const next = new Set(prev);
      next.delete(userId);
      return next;
    });
  }, [socket, roomId]);

  // Listen for focus change events from other users
  useEffect(() => {
    if (!socket) return;

    const handleFocusChange = ({ userId, status }) => {
      setFocusedUsers(prev => {
        const next = new Set(prev);
        if (status === 'focusing') {
          next.add(userId);
        } else {
          next.delete(userId);
        }
        return next;
      });
    };

    socket.on('focus_change', handleFocusChange);
    return () => {
      socket.off('focus_change', handleFocusChange);
    };
  }, [socket]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (cursorUpdateTimeoutRef.current) {
        clearTimeout(cursorUpdateTimeoutRef.current);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Font size classes
  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  }, [fontSize]);

  return (
    <div className="relative h-full group">
      {isUserMuted && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 text-center">
            <p className="text-yellow-400 font-medium">You are currently muted</p>
            <p className="text-gray-400 text-sm mt-1">The interviewer has temporarily disabled your ability to edit</p>
          </div>
        </div>
      )}

      <div ref={editorRef} className="relative h-full">
        <CodeMirror
          value={code}
          height="100%"
          theme={theme === 'dark' ? vscodeDark : vscodeLight}
          extensions={[getLanguageExtension(language)]}
          onChange={onChange}
          editable={!isUserMuted}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onUpdate={(viewUpdate) => {
            if (viewUpdate.selectionSet) {
              handleCursorActivity(viewUpdate.view);
            }
          }}
          className={`h-full ${fontSizeClass} transition-all duration-200`}
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
        
        <div className="absolute inset-0 pointer-events-none">
          {Array.from(cursors.entries()).map(([userId, { username, position, isTyping: remoteIsTyping }]) => (
            userId !== localStorage.getItem('userId') && (
              <RemoteCursor
                key={userId}
                position={position}
                username={username}
                isTyping={remoteIsTyping}
                isFocused={focusedUsers.has(userId)}
                lastActive={lastActivity[userId] || Date.now()}
              />
            )
          ))}
        </div>
      </div>

      {/* Character count with hover effect */}
      <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="text-xs text-gray-400 bg-gray-800/80 px-2 py-1 rounded cursor-help">
          {code.length} characters
        </div>
      </div>
    </div>
  );
};