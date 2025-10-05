// hooks/useUndoRedo.js
import { useRef, useCallback, useState } from "react";

export function useUndoRedo(completedStrokes, scheduleRedraw) {
  const history = useRef([]);
  const historyIndex = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateUndoRedoState = useCallback(() => {
    setCanUndo(historyIndex.current >= 0);
    setCanRedo(historyIndex.current < history.current.length - 1);
  }, []);

  const addToHistory = useCallback(() => {
    // Create a deep copy of current strokes
    if (completedStrokes.current.length === 0) return;

    const snapshot = completedStrokes.current.map((stroke) => ({
      ...stroke,
      points: [...stroke.points],
    }));

    // Remove any history after current index (when adding after undo)
    history.current = history.current.slice(0, historyIndex.current + 1);

    // Add new snapshot
    history.current.push(snapshot);
    //always points to latest
    historyIndex.current = history.current.length - 1;

    // Limit history size to prevent memory issues
    const MAX_HISTORY = 50;
    if (history.current.length > MAX_HISTORY) {
      history.current = history.current.slice(-MAX_HISTORY);
      historyIndex.current = history.current.length - 1;
    }

    updateUndoRedoState();
  }, [completedStrokes, updateUndoRedoState]);

  const undo = useCallback(() => {
    if (historyIndex.current < 0) return;

    //moves index one back
    historyIndex.current--;

    // Restore previous state
    if (historyIndex.current >= 0) {
      completedStrokes.current = history.current[historyIndex.current].map(
        (stroke) => ({
          ...stroke,
          points: [...stroke.points],
        }),
      );
    } else {
      completedStrokes.current = [];
    }

    scheduleRedraw();
    updateUndoRedoState();
  }, [completedStrokes, updateUndoRedoState, scheduleRedraw]);

  const redo = useCallback(() => {
    if (historyIndex.current >= history.current.length - 1) return;

    historyIndex.current++;

    // Restore next state
    completedStrokes.current = history.current[historyIndex.current].map(
      (stroke) => ({
        ...stroke,
        points: [...stroke.points],
      }),
    );

    updateUndoRedoState();
  }, [completedStrokes, updateUndoRedoState]);

  const clearHistory = useCallback(() => {
    history.current = [];
    historyIndex.current = -1;
    updateUndoRedoState();
  }, [updateUndoRedoState]);

  // Initialize with empty state
  const initializeHistory = useCallback(() => {
    addToHistory(); // Add initial empty state
  }, [addToHistory]);

  return {
    undo,
    redo,
    canUndo,
    canRedo,
    addToHistory,
    clearHistory,
    initializeHistory,
  };
}
