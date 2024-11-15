import { useCallback, useEffect, useRef, useState, memo, useMemo } from 'react';
import { EditorView } from '@codemirror/view';
import { StateField, StateEffect, RangeSet, Range } from '@codemirror/state';

// Helper to generate consistent colors for users
const generateUserColor = (username) => {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 60%)`;
};

export class CursorManager {
  constructor(view) {
    this.view = view;
    this.cursors = new Map();
    this.selections = new Map();
    this.viewports = new Map();
    this.lastUpdate = new Map();
  }

  // Track user's viewport (visible range)
  updateViewport(userId, from, to) {
    this.viewports.set(userId, { from, to });
  }

  // Update cursor position with viewport context
  updateCursor(userId, username, pos, isTyping = false) {
    const coords = this.view.coordsAtPos(pos);
    if (!coords) return;

    const line = this.view.state.doc.lineAt(pos);
    this.cursors.set(userId, {
      username,
      position: {
        top: coords.top,
        left: coords.left,
        line: line.number,
        ch: pos - line.from,
      },
      isTyping,
      timestamp: Date.now()
    });
  }

  // Handle text selections
  updateSelection(userId, ranges) {
    this.selections.set(userId, ranges.map(range => ({
      from: range.from,
      to: range.to,
      color: generateUserColor(userId)
    })));
    
    // Trigger a view update to show new selections
    this.view.dispatch({});
  }

  // Get cursors that should be visible in the current viewport
  getVisibleCursors(viewportFrom, viewportTo) {
    const results = [];
    for (const [userId, cursor] of this.cursors) {
      const viewport = this.viewports.get(userId);
      if (!viewport) continue;

      // Check if cursors are in overlapping viewports
      if (viewport.from <= viewportTo && viewport.to >= viewportFrom) {
        results.push({
          userId,
          ...cursor,
          // Adjust position for scroll
          position: {
            ...cursor.position,
            top: cursor.position.top - this.view.scrollDOM.scrollTop,
            left: cursor.position.left - this.view.scrollDOM.scrollLeft
          }
        });
      }
    }
    return results;
  }
}

// Create selection highlighting extension
const createSelectionHighlighter = () => {
  const selectionField = StateField.define({
    create() {
      return RangeSet.empty;
    },
    update(selections, tr) {
      selections = selections.map(tr.changes);
      if (tr.selection) {
        // Your logic to update selections
      }
      return selections;
    }
  });

  return [
    selectionField,
    EditorView.decorations.from(selectionField)
  ];
};

export const useCursorSync = (view, onCursorUpdate) => {
  const manager = useRef(null);
  const [cursors, setCursors] = useState([]);

  const handleCursorActivity = useCallback((view) => {
    if (!manager.current) return;
    const selection = view.state.selection.main;
    const coords = view.coordsAtPos(selection.head);
    
    if (coords) {
      onCursorUpdate?.(coords);
    }
  }, [onCursorUpdate]);

  useEffect(() => {
    if (!view) return;
    manager.current = new CursorManager(view);
  }, [view]);

  const syncViewport = useCallback((userId, from, to) => {
    if (!manager.current) return;
    manager.current.updateViewport(userId, from, to);
    // Update visible cursors based on new viewport
    const visible = manager.current.getVisibleCursors(from, to);
    setCursors(visible);
  }, []);

  const updateCursor = useCallback((userId, username, pos, isTyping = false) => {
    if (!manager.current) return;
    manager.current.updateCursor(userId, username, pos, isTyping);
    const viewport = view?.viewport;
    if (viewport) {
      const visible = manager.current.getVisibleCursors(viewport.from, viewport.to);
      setCursors(visible);
    }
  }, [view]);

  const updateSelection = useCallback((userId, ranges) => {
    if (!manager.current) return;
    manager.current.updateSelection(userId, ranges);
  }, []);

  return {
    cursors,
    syncViewport,
    updateCursor,
    updateSelection,
    handleCursorActivity
  };
};

// Cursor component
export const EditorCursor = memo(({ userId, username, position, isTyping }) => {
  const cursorColor = useMemo(() => generateUserColor(username), [username]);
  
  return (
    <div
      className="absolute pointer-events-none z-50"
      style={{
        transform: 'translate(-2px, 0)',
        top: `${position.top}px`,
        left: `${position.left}px`,
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
        className="absolute left-0 -top-6 px-2 py-1 rounded text-white text-xs whitespace-nowrap"
        style={{ 
          backgroundColor: cursorColor,
          boxShadow: `0 0 4px ${cursorColor}88`
        }}
      >
        <span>{username}</span>
        {isTyping && (
          <span className="ml-1 flex space-x-0.5">
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" 
              style={{ animationDelay: '0ms' }} />
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" 
              style={{ animationDelay: '150ms' }} />
            <span className="w-1 h-1 bg-white rounded-full animate-bounce" 
              style={{ animationDelay: '300ms' }} />
          </span>
        )}
      </div>
    </div>
  );
});

EditorCursor.displayName = 'EditorCursor';