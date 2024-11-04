import { useCallback, useMemo } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { EditorView, Decoration } from '@codemirror/view';

// Helper function for generating colors from usernames
const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

// Remote cursor component
const RemoteCursor = ({ position, username }) => {
  if (!position?.x || !position?.y) return null;

  const cursorColor = stringToColor(username);
  
  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
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
      />
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

export const CodeEditor = ({
  code,
  language,
  onChange,
  onCursorActivity,
  onSelection,
  isUserMuted,
  cursors,
  selections,
  activeHighlights,
  getLanguageExtension
}) => {
  // Cursor decoration
  const cursorHighlights = useMemo(() => {
    return EditorView.decorations.of((view) => {
      let decorations = [];
      activeHighlights.forEach(({ selection, color }) => {
        decorations.push(Decoration.mark({
          attributes: {
            style: `background-color: ${color}33; border-bottom: 2px solid ${color};`
          }
        }).range(selection.from, selection.to));
      });
      return Decoration.set(decorations);
    });
  }, [activeHighlights]);

  // Selection decoration
  const selectionHighlights = useMemo(() => {
    return EditorView.decorations.of((view) => {
      let decorations = [];
      selections.forEach(({ username, selection }, userId) => {
        const color = stringToColor(username);
        decorations.push(Decoration.mark({
          attributes: {
            style: `background-color: ${color}33; border-bottom: 2px solid ${color};`
          }
        }).range(selection.from, selection.to));
      });
      return Decoration.set(decorations);
    });
  }, [selections]);

  // Handle editor updates
  const handleUpdate = useCallback((viewUpdate) => {
    if (viewUpdate.selectionSet) {
      const view = viewUpdate.view;
      
      // Only track cursor if it's within the editor
      const editorRect = view.dom.getBoundingClientRect();
      const mousePos = { x: window.event?.clientX, y: window.event?.clientY };
      
      if (mousePos.x && mousePos.y && 
          mousePos.x >= editorRect.left && mousePos.x <= editorRect.right &&
          mousePos.y >= editorRect.top && mousePos.y <= editorRect.bottom) {
        onCursorActivity?.(view);
      }
      
      onSelection?.(viewUpdate);
    }
  }, [onCursorActivity, onSelection]);

  return (
    <div className="relative h-full">
      <CodeMirror
        value={code}
        height="100%"
        theme={vscodeDark}
        extensions={[
          getLanguageExtension(language),
          cursorHighlights,
          selectionHighlights
        ]}
        onChange={onChange}
        editable={!isUserMuted}
        onUpdate={handleUpdate}
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
  );
};