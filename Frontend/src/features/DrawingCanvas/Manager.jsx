import { useRef, useEffect, useCallback } from "react";
import { useDrawingState } from "./hooks/useDrawingState";
import { useCanvasRenderer } from "./hooks/useCanvasRenderer";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useEraser } from "./hooks/useEraser";
import { useInfiniteCanvas } from "./hooks/useInfiniteCanvas";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import CanvasDraw from "./CanvasDraw";
import DrawOptions from "../../components/DrawOptions";
import SimpleEditor from "../TextEditor/components/tiptap-templates/simple/simple-editor";
import { useWebSocket } from "../../context/useWebSocketContext";

export default function Manager({
  isDarkMode,
  roomId,
  id: userId,
  mode,
  name,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef();
  const ctxRef = useRef(null);
  const isMounted = useRef(false);
  const isDownPressed = useRef(false);
  const penWidth = useRef(2);
  const colorRef = useRef(isDarkMode ? "#000000" : "#ffffff");
  const currentToolRef = useRef("pen");

  const { isReady, subscribe, unsubscribe, publish } = useWebSocket();

  // Initialize drawing state management
  const {
    isDrawing,
    myStroke,
    liveStrokes,
    completedStrokes,
    currentStrokeId,
    addCompletedStroke,
    clearLocalStroke,
    startNewStroke,
    addPointToStroke,
  } = useDrawingState();

  // Initialize eraser functionality
  const {
    // isErasing,
    startErasing,
    continueErasing,
    stopErasing,
    // getErasedStrokes,
  } = useEraser(completedStrokes, isDrawing);

  // Initialize infinite canvas
  const {
    viewportRef,
    transformRef,
    isPanning,
    startPan,
    continuePan,
    stopPan,
    zoomIn,
    zoomOut,
    resetView,
    getCanvasPoint,
  } = useInfiniteCanvas(canvasRef);

  // Initialize canvas renderer
  const { scheduleRedraw, drawGrid } = useCanvasRenderer(
    ctxRef,
    canvasRef,
    isDarkMode,
    penWidth,
    colorRef,
    {
      completedStrokes,
      liveStrokes,
      myStroke,
      isDrawing,
      currentTool: currentToolRef.current,
      viewportRef,
      transformRef,
    },
  );

  // Initialize undo/redo system
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    addToHistory,
    //  clearHistory
  } = useUndoRedo(completedStrokes, scheduleRedraw);

  const subUndo = useCallback(
    (message) => {
      if (!isMounted.current) return;

      const { canUndo } = JSON.parse(message.body);
      if (canUndo) undo();
    },
    [undo],
  );

  //one method having different cases for type
  //if type is "clear" then only clear ones runs

  const onMessage = useCallback(
    (message) => {
      if (!isMounted.current) return;
      const parsedMessage = JSON.parse(message.body);
      switch (parsedMessage.type) {
        case "stroke_move":
          try {
            const {
              payload,
              userId: userWhoDraw,
              strokeId: incomingStrokeId,
            } = parsedMessage;

            const { x, y, pressure, tool, width, color } = payload;
            //doesn't run for one actually drawing ( doesn't run locally)
            if (Number(userId) === Number(userWhoDraw)) return;
            //for identification of each stroke we define its id -> strokeId
            if (!liveStrokes.current.has(incomingStrokeId)) {
              liveStrokes.current.set(incomingStrokeId, {
                points: [],
                userId,
                tool: tool || "pen",
                width: width || 2, // Added width
                color: color,
                lastUpdate: performance.now(),
              });
            }

            const strokeData = liveStrokes.current.get(incomingStrokeId);
            strokeData.points.push([x, y, pressure]);
            strokeData.lastUpdate = performance.now();

            scheduleRedraw();
          } catch (error) {
            console.error("Error parsing draw message:", error);
          }
          break;
        case "stroke_end":
          try {
            const {
              payload,
              userId: userWhoDraw, // Added color
              strokeId: completedStrokeId,
            } = parsedMessage;

            const {
              currentStrokes,
              tool,
              width, // Added width
              color,
            } = payload;

            if (liveStrokes.current.has(completedStrokeId)) {
              liveStrokes.current.delete(completedStrokeId);
            }

            if (
              Number(userId) !== Number(userWhoDraw) &&
              currentStrokes &&
              currentStrokes.length > 0
            ) {
              const strokeWithMetadata = {
                points: currentStrokes,
                tool: tool || "pen",
                id: completedStrokeId,
                userId: userId,
                width: width || 2, // Added width
                color: color || (isDarkMode ? "#ffffff" : "#000000"), // Added color
              };
              addCompletedStroke(strokeWithMetadata);
              addToHistory(); // Add to undo history
            }

            scheduleRedraw();
          } catch (error) {
            console.error("Error parsing stop message:", error);
          }
          break;
        case "clear":
          try {
            const { payload, userId: userWhoDraw } = parsedMessage;
            const { erasedStrokes } = payload;

            // Don't process our own erase messages (already handled locally)
            if (Number(userId) === Number(userWhoDraw)) {
              return;
            }

            if (erasedStrokes.length > 0) {
              // Remove erased strokes from completed strokes for other users
              erasedStrokes.forEach((strokeId) => {
                completedStrokes.current = completedStrokes.current.filter(
                  (s) => s.id !== strokeId,
                );
              });
              addToHistory(); // Add to undo history
            }
            scheduleRedraw();
          } catch (error) {
            console.error("Error parsing erase message:", error);
          }
          break;

        default:
          break;
      }
    },
    [
      scheduleRedraw,
      liveStrokes,
      isDarkMode,
      userId,
      addCompletedStroke,
      addToHistory,
      completedStrokes,
    ],
  );

  useEffect(() => {
    if (!isReady) return;

    const topic = `/topic/room.${roomId}`;

    subscribe(topic, onMessage);

    return () => {
      unsubscribe(topic);
    };
  }, [isReady, roomId, subscribe, unsubscribe, onMessage]);


  // Set mounted flag and fetches inital data from backend
  useEffect(() => {
    isMounted.current = true;

    async function fetchStrokes() {
      const response = await fetch("http://localhost:8080/api/draw");
      const result = await response.json();

      for (const fetchedObject of result) {
        const points = fetchedObject.payload.currentStrokes;
        const strokeWithMetadata = {
          id: fetchedObject.id,
          ...fetchedObject.payload,
          points,
        };
        addCompletedStroke(strokeWithMetadata);
        if (points) addToHistory();
        scheduleRedraw();
      }
    }

    fetchStrokes();

    return () => {
      isMounted.current = false;
    };
  }, [scheduleRedraw, isDarkMode, addCompletedStroke, addToHistory]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      scheduleRedraw();
    };

    // Initial draw
    resizeCanvas();

    // Observe container changes
    const observer = new ResizeObserver(resizeCanvas);
    observer.observe(canvas.parentElement); // or the wrapping container

    return () => {
      observer.disconnect();
    };
  }, [scheduleRedraw, drawGrid, addCompletedStroke, addToHistory]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    canUndo,
    publish,
    isReady,
    containerRef,
    onRedo: () => {
      if (canRedo) {
        redo();
        scheduleRedraw();
      }
    },
    currentToolRef,
    onResetView: resetView,
    isPanning,
    isDownPressed,
  });

  const handlePointerDown = useCallback(
    (e) => {
      if (e.button === 2) return;
      containerRef?.current?.focus();

      if (!isReady) return;
      isDownPressed.current = true;
      e.preventDefault();

      // Check if space is held for panning
      if (isPanning.current) {
        startPan(e);
        return;
      }

      const point = getCanvasPoint(e);

      if (currentToolRef.current === "eraser") {
        // FIXED: Eraser doesn't need drawing state
        const erasedStrokes = startErasing(point);
        // Always trigger redraw for immediate visual feedback
        scheduleRedraw();

        // Send to network only if strokes were actually erased
        if (erasedStrokes.length > 0) {

          publish(`/app/room/${roomId}/msg`, {
            type: "clear",
            roomId,
            userId,
            payload: {
              erasedStrokes,
            },
          });
        }
      } else {
        const newStrokeId = startNewStroke(point);
        scheduleRedraw();

        publish(`/app/room/${roomId}/msg`, {
          type: "stroke_move",
          roomId,
          userId,
          strokeId: newStrokeId,
          payload: {
            x: point[0],
            y: point[1],
            pressure: point[2],
            tool: currentToolRef.current,
            width: penWidth.current,
            color: colorRef.current,
          },
        });
      }
    },
    [
      isReady,
      publish,
      getCanvasPoint,
      currentToolRef,
      startPan,
      startErasing,
      startNewStroke,
      scheduleRedraw,
      // myUserId,
      isPanning,
      penWidth,
      colorRef,
      roomId,
      userId,
    ],
  );

  // FIXED: Update handlePointerMove for better eraser logic
  const handlePointerMove = useCallback(
    (e) => {
      if (!isReady) return;

      if (!isDownPressed.current) return;

      e.preventDefault();

      const point = getCanvasPoint(e);

      if (isPanning.current) {
        continuePan(e);
        scheduleRedraw();
        return;
      }

      if (currentToolRef.current === "eraser") {
        // FIXED: Eraser doesn't need isDrawing check
        const erasedStrokes = continueErasing(point);

        // Always trigger redraw for smooth erasing
        scheduleRedraw();

        // Send to network only if strokes were actually erased
        if (erasedStrokes.length > 0) {
     
          publish(`/app/room/${roomId}/msg`, {
            type: "clear",
            roomId,
            userId,
            payload: {
              erasedStrokes,
            },
          });
        }
      } else {
        // Regular drawing logic - only if actually drawing
        if (!isDrawing.current) return;

        if (addPointToStroke(point)) scheduleRedraw();

        // Throttled network update
        const now = performance.now();

        if (now - lastEventTime.current >= 16) {
          lastEventTime.current = now;
        
          publish(`/app/room/${roomId}/msg`, {
            type: "stroke_move",
            roomId,
            userId,
            strokeId: currentStrokeId.current,
            payload: {
              x: point[0],
              y: point[1],
              pressure: point[2],
              tool: currentToolRef.current,
              width: penWidth.current,
              color: colorRef.current,
            },
          });
        }
      }
    },
    [
      isReady,
      publish,
      getCanvasPoint,
      isPanning,
      continuePan,
      isDrawing,
      currentToolRef,
      continueErasing,
      addPointToStroke,
      scheduleRedraw,
      currentStrokeId,
      penWidth,
      colorRef,
      roomId,
      userId,
    ],
  );

  // FIXED: Update handlePointerUp for eraser
  const handlePointerUp = useCallback(() => {
    isDownPressed.current = false;

    if (isPanning.current) {
      stopPan();
      return;
    }

    if (currentToolRef.current === "eraser") {
      // FIXED: Eraser has its own stop logic
      stopErasing();
      scheduleRedraw(); // Final redraw after erasing
      return;
    }

    // Regular drawing logic
    if (!isDrawing.current || !isReady) return;

    const strokeData = clearLocalStroke();
    if (strokeData.points.length > 0) {
      const strokeWithMetadata = {
        points: strokeData.points,
        tool: currentToolRef.current,
        userId,
        id: strokeData.id,
        width: penWidth.current,
        color: colorRef.current,
      };

      addCompletedStroke(strokeWithMetadata);
      addToHistory();

      publish(`/app/room/${roomId}/msg`, {
        type: "stroke_end",
        roomId,
        userId,
        strokeId: strokeData.id,
        payload: {
          currentStrokes: strokeData.points,
          tool: currentToolRef.current,
          width: penWidth.current,
          color: colorRef.current,
        },
      });
    }

    scheduleRedraw();
  }, [
    isPanning,
    stopPan,
    isDrawing,
    isReady,
    publish,
    currentToolRef,
    stopErasing,
    clearLocalStroke,
    addCompletedStroke,
    addToHistory,
    scheduleRedraw,
    penWidth,
    colorRef,
    roomId,
    userId,
  ]);

  const lastEventTime = useRef(0);
  return (
    <div className="flex flex-3">
      <div
        className={`${mode === "text" ? "block" : "hidden"} flex-3 overflow-auto`}
      >
        <div className={`simple-editor-wrapper`}>
          <SimpleEditor roomId={roomId} userId={userId} name={name} />
        </div>
      </div>
      <div
        className={`relative flex-3 ${mode === "canvas" ? "block" : "hidden"}`}
      >
        <DrawOptions
          isDarkMode={isDarkMode}
          currentToolRef={currentToolRef}
          penWidth={penWidth}
          colorRef={colorRef}
          scheduleRedraw={scheduleRedraw}
          canvasRef={canvasRef}
        />
        <CanvasDraw
          isPanning={isPanning}
          currentToolRef={currentToolRef}
          canvasRef={canvasRef}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          scheduleRedraw={scheduleRedraw}
          getCanvasPoint={getCanvasPoint}
          isDownPressed={isDownPressed}
          ref={containerRef}
        />
      </div>
    </div>
  );
}
