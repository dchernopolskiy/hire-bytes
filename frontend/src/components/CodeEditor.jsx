import { useCallback, useMemo, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import { javascript } from '@codemirror/lang-javascript';
import { ViewPlugin, Decoration, EditorView } from '@codemirror/view';
import { StateField, StateEffect } from '@codemirror/state';
import { EditorCursor } from './CursorManager';

// Shared document position mapping
const addRemoteSelection = StateEffect.define();
const removeRemoteSelection = StateEffect.define();

// Remote selection decoration
const remoteSelectionField = StateField.define({
  create() {
    return Decoration.none;
  },
  update(selections, tr) {
    // If there are document changes, we need to carefully map the selections
    if (tr.docChanged) {
      try {
        selections = selections.map(tr.changes);
      } catch (err) {
        console.warn('Failed to map selections:', err);
        return Decoration.none; // Reset selections if mapping fails
      }
    }

    // Handle selection effects
    for (let effect of tr.effects) {
      if (effect.is(addRemoteSelection)) {
        const { from, to, userId, color } = effect.value;
        
        // Validate positions are within document bounds
        const docLength = tr.state.doc.length;
        if (from > docLength || to > docLength) {
          console.warn('Selection out of bounds:', { from, to, docLength });
          continue;
        }

        try {
          selections = selections.update({
            add: [createRemoteSelection({
              from: Math.min(from, docLength),
              to: Math.min(to, docLength),
              userId,
              color
            })]
          });
        } catch (err) {
          console.warn('Failed to add selection:', err);
        }
      } else if (effect.is(removeRemoteSelection)) {
        try {
          selections = selections.update({
            filter: (from, to, value) => value.id !== effect.value
          });
        } catch (err) {
          console.warn('Failed to remove selection:', err);
        }
      }
    }
    return selections;
  },
  provide: f => EditorView.decorations.from(f)
});

const createRemoteSelection = ({ from, to, userId, color }) => {
  // Ensure valid range and default to cursor position if no selection
  if (from === to || !from || !to) {
    return Decoration.mark({
      attributes: { 
        class: `remote-cursor-${userId}`,
        style: `background-color: ${color}`
      },
      inclusive: true
    }).range(from, from + 1); // Make it a 1-character selection
  }
  
  return Decoration.mark({
    attributes: { 
      class: `remote-selection-${userId}`,
      style: `background-color: ${color}`
    },
    inclusive: true
  }).range(from, to);
};

export const CodeEditor = ({
  code,
  language,
  onChange,
  onCursorActivity,
  isUserMuted,
  cursors,
  fontSize = 'medium',
  theme = 'dark',
  socket,
  roomId,
  getLanguageExtension,
}) => {
  const editorRef = useRef(null);
  const cursorSyncTimeout = useRef(null);
  const selectionSyncTimeout = useRef(null);

  // Remote cursor sync handler
  const handleRemoteCursorUpdate = useCallback((view, changes) => {
    if (!socket || !roomId) return;
  
    if (cursorSyncTimeout.current) {
      clearTimeout(cursorSyncTimeout.current);
    }
  
    cursorSyncTimeout.current = setTimeout(() => {
      const position = view.state.selection.main.head;
      const docLength = view.state.doc.length;
      
      // Ensure position is within bounds
      const safePosition = Math.min(position, docLength);
      
      socket.emit('cursor_activity', {
        roomId,
        userId: localStorage.getItem('userId'),
        username: localStorage.getItem('username'),
        position: safePosition,
        isTyping: changes?.docChanged || false
      });
    }, 50);
  }, [socket, roomId]);

  // Remote selection sync handler
  const handleRemoteSelectionUpdate = useCallback((view) => {
    if (!socket || !roomId) return;
  
    if (selectionSyncTimeout.current) {
      clearTimeout(selectionSyncTimeout.current);
    }
  
    selectionSyncTimeout.current = setTimeout(() => {
      const selection = view.state.selection;
      const docLength = view.state.doc.length;
      
      const ranges = selection.ranges.map(range => ({
        from: Math.min(range.from, docLength),
        to: Math.min(range.to, docLength)
      }));
  
      socket.emit('selection_update', {
        roomId,
        userId: localStorage.getItem('userId'),
        ranges
      });
    }, 50);
  }, [socket, roomId]);

  // Editor configuration and extensions
  const extensions = useMemo(() => [
    getLanguageExtension(language),
    remoteSelectionField,
    ViewPlugin.fromClass(class {
      update(update) {
        if (update.docChanged) {
          handleRemoteCursorUpdate(update.view, update.changes);
        }
        if (update.selectionSet) {
          handleRemoteSelectionUpdate(update.view);
        }
      }
    }),
    EditorView.theme({
      "&": {
        height: "100%",
      },
      ".cm-scroller": {
        fontFamily: "MonoLisa, Menlo, Monaco, 'Courier New', monospace",
        overflow: "auto",
      },
      ".cm-content": {
        padding: "1rem 0",
        minHeight: "100%"
      },
      ".remote-selection": {
        backgroundColor: "rgba(250, 129, 0, .4)",
        borderRadius: "2px"
      },
      ".remote-cursor": {
        borderLeft: "2px solid currentColor",
        marginLeft: "-1px"
      }
    })
  ], [language, handleRemoteCursorUpdate, handleRemoteSelectionUpdate, getLanguageExtension]);

  // Handle remote cursor and selection updates

  const handleSelectionUpdate = useCallback(({ userId, ranges }) => {
    if (userId === localStorage.getItem('userId')) return;
  
    const view = editorRef.current?.view;
    if (!view) return;
  
    // Get current document length 
    const docLength = view.state.doc.length;
  
    if (!ranges?.length) {
      // Handle selection clear
      view.dispatch({
        effects: [removeRemoteSelection.of(userId)]
      });
      return;
    }
    
    // Validate and sanitize ranges
    const validRanges = ranges.map(range => ({
      from: Math.min(Math.max(0, range.from), docLength),
      to: Math.min(Math.max(0, range.to), docLength)
    }));
  
    // Generate unique color for user
    const color = `hsla(${userId.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 360}, 70%, 50%, 0.4)`;
  
    view.dispatch({
      effects: [
        addRemoteSelection.of({
          from: validRanges[0].from,
          to: validRanges[0].to,
          userId,
          color
        })
      ]
    });
  }, []);

  useEffect(() => {
  if (!socket || !editorRef.current) return;

  socket.on('selection_update', handleSelectionUpdate);
  socket.on('selection_clear', ({ userId }) => {
    if (editorRef.current?.view) {
      editorRef.current.view.dispatch({
        effects: [removeRemoteSelection.of(userId)]
      });
    }
  });

  return () => {
    socket.off('selection_update', handleSelectionUpdate);
    socket.off('selection_clear');
  };
}, [socket, handleSelectionUpdate]);

    socket.on('selection_clear', ({ userId }) => {
    if (editorRef.current?.view) {
      editorRef.current.view.dispatch({
        effects: [removeRemoteSelection.of(userId)]
      });
    }
  });

  const fontSizeClass = useMemo(() => {
    switch (fontSize) {
      case 'small': return 'text-sm';
      case 'large': return 'text-lg';
      default: return 'text-base';
    }
  }, [fontSize]);

  return (
    <div className="relative h-full flex flex-col">
      {isUserMuted && (
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 
          flex items-center justify-center">
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <p className="text-yellow-400">You are currently muted</p>
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0 relative">
        <CodeMirror
          ref={editorRef}
          value={code}
          height="100%"
          theme={theme === 'dark' ? vscodeDark : undefined}
          extensions={extensions}
          onChange={onChange}
          editable={!isUserMuted}
          className={`h-full ${fontSizeClass}`}
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

        {/* Remote Cursors Overlay */}
        <div className="absolute inset-0 pointer-events-none">
          {Array.from(cursors.entries()).map(([userId, cursor]) => (
            userId !== localStorage.getItem('userId') && (
              <EditorCursor
                key={userId}
                userId={userId}
                username={cursor.username}
                position={cursor.position}
                isTyping={cursor.isTyping}
              />
            )
          ))}
        </div>
      </div>
    </div>
  );
};