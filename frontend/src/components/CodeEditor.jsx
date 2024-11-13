import { useCallback, useMemo, useEffect, useRef } from 'react';
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

const RemoteCursor = ({ position, username, isTyping }) => {
  if (!position?.top || !position?.left) return null;

  const cursorColor = stringToColor(username);
  
  return (
    <div
      style={{
        position: 'absolute',
        pointerEvents: 'none',
        zIndex: 50,
        transform: 'translate(-2px, 0)',
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <div 
        className="w-0.5 h-5 animate-pulse"
        style={{ 
          backgroundColor: cursorColor,
          boxShadow: `0 0 4px ${cursorColor}`
        }} 
      />
      <div 
        className="absolute left-0 -top-6 flex items-center space-x-1 whitespace-nowrap px-2 py-1 rounded text-white text-xs"
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
  getLanguageExtension,
}) => {
  const editorRef = useRef(null);
  const cursorUpdateTimeoutRef = useRef(null);
  
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

  // Handle cursor position updates
  const handleCursorActivity = useCallback((view) => {
    if (cursorUpdateTimeoutRef.current) {
      clearTimeout(cursorUpdateTimeoutRef.current);
    }

    cursorUpdateTimeoutRef.current = setTimeout(() => {
      const selection = view.state.selection.main;
      const pos = convertCursorPosition(view, selection.head);
      
      if (pos) {
        onCursorActivity?.({
          position: pos,
          isTyping: true
        });
      }
    }, 50);
  }, [onCursorActivity, convertCursorPosition]);

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
          {Array.from(cursors.entries()).map(([userId, { username, position, isTyping }]) => (
            userId !== localStorage.getItem('userId') && (
              <RemoteCursor
                key={userId}
                position={position}
                username={username}
                isTyping={isTyping}
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