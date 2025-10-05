import { forwardRef, useEffect, useRef, useState } from "react";

const CanvasDraw = forwardRef(function CanvasDraw(
  {
    isPanning,
    currentToolRef,
    canvasRef,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    zoomIn,
    zoomOut,
    scheduleRedraw,
    getCanvasPoint,
    isDownPressed,
  },
  ref,
) {
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isMouseDown, SetIsMouseDown] = useState(false);

  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault(); // now works because passive is false
      if (!e.ctrlKey) return;
      if (e.deltaY < 0) {
        zoomIn(getCanvasPoint(e));
      } else {
        zoomOut(getCanvasPoint(e));
      }
      scheduleRedraw();
    };

    const handleKeyUp = (e) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        setIsGrabbing(false);
        console.log("is grabbing false");
        return;
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        console.log("is grabbing true");
        setIsGrabbing(true);
        return;
      }
    };
    const container = ref?.current;
    if (!container) return;
    container.focus();
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("keydown", handleKeyDown);
    container.addEventListener("keyup", handleKeyUp);

    return () => {
      container.focus();
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("keydown", handleKeyDown);
      container.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    getCanvasPoint,
    scheduleRedraw,
    zoomIn,
    zoomOut,
    isPanning,
    currentToolRef,
    isDownPressed,
    ref,
  ]);

  return (
    <div ref={ref} className="h-full w-full focus:outline-none" tabIndex={0}>
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          console.log("is down true");
          SetIsMouseDown(true);
          handlePointerDown(e);
        }}
        onPointerUp={(e) => {
          console.log("is down false");

          SetIsMouseDown(false);
          handlePointerUp(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerUp}
        className={`block h-full w-full touch-none bg-[#f8f9fa] select-none dark:bg-neutral-900 ${!isGrabbing ? "cursor-crosshair" : !isMouseDown ? "cursor-grab" : "cursor-grabbing"} `}
      />
    </div>
  );
});

export default CanvasDraw;
