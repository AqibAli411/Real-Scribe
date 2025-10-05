// hooks/useDrawingState.js
import { useRef, useCallback } from "react";

export function useDrawingState() {
  const isDrawing = useRef(false);

  // Multi-user stroke management
  const myStroke = useRef([]);
  const liveStrokes = useRef(new Map());
  const completedStrokes = useRef([]);

  // Stroke tracking
  const strokeId = useRef(0);
  const currentStrokeId = useRef(null);
  const lastPoint = useRef(null);

  const startNewStroke = useCallback((point) => {
    isDrawing.current = true;
    //a sort of variable that we can use to generate a random number each time
    strokeId.current += 1; //starting with 1
    currentStrokeId.current = strokeId.current;

    myStroke.current = [point];
    lastPoint.current = point;

    return currentStrokeId.current;
  }, []);

  // as cursor moves , point is passed to this function -> it adds to the myStroke if distance < 0.5
  const addPointToStroke = useCallback((point) => {
    if (!isDrawing.current) return false;

    // Smart point filtering
    if (lastPoint.current) {
      const [x, y] = point;
      const [lastX, lastY] = lastPoint.current;
      const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);

      if (distance < 0.5) return false; // Too close to last point
    }

    myStroke.current.push(point);
    lastPoint.current = point;
    return true;
  }, []);

  //clears the local stroke and returns all data collected
  const clearLocalStroke = useCallback(() => {
    isDrawing.current = false;

    const strokeData = {
      points: [...myStroke.current],
      id: currentStrokeId.current,
    };

    myStroke.current = [];
    lastPoint.current = null;
    currentStrokeId.current = null;

    return strokeData;
  }, []);

  //this adds all data we have {points,id}
  const addCompletedStroke = useCallback((strokeWithMetadata) => {
    completedStrokes.current.push(strokeWithMetadata);
  }, []);

  return {
    isDrawing,
    myStroke,
    liveStrokes,
    completedStrokes,
    strokeId,
    currentStrokeId,
    addCompletedStroke,
    clearLocalStroke,
    startNewStroke,
    addPointToStroke,
  };
}
