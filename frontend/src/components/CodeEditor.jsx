import { useCallback, useMemo, useEffect, useRef } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
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
    if (tr.docChanged) {
      try {
        selections = selections.map(tr.changes);
      } catch (err) {
        return Decoration.none;
      }
    }

    for (let effect of tr.effects) {
      if (effect.is(addRemoteSelection)) {
        const { from, to, userId, color } = effect.value;
        
        const docLength = tr.state.doc.length;
        if (from >= docLength || to > docLength) {
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
          continue;
        }
      }
    }
    return selections;
  },
  provide: f => EditorView.decorations.from(f)
});

const createRemoteSelection = ({ from, to, userId, color }) => {
  if (from === to || !from || !to) {
    return Decoration.mark({
      attributes: { 
        class: `remote-cursor-${userId}`,
        style: `background-color: ${color}`
      },
      inclusive: true
    }).range(from, from + 1);
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
  setCursors
}) => {
  const editorRef = useRef(null);
  const cursorSyncTimeout = useRef(null);
  const selectionSyncTimeout = useRef(null);

  // Debug mounting
  useEffect(() => {
    console.log('CodeEditor mounted with:', {
      socketId: socket?.id,
      socketConnected: socket?.connected,
      roomId,
      cursorCount: cursors.size,
      cursorsEntries: Array.from(cursors.entries())
    });
  }, [socket, roomId, cursors]);

  // Handle cursor selection updates
  const handleSelectionUpdate = useCallback(({ userId, ranges }) => {
    if (userId === localStorage.getItem('userId')) return;
  
    const view = editorRef.current?.view;
    if (!view) return;
  
    const docLength = view.state.doc.length;
  
    view.dispatch({
      effects: [removeRemoteSelection.of(userId)]
    });
  
    if (!ranges?.length || (ranges[0].from === ranges[0].to)) {
      return;
    }
  
    const validRanges = ranges.map(range => ({
      from: Math.min(Math.max(0, range.from), docLength),
      to: Math.min(Math.max(0, range.to), docLength)
    }));
  
    if (validRanges[0].from !== validRanges[0].to) {
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
    }
  }, []);

  // Remote cursor sync handler
  const handleRemoteCursorUpdate = useCallback((view, changes) => {
    try {
      if (!socket?.connected || !roomId) return;

      if (cursorSyncTimeout.current) {
        clearTimeout(cursorSyncTimeout.current);
      }

      cursorSyncTimeout.current = setTimeout(() => {
        const position = view.state.selection.main.head;
        const coords = view.coordsAtPos(position);
        if (!coords) return;
        
        const editorElement = view.dom;
        const editorRect = editorElement.getBoundingClientRect();
        const scrollInfo = {
          top: view.scrollDOM.scrollTop,
          left: view.scrollDOM.scrollLeft
        };
        
        const cursorData = {
          roomId,
          userId: localStorage.getItem('userId'),
          username: localStorage.getItem('username'),
          position: {
            index: position,
            x: coords.x - editorRect.left,
            y: coords.y - editorRect.top,
            top: coords.top - editorRect.top,
            left: coords.left - editorRect.left,
            scroll: scrollInfo
          },
          isTyping: changes?.docChanged || false
        };
        
        socket.emit('cursor_activity', cursorData);
      }, 50);
    } catch (error) {
      console.error('Error in cursor update:', error);
    }
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

  // Editor extensions
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
      "&": { height: "100%" },
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

  // Handle cursor updates
  useEffect(() => {
    if (!socket) return;

    const handleCursorUpdate = (data) => {
      console.log('Received cursor update:', data);
      if (data.userId === localStorage.getItem('userId')) return;

      setCursors(prev => {
        const next = new Map(prev);
        next.set(data.userId, {
          username: data.username,
          position: data.position,
          isTyping: data.isTyping,
          timestamp: Date.now()
        });
        return next;
      });
    };

    socket.on('cursor_update', handleCursorUpdate);

    return () => {
      socket.off('cursor_update', handleCursorUpdate);
    };
  }, [socket, setCursors]);

  // Handle selections
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
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center">
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
          {Array.from(cursors.entries()).map(([userId, cursor]) => {
            return userId !== localStorage.getItem('userId') && (
              <EditorCursor
                key={userId}
                userId={userId}
                username={cursor.username}
                position={cursor.position}
                isTyping={cursor.isTyping}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};