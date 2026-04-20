import { lazy, Suspense, useRef, useEffect, useCallback } from "react";
import { useDrawingState } from "./hooks/useDrawingState";
import { useCanvasRenderer } from "./hooks/useCanvasRenderer";
import { useUndoRedo } from "./hooks/useUndoRedo";
import { useEraser } from "./hooks/useEraser";
import { useInfiniteCanvas } from "./hooks/useInfiniteCanvas";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import CanvasDraw from "./CanvasDraw";
import DrawOptions from "../../components/DrawOptions";
import { useWebSocket } from "../../context/useWebSocketContext";
import { getApiUrl } from "../../utils/api";
import { simplifyStroke } from "./utils/drawingUtils";

const SimpleEditor = lazy(
  () => import("../TextEditor/components/tiptap-templates/simple/simple-editor"),
);

export default function Manager({
  isDarkMode,
  roomId,
  id: userId,
  mode,
  name,
}) {
  const sameUser = (leftId, rightId) =>
    String(leftId ?? "") === String(rightId ?? "");

  const canvasRef = useRef(null);
  const containerRef = useRef();
  const ctxRef = useRef(null);
  const isMounted = useRef(false);
  const isDownPressed = useRef(false);
  const penWidth = useRef(2);
  const colorRef = useRef(isDarkMode ? "#ffffff" : "#000000");
  const currentToolRef = useRef("pen");
  const pointBuffer = useRef([]); // Buffer for batching network updates
  const completedStrokeIdsRef = useRef(new Set()); // Track completed stroke IDs to prevent race conditions
  const lastMovePublishTimeRef = useRef(0);
  const moveNetConfigRef = useRef({
    intervalMs: 40,
    maxPointsPerPacket: 24,
    moveSimplifyTolerance: 0.7,
    endSimplifyTolerance: 0.85,
  });

  // Network tuning for production: smooth live preview with less socket pressure.
  // This adapts to low-network profiles via Network Information API when available.

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

  // Undo is handled locally via useKeyboardShortcuts + useUndoRedo

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

            // Handle both single point (legacy) and batched points
            const pointsToProcess = payload.points || (payload.x ? [[payload.x, payload.y, payload.pressure]] : []);

            //doesn't run for one actually drawing ( doesn't run locally)
            if (sameUser(userId, userWhoDraw)) return;

            // RACE CONDITION FIX: Ignore stroke_move for strokes that have already been completed
            // This prevents late-arriving messages from recreating deleted stroke entries
            if (completedStrokeIdsRef.current.has(incomingStrokeId)) {
              return;
            }

            //for identification of each stroke we define its id -> strokeId
            if (!liveStrokes.current.has(incomingStrokeId)) {
              liveStrokes.current.set(incomingStrokeId, {
                points: [],
                userId: userWhoDraw,
                tool: payload.tool || "pen",
                width: payload.width || 2,
                color: payload.color,
                lastUpdate: performance.now(),
              });
            }

            const strokeData = liveStrokes.current.get(incomingStrokeId);

            // Add all received points
            pointsToProcess.forEach(point => {
              strokeData.points.push(point);
            });

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

            // Mark this stroke as completed to prevent late stroke_move from recreating it
            completedStrokeIdsRef.current.add(completedStrokeId);

            // Clean up old completed IDs to prevent memory leak (keep last 100)
            if (completedStrokeIdsRef.current.size > 100) {
              const idsArray = Array.from(completedStrokeIdsRef.current);
              completedStrokeIdsRef.current = new Set(idsArray.slice(-50));
            }

            if (liveStrokes.current.has(completedStrokeId)) {
              liveStrokes.current.delete(completedStrokeId);
            }

            if (
              !sameUser(userId, userWhoDraw) &&
              currentStrokes &&
              currentStrokes.length > 0
            ) {
              const strokeWithMetadata = {
                points: currentStrokes,
                tool: tool || "pen",
                id: completedStrokeId,
                userId: userWhoDraw,
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
            if (sameUser(userId, userWhoDraw)) {
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

  // API URL is imported from utils/api

  // Set mounted flag and fetches inital data from backend
  useEffect(() => {
    isMounted.current = true;

    async function fetchStrokes() {
      const apiUrl = getApiUrl();
      const drawUrl = `${apiUrl}/api/draw/${roomId}`;
      const response = await fetch(drawUrl);

      if (!response.ok) {
        console.warn(`Failed to fetch strokes (Status: ${response.status}). Backend might not be deployed or room is empty.`);
        return;
      }

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
  }, [scheduleRedraw, addCompletedStroke, addToHistory]);

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
    onUndo: () => {
      if (canUndo) {
        undo();
        scheduleRedraw();
      }
    },
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

  useEffect(() => {
    const updateNetworkProfile = () => {
      const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
      if (!connection) {
        moveNetConfigRef.current = {
          intervalMs: 40,
          maxPointsPerPacket: 24,
          moveSimplifyTolerance: 0.7,
          endSimplifyTolerance: 0.85,
        };
        return;
      }

      const effectiveType = connection.effectiveType || "";
      const rtt = Number(connection.rtt || 0);
      const downlink = Number(connection.downlink || 0);
      const saveData = Boolean(connection.saveData);
      const lowNetwork =
        saveData ||
        effectiveType === "2g" ||
        effectiveType === "slow-2g" ||
        rtt >= 250 ||
        (downlink > 0 && downlink < 1.2);

      if (lowNetwork) {
        moveNetConfigRef.current = {
          intervalMs: 85, // ~12fps wire updates on weak links
          maxPointsPerPacket: 14,
          moveSimplifyTolerance: 1.4,
          endSimplifyTolerance: 1.1,
        };
        return;
      }

      const mediumNetwork =
        effectiveType === "3g" || rtt >= 140 || (downlink > 0 && downlink < 3.5);

      if (mediumNetwork) {
        moveNetConfigRef.current = {
          intervalMs: 55,
          maxPointsPerPacket: 18,
          moveSimplifyTolerance: 1.0,
          endSimplifyTolerance: 0.95,
        };
        return;
      }

      moveNetConfigRef.current = {
        intervalMs: 35, // ~28fps on strong links
        maxPointsPerPacket: 24,
        moveSimplifyTolerance: 0.7,
        endSimplifyTolerance: 0.85,
      };
    };

    updateNetworkProfile();
    const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    if (!connection?.addEventListener) return;
    connection.addEventListener("change", updateNetworkProfile);
    return () => connection.removeEventListener("change", updateNetworkProfile);
  }, []);

  const flushMoveBuffer = useCallback(() => {
    if (!isReady || !currentStrokeId.current || pointBuffer.current.length === 0) {
      return;
    }

    // Cap packet size so one frame never becomes too heavy.
    const { maxPointsPerPacket, moveSimplifyTolerance } = moveNetConfigRef.current;
    const pointsChunk = pointBuffer.current.slice(0, maxPointsPerPacket);
    pointBuffer.current = pointBuffer.current.slice(pointsChunk.length);
    const optimizedChunk = simplifyStroke(pointsChunk, moveSimplifyTolerance);

    publish(`/app/room/${roomId}/msg`, {
      type: "stroke_move",
      roomId,
      userId,
      strokeId: currentStrokeId.current,
      payload: {
        points: optimizedChunk,
        tool: currentToolRef.current,
        width: penWidth.current,
        color: colorRef.current,
      },
    });
    lastMovePublishTimeRef.current = performance.now();
  }, [isReady, publish, roomId, userId, currentStrokeId, currentToolRef, penWidth, colorRef]);

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
        // CRITICAL FIX: Clear point buffer when starting a new stroke
        // This prevents old points from the previous stroke from being sent with the new stroke
        pointBuffer.current = [];

        const newStrokeId = startNewStroke(point);
        lastMovePublishTimeRef.current = 0;
        scheduleRedraw();

        // Keep protocol consistent: initial point is also batched.
        pointBuffer.current.push([point[0], point[1], point[2]]);
        if (newStrokeId) {
          flushMoveBuffer();
        }
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
      flushMoveBuffer,
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

        const added = addPointToStroke(point);
        if (!added) return;
        scheduleRedraw();

        // Batch points for network efficiency
        pointBuffer.current.push([point[0], point[1], point[2]]);

        const now = performance.now();
        const { intervalMs, maxPointsPerPacket } = moveNetConfigRef.current;

        // Publish preview packets at steady cadence, or earlier if packet gets big.
        if (
          now - lastMovePublishTimeRef.current >= intervalMs ||
          pointBuffer.current.length >= maxPointsPerPacket
        ) {
          flushMoveBuffer();
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
      flushMoveBuffer,
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

    // Flush pending live points before sending final authoritative stroke.
    while (pointBuffer.current.length > 0) {
      flushMoveBuffer();
    }

    const strokeData = clearLocalStroke();
    if (strokeData.points.length > 0) {
      const { endSimplifyTolerance } = moveNetConfigRef.current;
      const simplifiedPoints = simplifyStroke(
        strokeData.points,
        endSimplifyTolerance,
      );

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
          currentStrokes: simplifiedPoints,
          tool: currentToolRef.current,
          width: penWidth.current,
          color: colorRef.current,
        },
      });

      // Clear point buffer after stroke ends to prevent carryover
      pointBuffer.current = [];
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
    flushMoveBuffer,
    scheduleRedraw,
    penWidth,
    colorRef,
    roomId,
    userId,
  ]);
  return (
    <div className="flex flex-3">
      <div
        className={`${mode === "text" ? "block" : "hidden"} flex-3 overflow-auto`}
      >
        <div className={`simple-editor-wrapper`}>
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
                Loading editor...
              </div>
            }
          >
            <SimpleEditor roomId={roomId} userId={userId} name={name} />
          </Suspense>
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
          canvasRef={canvasRef}
          handlePointerDown={handlePointerDown}
          handlePointerMove={handlePointerMove}
          handlePointerUp={handlePointerUp}
          zoomIn={zoomIn}
          zoomOut={zoomOut}
          scheduleRedraw={scheduleRedraw}
          getCanvasPoint={getCanvasPoint}
          ref={containerRef}
        />
      </div>
    </div>
  );
}
