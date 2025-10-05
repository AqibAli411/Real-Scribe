// hooks/useEraser.js
import { useRef, useCallback } from "react";

export function useEraser(completedStrokes) {
  // FIXED: Separate eraser state from drawing state
  const isErasing = useRef(false);
  const eraserSize = useRef(20);
  const lastErasePoint = useRef(null);
  const erasedInCurrentSession = useRef(new Set()); // Track erased strokes in current session

  // Check if a point is within eraser distance from a stroke
  const isPointNearStroke = useCallback((point, stroke, threshold) => {
    const [px, py] = point;

    for (const strokePoint of stroke.points) {
      const [sx, sy] = strokePoint;
      const distance = Math.sqrt((px - sx) ** 2 + (py - sy) ** 2);
      if (distance <= threshold) {
        return true;
      }
    }
    return false;
  }, []);

  // IMPROVED: Better line-segment intersection detection
  const isStrokeInEraserPath = useCallback(
    (stroke, startPoint, endPoint, eraserRadius) => {
      if (!stroke.points || stroke.points.length === 0) return false;

      // Check each point in the stroke against the eraser line segment
      for (const strokePoint of stroke.points) {
        const [sx, sy] = strokePoint;
        const [x1, y1] = startPoint;
        const [x2, y2] = endPoint;

        // Calculate distance from stroke point to eraser line segment
        const A = sx - x1;
        const B = sy - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        let param = -1;
        if (lenSq !== 0) {
          param = dot / lenSq;
        }

        let xx, yy;
        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }

        const dx = sx - xx;
        const dy = sy - yy;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= eraserRadius) {
          return true;
        }
      }

      return false;
    },
    [],
  );

  // FIXED: Remove local strokes immediately for smooth erasing
  const removeStrokesLocally = useCallback(
    (strokeIds) => {
      strokeIds.forEach((strokeId) => {
        erasedInCurrentSession.current.add(strokeId);
        // Remove from completed strokes immediately
        completedStrokes.current = completedStrokes.current.filter(
          (stroke) => stroke.id !== strokeId,
        );
      });
    },
    [completedStrokes],
  );

  // FIXED: Separate eraser state management
  const startErasing = useCallback(
    (point) => {
      // FIXED: Don't modify shared drawing state
      isErasing.current = true;
      lastErasePoint.current = point;

      // Find strokes to erase at the starting point
      const strokesToErase = [];

      completedStrokes.current.forEach((stroke) => {
        // Skip already erased strokes
        if (erasedInCurrentSession.current.has(stroke.id)) return;

        if (isPointNearStroke(point, stroke, eraserSize.current)) {
          strokesToErase.push(
            stroke.id || `temp_${Date.now()}_${Math.random()}`,
          );
        }
      });

      // FIXED: Remove strokes locally immediately for smooth experience
      if (strokesToErase.length > 0) {
        removeStrokesLocally(strokesToErase);
      }

      return strokesToErase;
    },
    [isPointNearStroke, completedStrokes, removeStrokesLocally],
  );

  const continueErasing = useCallback(
    (point) => {
      if (!isErasing.current || !lastErasePoint.current) {
        return [];
      }

      const strokesToErase = [];

      completedStrokes.current.forEach((stroke) => {
        // Skip already erased strokes
        if (erasedInCurrentSession.current.has(stroke.id)) return;

        const strokeId = stroke.id || `temp_${Date.now()}_${Math.random()}`;

        // Check if stroke intersects with eraser path
        if (
          isStrokeInEraserPath(
            stroke,
            lastErasePoint.current,
            point,
            eraserSize.current,
          )
        ) {
          strokesToErase.push(strokeId);
        }
      });

      if (strokesToErase.length > 0) {
        removeStrokesLocally(strokesToErase);
      }

      lastErasePoint.current = point;
      return strokesToErase;
    },
    [isStrokeInEraserPath, completedStrokes, removeStrokesLocally],
  );

  const stopErasing = useCallback(() => {
    // FIXED: Don't modify shared drawing state
    isErasing.current = false;
    lastErasePoint.current = null;
    // Clear erased session when stopping (for network sync)
    erasedInCurrentSession.current.clear();
  }, []);

  // ADDED: Method to check if currently erasing
  const getIsErasing = useCallback(() => {
    return isErasing.current;
  }, []);

  const getErasedStrokes = useCallback(
    (point) => {
      const strokesToErase = [];

      completedStrokes.current.forEach((stroke) => {
        if (isPointNearStroke(point, stroke, eraserSize.current)) {
          strokesToErase.push(
            stroke.id || `temp_${Date.now()}_${Math.random()}`,
          );
        }
      });

      return strokesToErase;
    },
    [isPointNearStroke, completedStrokes],
  );

  // Sets the eraser size
  const setEraserSize = useCallback((size) => {
    eraserSize.current = Math.max(5, Math.min(100, size));
  }, []);

  const getEraserSize = useCallback(() => {
    return eraserSize.current;
  }, []);

  return {
    isErasing: isErasing.current, // Return the current value, not ref
    getIsErasing,
    startErasing,
    continueErasing,
    stopErasing,
    getErasedStrokes,
    setEraserSize,
    getEraserSize,
  };
}
