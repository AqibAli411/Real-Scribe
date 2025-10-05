// hooks/useInfiniteCanvas.js
import { useRef, useCallback } from "react";

export function useInfiniteCanvas(canvasRef) {
  const viewportRef = useRef({
    x: 0,
    y: 0,
    zoom: 1,
  });

  const transformRef = useRef({
    x: 0,
    y: 0,
    scale: 1,
  });

  //ref here
  const isPanning = useRef(false);
  const lastPanPoint = useRef(null);
  const panStartPoint = useRef(null);

  // Convert screen coordinates to canvas coordinates
  const getCanvasPoint = useCallback(
    (e) => {
      const canvas = canvasRef.current;
      if (!canvas) return [0, 0, 0.5];

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      // Screen coordinates
      const screenX = (e.clientX - rect.left) * scaleX;
      const screenY = (e.clientY - rect.top) * scaleY;

      // Convert to canvas coordinates accounting for transform
      const canvasX =
        (screenX - transformRef.current.x) / transformRef.current.scale;
      const canvasY =
        (screenY - transformRef.current.y) / transformRef.current.scale;

      return [canvasX, canvasY, e.pressure || 0.5];
    },
    [canvasRef]
  );

  // Convert canvas coordinates to screen coordinates
  const getScreenPoint = useCallback((canvasX, canvasY) => {
    const screenX =
      canvasX * transformRef.current.scale + transformRef.current.x;
    const screenY =
      canvasY * transformRef.current.scale + transformRef.current.y;
    return [screenX, screenY];
  }, []);

  const updateTransform = useCallback((newTransform) => {
    transformRef.current = newTransform;
    viewportRef.current = {
      x: -newTransform.x / newTransform.scale,
      y: -newTransform.y / newTransform.scale,
      zoom: newTransform.scale,
    };
  }, []);

  const startPan = useCallback(
    (e) => {
      isPanning.current = true;
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      panStartPoint.current = {
        x: e.clientX,
        y: e.clientY,
      };
      lastPanPoint.current = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    [canvasRef]
  );

  const continuePan = useCallback(
    (e) => {
      if (!isPanning.current || !lastPanPoint.current) return;

      const deltaX = e.clientX - lastPanPoint.current.x;
      const deltaY = e.clientY - lastPanPoint.current.y;

      const newTransform = {
        ...transformRef.current,
        x: transformRef.current.x + deltaX,
        y: transformRef.current.y + deltaY,
      };

      updateTransform(newTransform);

      lastPanPoint.current = {
        x: e.clientX,
        y: e.clientY,
      };
    },
    [updateTransform]
  );

  const stopPan = useCallback(() => {
    isPanning.current = false;
    lastPanPoint.current = null;
    panStartPoint.current = null;
  }, []);

  const zoomIn = useCallback(
    (centerPoint) => {
      const zoomFactor = 1.2;
      const newScale = Math.min(transformRef.current.scale * zoomFactor, 5); // Max zoom 5x

      let newX = transformRef.current.x;
      let newY = transformRef.current.y;

      if (centerPoint) {
        const [centerX, centerY] = centerPoint;
        newX =
          centerX -
          (centerX - transformRef.current.x) *
            (newScale / transformRef.current.scale);
        newY =
          centerY -
          (centerY - transformRef.current.y) *
            (newScale / transformRef.current.scale);
      }

      updateTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [updateTransform]
  );

  const zoomOut = useCallback(
    (centerPoint) => {
      const zoomFactor = 1 / 1.2;
      const newScale = Math.max(transformRef.current.scale * zoomFactor, 0.1); // Min zoom 0.1x

      let newX = transformRef.current.x;
      let newY = transformRef.current.y;

      if (centerPoint) {
        const [centerX, centerY] = centerPoint;
        newX =
          centerX -
          (centerX - transformRef.current.x) *
            (newScale / transformRef.current.scale);
        newY =
          centerY -
          (centerY - transformRef.current.y) *
            (newScale / transformRef.current.scale);
      }

      updateTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [updateTransform]
  );

  const resetView = useCallback(() => {
    updateTransform({
      x: 0,
      y: 0,
      scale: 1,
    });
  }, [updateTransform]);

  const setZoom = useCallback(
    (zoom, centerPoint) => {
      const newScale = Math.max(0.1, Math.min(5, zoom));

      let newX = transformRef.current.x;
      let newY = transformRef.current.y;

      if (centerPoint) {
        const [centerX, centerY] = centerPoint;
        newX =
          centerX -
          (centerX - transformRef.current.x) *
            (newScale / transformRef.current.scale);
        newY =
          centerY -
          (centerY - transformRef.current.y) *
            (newScale / transformRef.current.scale);
      }

      updateTransform({
        x: newX,
        y: newY,
        scale: newScale,
      });
    },
    [updateTransform]
  );

  // Check if a point is visible in the current viewport
  const isPointVisible = useCallback(
    (x, y, margin = 100) => {
      const canvas = canvasRef.current;
      if (!canvas) return true;

      const [screenX, screenY] = getScreenPoint(x, y);

      return (
        screenX >= -margin &&
        screenX <= canvas.width + margin &&
        screenY >= -margin &&
        screenY <= canvas.height + margin
      );
    },
    [getScreenPoint, canvasRef]
  );

  return {
    viewportRef,
    transformRef,
    isPanning,
    startPan,
    continuePan,
    stopPan,
    zoomIn,
    zoomOut,
    resetView,
    setZoom,
    getCanvasPoint,
    getScreenPoint,
    isPointVisible,
    updateTransform,
  };
}
