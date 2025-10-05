import { EraserIcon, PencilLine, Palette } from "lucide-react";
import MultiLines from "../utils/MultiLines";
import { memo, useMemo, useState, useEffect, useRef } from "react";

export const STROKE_OPTIONS = {
  size: 2.5,
  thinning: -0.3,
  smoothing: 0.35,
  streamline: 0.15,
  easing: (t) => t,
  start: { taper: 0, easing: (t) => t },
  end: { taper: 0, easing: (t) => t },
};

function DrawOptions({
  isDarkMode,
  currentToolRef,
  canvasRef,
  penWidth,
  colorRef,
  scheduleRedraw,
}) {
  const [onClickChangeWidth, setOnClickChangeWidth] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [tempValue, setTempValue] = useState(penWidth.current);
  const [selectedTool, setSelectedTool] = useState(currentToolRef.current);
  const [selectedColor, setSelectedColor] = useState(
    showColorPicker ? colorRef?.current : isDarkMode ? "#ffffff" : "#000000",
  );

  //if showColorPicker is false then user has not selected any color show acc to theme
  // showColorPicker ? colorRef.current : isDarkMode ? "#ffffff" : "#000000"
  const widthDropdownRef = useRef(null);
  const colorDropdownRef = useRef(null);

  useEffect(
    function () {
      scheduleRedraw();
      if (selectedColor !== "#000000" && selectedColor !== "#ffffff") return;

      colorRef.current = isDarkMode ? "#ffffff" : "#000000";

      setSelectedColor(colorRef.current);

      return () => scheduleRedraw();
    },
    [isDarkMode, colorRef, showColorPicker, selectedColor, scheduleRedraw],
  );

  // Preset color palette
  const presetColors = [
    "#000000",
    "#ffffff",
    "#ef4444",
    "#f97316",
    "#eab308",
    "#22c55e",
    "#06b6d4",
    "#3b82f6",
    "#8b5cf6",
    "#ec4899",
    "#64748b",
    "#374151",
    "#dc2626",
    "#ea580c",
    "#ca8a04",
    "#16a34a",
    "#0891b2",
    "#2563eb",
    "#7c3aed",
    "#db2777",
  ];

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        widthDropdownRef.current &&
        !widthDropdownRef.current.contains(event.target)
      ) {
        setOnClickChangeWidth(false);
      }
      if (
        colorDropdownRef.current &&
        !colorDropdownRef.current.contains(event.target)
      ) {
        setShowColorPicker(false);
      }
    };

    const node = canvasRef.current;
    node.addEventListener("pointerdown", handleClickOutside);
    return () => node.removeEventListener("pointerdown", handleClickOutside);
  }, [canvasRef]);

  const tools = useMemo(
    () => [
      { id: "pen", icon: PencilLine, label: "Pen" },
      { id: "eraser", icon: EraserIcon, label: "Eraser" },
    ],
    [],
  );

  // FIXED: Handle pen width changes with proper redraw
  const handleWidthChange = (newWidth) => {
    setTempValue(newWidth);
    penWidth.current = newWidth;
    // FIXED: Trigger redraw when width changes
    if (scheduleRedraw) {
      scheduleRedraw();
    }
  };

  // FIXED: Handle color changes
  const handleColorChange = (newColor) => {
    setSelectedColor(newColor);
    if (colorRef) {
      colorRef.current = newColor;
    }
    // Trigger redraw for color change
    if (scheduleRedraw) {
      scheduleRedraw();
    }
  };

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2">
      {/* Main Toolbar */}
      <div className="flex items-center gap-1 rounded-2xl border border-gray-200/50 bg-white/95 p-2 shadow-lg backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-800/95">
        {/* Tool Selection */}
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setSelectedTool(tool.id);
                currentToolRef.current = tool.id;
                // FIXED: Redraw when tool changes
                if (scheduleRedraw) {
                  scheduleRedraw();
                }
              }}
              className={`group relative rounded-xl p-3 transition-all duration-200 hover:scale-105 focus:outline-none active:scale-95 ${
                selectedTool === tool.id
                  ? "bg-blue-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-blue-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
              }`}
              title={tool.label}
            >
              <Icon className="h-5 w-5" />
              {selectedTool === tool.id && (
                <div className="absolute -bottom-1 left-1/2 h-1 w-6 -translate-x-1/2 rounded-full bg-blue-300"></div>
              )}
            </button>
          );
        })}

        {/* Divider */}
        <div className="mx-1 h-8 w-px bg-gray-200 dark:bg-neutral-600"></div>

        {/* Pen Width Control */}
        <div className="relative" ref={widthDropdownRef}>
          <button
            className={`group rounded-xl p-3 transition-all duration-200 hover:scale-105 active:scale-95 ${
              onClickChangeWidth
                ? "bg-blue-500 text-white"
                : "text-gray-600 hover:bg-blue-50 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
            onClick={() => setOnClickChangeWidth(!onClickChangeWidth)}
            title="Pen Width"
          >
            {onClickChangeWidth ? (
              <MultiLines color="#ffffff" />
            ) : (
              <MultiLines color={`${isDarkMode ? "#d4d4d4" : "#4b5563"} `} />
            )}
          </button>

          {/* Width Dropdown */}
          {onClickChangeWidth && (
            <div className="animate-in slide-in-from-top-2 absolute top-16 left-1/2 z-50 -translate-x-1/2 duration-200">
              <div className="min-w-48 rounded-2xl border border-gray-200/50 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-800/95">
                <div className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  Pen Width
                </div>

                {/* Visual Width Preview */}
                <div className="mb-4 flex h-8 items-center justify-center">
                  <div
                    className="rounded-full bg-blue-500 transition-all duration-200"
                    style={{
                      width: `${Math.max(tempValue, 2)}px`,
                      height: `${Math.max(tempValue, 2)}px`,
                    }}
                  ></div>
                </div>

                {/* Range Slider */}
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="1"
                    max="40"
                    value={tempValue}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setTempValue(value);
                    }}
                    // FIXED: Use the new handler for proper redraw
                    onPointerUp={() => handleWidthChange(tempValue)}
                    // FIXED: Also handle real-time changes during drag
                    onInput={(e) => {
                      const value = Number(e.target.value);
                      handleWidthChange(value);
                    }}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-gray-200 dark:bg-neutral-600 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-110"
                  />
                  <div className="flex h-8 w-12 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-medium text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {tempValue}
                  </div>
                </div>

                {/* Quick Size Presets */}
                <div className="mt-3 flex gap-2">
                  {[2, 6, 12, 20].map((size) => (
                    <button
                      key={size}
                      // FIXED: Use the new handler
                      onClick={() => {
                        setTempValue(size);
                        handleWidthChange(size);
                      }}
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 ${
                        tempValue === size
                          ? "bg-blue-500 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-blue-100 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-blue-900/30"
                      }`}
                      title={`${size}px`}
                    >
                      <div
                        className={`rounded-full ${
                          tempValue === size ? "bg-white" : "bg-current"
                        }`}
                        style={{
                          width: `${Math.max(size / 3, 2)}px`,
                          height: `${Math.max(size / 3, 2)}px`,
                        }}
                      ></div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="mx-1 h-8 w-px bg-gray-200 dark:bg-neutral-600"></div>

        {/* Color Picker */}
        <div className="group relative" ref={colorDropdownRef}>
          <button
            className="cursor-pointer rounded-xl p-2 transition-all duration-200 hover:scale-105 hover:bg-blue-50 active:scale-95 dark:hover:bg-neutral-700"
            onClick={() => setShowColorPicker(!showColorPicker)}
            title="Choose Color"
          >
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-gray-600 dark:text-neutral-300" />
              <div
                className="h-6 w-6 rounded-full border-2 border-white shadow-sm transition-all duration-200 group-hover:scale-110 dark:border-neutral-600"
                style={{ backgroundColor: selectedColor }}
              ></div>
            </div>
          </button>

          {/* Color Palette Dropdown */}
          {showColorPicker && (
            <div className="animate-in slide-in-from-top-2 absolute top-16 right-0 z-50 duration-200">
              <div className="w-64 rounded-2xl border border-gray-200/50 bg-white/95 p-4 shadow-xl backdrop-blur-sm dark:border-neutral-700/50 dark:bg-neutral-800/95">
                <div className="mb-3 text-sm font-medium text-gray-900 dark:text-white">
                  Choose Color
                </div>

                {/* Preset Colors */}
                <div className="mb-4 grid grid-cols-8 gap-2">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => handleColorChange(color)}
                      className={`h-8 w-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
                        selectedColor === color
                          ? "border-blue-500 ring-2 ring-blue-200"
                          : "border-gray-300 dark:border-neutral-600"
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>

                {/* Custom Color Input */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 dark:text-neutral-300">
                    Custom:
                  </label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="h-8 w-16 cursor-pointer rounded border border-gray-300 dark:border-neutral-600"
                  />
                  <div className="flex-1 rounded border border-gray-300 bg-gray-50 px-2 py-1 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-700 dark:text-white">
                    {selectedColor.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(DrawOptions);
