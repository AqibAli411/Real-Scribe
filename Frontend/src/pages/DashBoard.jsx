import ModeHeader from "../components/ModeHeader";
import { lazy, Suspense, useMemo, useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useWebSocket } from "../context/useWebSocketContext";

const Manager = lazy(() => import("../features/DrawingCanvas/Manager.jsx"));
const ChatSectionLazy = lazy(() => import("../components/ChatSection"));

function PanelLoader() {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500 dark:text-neutral-400">
      Loading panel...
    </div>
  );
}

function DashBoard() {
  const [mode, setMode] = useState("canvas"); // 'canvas' or 'text'
  // Initialize from localStorage or default to false
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("isDarkMode");
      return saved === "true";
    }
    return false;
  });

  const { roomId } = useParams(); // URL me /room/123 ho to id = "123"

  const [searchParams] = useSearchParams();
  const name = searchParams.get("name");
  const id = searchParams.get("id");
  const currentUser = useMemo(() => ({ name, id }), [name, id]);

  const location = useLocation();
  const navigate = useNavigate();
  const { connected } = useWebSocket();
  const connectedRef = useRef(connected);
  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  const fromRoomEntry = location.state?.fromRoomEntry === true;
  const [showEntryLoader, setShowEntryLoader] = useState(
    () => location.state?.fromRoomEntry === true
  );

  useEffect(() => {
    if (!fromRoomEntry) {
      return;
    }
    const minMs = 750;
    const maxMs = 4500;
    const t0 = performance.now();
    let raf = 0;

    const finish = () => {
      if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
      setShowEntryLoader(false);
      navigate(
        { pathname: location.pathname, search: location.search, hash: location.hash },
        { replace: true, state: {} }
      );
    };

    const tick = () => {
      const elapsed = performance.now() - t0;
      if (connectedRef.current && elapsed >= minMs) {
        finish();
        return;
      }
      if (elapsed >= maxMs) {
        finish();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      if (raf) {
        cancelAnimationFrame(raf);
      }
    };
  }, [fromRoomEntry, location.pathname, location.search, location.hash, navigate]);

  // Effect to apply dark mode class globally and save to localStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("isDarkMode", "true");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("isDarkMode", "false");
    }
  }, [isDarkMode]);

  return (
    <section className="relative mx-auto flex h-screen w-full flex-col shadow-xs">
      {showEntryLoader && (
        <div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm dark:bg-neutral-900/90"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2
            className="h-10 w-10 animate-spin text-blue-600 dark:text-blue-400"
            strokeWidth={2.25}
          />
          <p className="text-sm font-medium text-neutral-600 dark:text-neutral-300">
            Entering room…
          </p>
          <p className="max-w-xs text-center text-xs text-neutral-500 dark:text-neutral-500">
            Connecting to collaboration
          </p>
        </div>
      )}
      <ModeHeader
        onSetMode={setMode}
        mode={mode}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        roomId={roomId}
        name={name}
      />
      <div className="flex flex-1 justify-between overflow-hidden">
        <Suspense fallback={<PanelLoader />}>
          <ChatSectionLazy roomId={roomId} currentUser={currentUser} />
        </Suspense>
        <Suspense fallback={<PanelLoader />}>
          <Manager
            isDarkMode={isDarkMode}
            roomId={roomId}
            id={id}
            name={name}
            mode={mode}
          />
        </Suspense>
      </div>
    </section>
  );
}

export default DashBoard;
