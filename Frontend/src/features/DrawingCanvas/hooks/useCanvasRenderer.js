// hooks/useCanvasRenderer.js
import { useCallback, useEffect, useRef, useState } from "react";
import { drawStrokePoints } from "../utils/drawingUtils";

export function useCanvasRenderer(
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
    currentTool,
    viewportRef,
    transformRef,
  },
) {
  const animationFrameRef = useRef(null);
  const lastRenderTime = useRef(0);
  const RENDER_THROTTLE_MS = 8; // ~120fps
  const isDarkRef = useRef(isDarkMode);
  const toolRef = useRef(currentTool);

  useEffect(
    function () {
      isDarkRef.current = isDarkMode;
    },
    [isDarkMode],
  );

  useEffect(
    function () {
      toolRef.current = currentTool.current;
    },
    [currentTool],
  );

  // Draw grid for infinite canvas
  const drawGrid = useCallback(
    (ctx = null, canvas = null) => {
      // Use provided ctx/canvas or get from refs
      const context = ctx || ctxRef.current;
      const canvasElement = canvas || canvasRef.current;

      if (!context || !canvasElement) return;

      // Don't show grid when zoomed out
      if (!viewportRef.current || transformRef.current.scale < 0.5) return;

      context.save();

      const gridSize = 50 * transformRef.current.scale;
      const offsetX =
        ((transformRef.current.x % gridSize) + gridSize) % gridSize;
      const offsetY =
        ((transformRef.current.y % gridSize) + gridSize) % gridSize;

      context.strokeStyle = isDarkRef.current ? "#333333" : "#dbd9d9";
      context.lineWidth = 0.5;
      context.setLineDash([]);

      // Draw vertical lines
      for (let x = offsetX; x < canvasElement.width; x += gridSize) {
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, canvasElement.height);
        context.stroke();
      }

      // Draw horizontal lines
      for (let y = offsetY; y < canvasElement.height; y += gridSize) {
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(canvasElement.width, y);
        context.stroke();
      }

      context.restore();
    },
    [transformRef, viewportRef, ctxRef, canvasRef],
  );

  // Apply canvas transformation
  const applyTransform = useCallback(
    (ctx) => {
      ctx.setTransform(
        transformRef.current.scale,
        0,
        0,
        transformRef.current.scale,
        transformRef.current.x,
        transformRef.current.y,
      );
    },
    [transformRef],
  );

  // Reset canvas transformation
  const resetTransform = useCallback((ctx) => {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
  }, []);

  // Check if stroke is visible in current viewport
  const isStrokeVisible = useCallback(
    (stroke) => {
      if (!stroke.points || stroke.points.length === 0) return false;
      if (transformRef.current.scale < 0.1) return false; // Don't render when too zoomed out

      // Simple bounding box check
      let minX = Infinity,
        minY = Infinity;
      let maxX = -Infinity,
        maxY = -Infinity;

      for (const [x, y] of stroke.points) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }

      // Transform bounding box to screen coordinates
      const screenMinX =
        minX * transformRef.current.scale + transformRef.current.x;
      const screenMinY =
        minY * transformRef.current.scale + transformRef.current.y;
      const screenMaxX =
        maxX * transformRef.current.scale + transformRef.current.x;
      const screenMaxY =
        maxY * transformRef.current.scale + transformRef.current.y;

      const canvas = canvasRef.current;
      if (!canvas) return true;

      // Check if stroke bounding box intersects with canvas
      const margin = 100; // Extra margin for partially visible strokes
      return !(
        screenMaxX < -margin ||
        screenMinX > canvas.width + margin ||
        screenMaxY < -margin ||
        screenMinY > canvas.height + margin
      );
    },
    [transformRef, canvasRef],
  );

  const redraw = useCallback(() => {
    const ctx = ctxRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    // Clear canvas
    resetTransform(ctx);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid(ctx, canvas);

    // Apply transformation for drawing
    applyTransform(ctx);

    // FIXED: Use the current pen width instead of hardcoded value
    const PEN_STROKES = {
      size: penWidth.current, // This was the main issue - was hardcoded to 2.5
      thinning: -0.3,
      smoothing: 0.35,
      streamline: 0.15,
      easing: (t) => t,
      start: { taper: 0, easing: (t) => t },
      end: { taper: 0, easing: (t) => t },
    };

    // Set default drawing properties
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    // Draw completed strokes (with visibility culling)
    let renderedStrokes = 0;
    for (const stroke of completedStrokes.current) {
      if (
        stroke &&
        stroke.points &&
        stroke.points.length > 0 &&
        isStrokeVisible(stroke)
      ) {
        // Erased strokes shouldn't be rendered
        if (stroke.tool === "eraser") continue;

        // Set stroke-specific color
        let strokeColor = stroke.color;

        //stroke is white and dark mode is on -> black
        //stroke is black and dark mode is off -> white
        if (strokeColor === "#000000" && isDarkRef.current)
          strokeColor = "#ffffff";
        if (strokeColor === "#ffffff" && !isDarkRef.current)
          strokeColor = "#000000";

        ctx.fillStyle = strokeColor;
        ctx.strokeStyle = strokeColor;

        const strokeOptions = {
          ...PEN_STROKES,
          size: stroke.width || PEN_STROKES.size,
        };

        drawStrokePoints(ctx, stroke.points, stroke.tool, strokeOptions);
        renderedStrokes++;
      }
    }

    /* eslint-disable no-unused-vars */
    for (const [_, strokeData] of liveStrokes.current) {
      if (strokeData && strokeData.points && strokeData.points.length > 0) {
        const tempStroke = { points: strokeData.points };
        if (isStrokeVisible(tempStroke)) {
          // Set stroke-specific color for live strokes " || colorRef.current "
          let strokeColor = strokeData.color;

          if (strokeColor === "#000000" && isDarkRef.current)
            strokeColor = "#ffffff";
          if (strokeColor === "#ffffff" && !isDarkRef.current)
            strokeColor = "#000000";

          ctx.fillStyle = strokeColor;
          ctx.strokeStyle = strokeColor;

          const strokeOptions = {
            ...PEN_STROKES,
            size: strokeData.width || PEN_STROKES.size,
          };
          drawStrokePoints(
            ctx,
            strokeData.points,
            strokeData.tool || "pen",
            strokeOptions,
          );
        }
      }
    }

    // Draw current local stroke
    if (isDrawing.current && myStroke.current.length > 0) {
      // Set current color for local stroke

      let color = colorRef.current;

      if (color === "#000000" && isDarkRef.current) color = "#ffffff";
      if (color === "#ffffff" && !isDarkRef.current) color = "#000000";

      console.log(toolRef.current);

      ctx.fillStyle = color;
      ctx.strokeStyle = color;

      drawStrokePoints(ctx, myStroke.current, toolRef.current, PEN_STROKES);
    }

    // Reset transform for UI elements
    resetTransform(ctx);

    // Debug info (only in development)
    ctx.fillStyle = "#666";
    ctx.font = "12px monospace";
    ctx.fillText(
      `Zoom: ${(transformRef.current.scale * 100).toFixed(0)}%`,
      10,
      20,
    );
    ctx.fillText(
      `Strokes: ${renderedStrokes}/${completedStrokes.current.length}`,
      10,
      35,
    );
    ctx.fillText(
      `Pan: ${transformRef.current.x.toFixed(0)}, ${transformRef.current.y.toFixed(0)}`,
      10,
      50,
    );
    // ADDED: Show current pen width in debug
    ctx.fillText(`Pen Width: ${penWidth.current}px`, 10, 65);
  }, [
    ctxRef,
    canvasRef,
    completedStrokes,
    liveStrokes,
    myStroke,
    isDrawing,
    transformRef,
    drawGrid,
    applyTransform,
    resetTransform,
    isStrokeVisible,
    penWidth, // Added penWidth to dependencies
    colorRef,
  ]);

  const scheduleRedraw = useCallback(() => {
    const now = performance.now();
    if (now - lastRenderTime.current < RENDER_THROTTLE_MS) {
      if (animationFrameRef.current) return;

      animationFrameRef.current = requestAnimationFrame(() => {
        const renderNow = performance.now();
        if (renderNow - lastRenderTime.current >= RENDER_THROTTLE_MS) {
          redraw();
          lastRenderTime.current = renderNow;
        }
        animationFrameRef.current = null;
      });
      return;
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    animationFrameRef.current = requestAnimationFrame(() => {
      redraw();
      lastRenderTime.current = performance.now();
      animationFrameRef.current = null;
    });
  }, [redraw]);

  return {
    redraw,
    scheduleRedraw,
    drawGrid,
  };
}
