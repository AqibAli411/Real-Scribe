// components/Toolbar.jsx
import React, { useEffect, useState } from "react";

const Toolbar = ({
  currentToolRef,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onResetView,
  zoom = 1,
}) => {
  const [tool, setTool] = useState(currentToolRef.current);

  function handleClickPen() {
    setTool("pen");
    currentToolRef.current = "pen";
  }

  function handleClickEraser() {
    setTool("eraser");
    currentToolRef.current = "eraser";
  }

  const toolbarStyle = {
    position: "fixed",
    top: "20px",
    left: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    background: "white",
    padding: "12px",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
    zIndex: 1000,
    fontFamily: "system-ui, -apple-system, sans-serif",
  };

  const toolGroupStyle = {
    display: "flex",
    gap: "4px",
    alignItems: "center",
  };

  const buttonStyle = {
    padding: "8px 12px",
    background: "white",
    cursor: "pointer",
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "36px",
    height: "36px",
    transition: "all 0.2s ease",
  };

  const activeButtonStyle = {
    ...buttonStyle,
    background: "#007bff",
    color: "white",
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    opacity: 0.5,
    cursor: "not-allowed",
  };

  const separatorStyle = {
    width: "100%",
    height: "1px",
    background: "#e0e0e0",
    margin: "4px 0",
  };

  const labelStyle = {
    fontSize: "12px",
    color: "#666",
    textAlign: "center",
    margin: "4px 0",
  };

  return (
    <div style={toolbarStyle}>
      {/* Drawing Tools */}
      <div style={labelStyle}>Tools</div>
      <div style={toolGroupStyle}>
        <button
          style={tool === "pen" ? activeButtonStyle : buttonStyle}
          onClick={handleClickPen}
          title="Pen Tool (P)"
        >
          ✏️
        </button>
        <button
          style={tool === "eraser" ? activeButtonStyle : buttonStyle}
          onClick={handleClickEraser}
          title="Eraser (E)"
        >
          🧹
        </button>
      </div>

      <div style={separatorStyle} />

      {/* Undo/Redo */}
      <div style={labelStyle}>History</div>
      <div style={toolGroupStyle}>
        <button
          style={canUndo ? buttonStyle : disabledButtonStyle}
          onClick={onUndo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          ↶
        </button>
        <button
          style={canRedo ? buttonStyle : disabledButtonStyle}
          onClick={onRedo}
          disabled={!canRedo}
          title="Redo (Ctrl+Shift+Z)"
        >
          ↷
        </button>
      </div>

      <div style={separatorStyle} />

      {/* Zoom Controls */}
      <div style={labelStyle}>Zoom</div>
      <div style={toolGroupStyle}>
        <button
          style={buttonStyle}
          onClick={onZoomOut}
          title="Zoom Out (Ctrl+-)"
        >
          🔍-
        </button>
        <div
          style={{
            ...buttonStyle,
            cursor: "default",
            minWidth: "50px",
            fontSize: "12px",
            background: "#f8f9fa",
          }}
        >
          {(zoom * 100).toFixed(0)}%
        </div>
        <button style={buttonStyle} onClick={onZoomIn} title="Zoom In (Ctrl++)">
          🔍+
        </button>
      </div>

      <button
        style={buttonStyle}
        onClick={onResetView}
        title="Reset View (Ctrl+0)"
      >
        🎯
      </button>

      <div style={separatorStyle} />

      <div
        style={{
          ...labelStyle,
          fontSize: "10px",
          lineHeight: "1.3",
          color: "#888",
        }}
      >
        Space + Drag: Pan
        <br />
        Ctrl + Wheel: Zoom
        <br />
        Ctrl+Z/Y: Undo/Redo
      </div>
    </div>
  );
};

export default Toolbar;
