import { ThemeToggle } from "@/components/tiptap-templates/simple/theme-toggle";
import { Check, Copy, LogOut } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

function getInitials(name) {
  if (!name) return "";

  // Split by spaces, filter empty parts, and take first two words
  const parts = name.trim().split(/\s+/);

  // Take first letter of up to first two words
  const initials = parts.slice(0, 2).map((word) => word[0].toUpperCase());

  return initials.join("");
}

function ModeHeader({
  mode,
  onSetMode,
  isDarkMode,
  setIsDarkMode,
  name,
  roomId,
}) {
  const navigate = useNavigate();
  const [copyState, setCopyState] = useState("idle"); // idle | copied | error
  const copyResetRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
    };
  }, []);

  const handleCopyRoomId = useCallback(async () => {
    if (!roomId?.trim()) return;
    if (copyResetRef.current) window.clearTimeout(copyResetRef.current);
    try {
      await navigator.clipboard.writeText(roomId.trim());
      setCopyState("copied");
      copyResetRef.current = window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("error");
      copyResetRef.current = window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }, [roomId]);

  return (
    <header className="relative flex items-center justify-between gap-2 border-b border-gray-300 bg-white px-2 py-2 sm:gap-3 sm:px-3 dark:border-gray-700 dark:bg-neutral-900">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
        <Logo />
      </div>

      <div className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 md:flex">
        <span className="text-sm text-gray-500 dark:text-gray-400">Mode</span>
        <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => onSetMode("canvas")}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              mode === "canvas"
                ? "bg-white text-gray-900 shadow dark:bg-blue-500 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Canvas
          </button>
          <button
            type="button"
            onClick={() => onSetMode("text")}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              mode === "text"
                ? "bg-white text-gray-900 shadow dark:bg-blue-500 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Text
          </button>
        </div>
      </div>

      {/* User */}
      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        {roomId ? (
          <div
            className="flex min-w-0 max-w-[40vw] items-center rounded-lg border border-neutral-200 bg-neutral-50/90 py-1 pl-2 pr-0.5 shadow-sm sm:max-w-none sm:pl-2.5 dark:border-neutral-600 dark:bg-neutral-800/80"
            title="Room code — copy to invite others"
          >
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-neutral-500 sm:inline dark:text-neutral-400">
              Room
            </span>
            <span className="mx-1.5 hidden h-3 w-px shrink-0 bg-neutral-200 sm:block dark:bg-neutral-600" />
            <span className="min-w-0 truncate font-mono text-sm font-semibold tracking-wide text-neutral-800 dark:text-neutral-100">
              {roomId}
            </span>
            <button
              type="button"
              onClick={handleCopyRoomId}
              aria-label={
                copyState === "copied"
                  ? "Room ID copied"
                  : copyState === "error"
                    ? "Copy failed — try again"
                    : `Copy room ID ${roomId}`
              }
              className="ml-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-neutral-600 transition-colors hover:bg-white hover:text-blue-600 dark:text-neutral-300 dark:hover:bg-neutral-700 dark:hover:text-blue-400"
            >
              {copyState === "copied" ? (
                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : copyState === "error" ? (
                <Copy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        ) : null}
        <ThemeToggle isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <div className="flex items-center gap-2">
          <div className="hidden text-sm text-gray-800 sm:block dark:text-gray-200">
            {name}
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 font-semibold text-blue-50 dark:from-blue-500 dark:to-blue-700">
            {getInitials(name)}
          </div>
          <div className="cursor-pointer rounded-xl p-1 text-gray-600 transition-colors duration-1000 ease-in-out hover:bg-neutral-200 hover:text-red-500">
            <LogOut
              className="h-6 w-6"
              onClick={() => navigate(-1, { replace: true })}
            />
          </div>
        </div>
      </div>
    </header>
  );
}

export default ModeHeader;
