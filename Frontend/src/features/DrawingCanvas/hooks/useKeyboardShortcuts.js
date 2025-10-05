// hooks/useKeyboardShortcuts.js
import { useEffect, useCallback } from "react";

export function useKeyboardShortcuts({
  isReady,
  publish,
  canUndo,
  onRedo,
  currentToolRef,
  isPanning,
  onResetView,
  onZoomIn,
  onZoomOut,
  onSelectPen,
  isDownPressed,
  containerRef,
}) {
  const handleKeyDown = useCallback(
    (e) => {
      // Prevent shortcuts when typing in inputs
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z - Undo
      if (ctrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        //as user enters "ctrl + z" it should go back for ever user
        //we will publish here -> subscribe method -> call undo method
        if (!isReady) return;

        publish("/app/undo", {
          canUndo,
        });

        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
      if (ctrlOrCmd && ((e.key === "z" && e.shiftKey) || e.key === "y")) {
        e.preventDefault();
        onRedo?.();
        return;
      }

      // E - Toggle eraser
      if (e.key === "e" || e.key === "E") {
        e.preventDefault();

        currentToolRef.current =
          currentToolRef.current === "eraser" ? "pen" : "eraser";
        console.log(currentToolRef.current);
        return;
      }

      // P or V - Select pen tool
      if (e.key === "p" || e.key === "P" || e.key === "v" || e.key === "V") {
        e.preventDefault();
        onSelectPen?.();
        return;
      }

      // Space - Pan mode (hold)
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        console.log("here");
        if (!isDownPressed.current) isPanning.current = true;
        return;
      }

      // Ctrl/Cmd + 0 - Reset view
      if (ctrlOrCmd && e.key === "0") {
        e.preventDefault();
        onResetView?.();
        return;
      }

      // Ctrl/Cmd + Plus/Equal - Zoom in
      if (ctrlOrCmd && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        onZoomIn?.();
        return;
      }

      // Ctrl/Cmd + Minus - Zoom out
      if (ctrlOrCmd && e.key === "-") {
        e.preventDefault();
        onZoomOut?.();
        return;
      }
    },
    [
      onRedo,
      onResetView,
      onZoomIn,
      onZoomOut,
      onSelectPen,
      canUndo,
      isReady,
      currentToolRef,
      isPanning,
      isDownPressed,
      publish,
    ],
  );

  const handleKeyUp = useCallback(
    (e) => {
      // Space - Stop pan mode
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        isPanning.current = false;
        return;
      }
    },
    [isPanning],
  );

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    node.focus();
    node.addEventListener("keydown", handleKeyDown);
    node.addEventListener("keyup", handleKeyUp);

    return () => {
      node.removeEventListener("keydown", handleKeyDown);
      node.removeEventListener("keyup", handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp, containerRef]);
}
