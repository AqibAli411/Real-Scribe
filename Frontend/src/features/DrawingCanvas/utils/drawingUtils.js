// utils/drawingUtils.js
import { getStroke } from "perfect-freehand";

export const ERASER_OPTIONS = {
  size: 6,
  thinning: 0,
  smoothing: 0.2,
  streamline: 0.1,
  easing: (t) => t,
  start: { taper: 0, easing: (t) => t },
  end: { taper: 0, easing: (t) => t },
};

// Optimized stroke rendering with tool support
export function drawStrokePoints(ctx, points, tool = "pen", PEN_STROKES) {
  if (!points || points.length === 0) return;

  // Handle different tools
  switch (tool) {
    case "eraser":
      drawEraserStroke(ctx, points);
      break;
    case "pen":
    default:
      drawPenStroke(ctx, points, PEN_STROKES);
      break;
  }
}

function drawPenStroke(ctx, points, PEN_STROKES) {
  if (points.length === 0) return;

  // For single points, draw a small circle
  if (points.length === 1) {
    const [x, y, pressure = 0.5] = points[0];
    const radius = (PEN_STROKES.size * pressure) / 2;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(radius, 1), 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  // For very short strokes (2-3 points), use simple line rendering
  if (points.length < 4) {
    ctx.beginPath();
    ctx.lineWidth = PEN_STROKES.size;
    ctx.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
    return;
  }

  // For longer strokes, use perfect-freehand
  const strokePoints = getStroke(points, PEN_STROKES);

  if (strokePoints.length < 3) return;

  ctx.beginPath();
  ctx.moveTo(strokePoints[0][0], strokePoints[0][1]);

  // Use quadratic curves for smoother rendering
  for (let i = 1; i < strokePoints.length - 1; i++) {
    const [x0, y0] = strokePoints[i];
    const [x1, y1] = strokePoints[i + 1];
    const cpx = (x0 + x1) / 2;
    const cpy = (y0 + y1) / 2;
    ctx.quadraticCurveTo(x0, y0, cpx, cpy);
  }

  // Complete the path
  const lastPoint = strokePoints[strokePoints.length - 1];
  ctx.lineTo(lastPoint[0], lastPoint[1]);
  ctx.closePath();
  ctx.fill();
}

function drawEraserStroke(ctx, points) {
  if (points.length === 0) return;

  // Eraser uses composite operation to "cut out" content
  const originalComposite = ctx.globalCompositeOperation;
  ctx.globalCompositeOperation = "destination-out";

  if (points.length === 1) {
    const [x, y] = points[0];
    ctx.beginPath();
    ctx.arc(x, y, ERASER_OPTIONS.size / 2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Draw eraser path
    ctx.beginPath();
    ctx.lineWidth = ERASER_OPTIONS.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
    ctx.stroke();
  }

  // Restore original composite operation
  ctx.globalCompositeOperation = originalComposite;
}

// Utility function to calculate stroke bounds
export function getStrokeBounds(points) {
  if (!points || points.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  }

  let minX = Infinity,
    minY = Infinity;
  let maxX = -Infinity,
    maxY = -Infinity;

  for (const [x, y] of points) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

// Utility function to check if two strokes intersect
export function strokesIntersect(stroke1, stroke2, threshold = 5) {
  if (!stroke1.points || !stroke2.points) return false;

  for (const [x1, y1] of stroke1.points) {
    for (const [x2, y2] of stroke2.points) {
      const distance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
      if (distance <= threshold) {
        return true;
      }
    }
  }
  return false;
}

// Utility function to simplify stroke points (reduce data)
export function simplifyStroke(points, tolerance = 1.0) {
  if (points.length <= 2) return points;

  const simplified = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [lastX, lastY] = simplified[simplified.length - 1];

    const distance = Math.sqrt((x - lastX) ** 2 + (y - lastY) ** 2);

    if (distance >= tolerance) {
      simplified.push(points[i]);
    }
  }

  // Always keep the last point
  simplified.push(points[points.length - 1]);

  return simplified;
}
