// RoomPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Clipboard,
  Check,
  ArrowLeft,
  Users,
  Plus,
  LogIn,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useWebSocket } from "../context/useWebSocketContext";
import { ThemeToggle } from "../features/TextEditor/components/tiptap-templates/simple/theme-toggle";

export default function RoomPage() {
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [nameError, setNameError] = useState("");
  const [roomIdError, setRoomIdError] = useState("");
  const navigate = useNavigate();

  const { connectWithUser } = useWebSocket();

  // Memoize user data to prevent unnecessary updates
  const userData = useMemo(() => ({ id: null, name: null }), []);
  // Auto-generate room ID when switching to create mode
  useEffect(() => {
    if (isCreating && !roomId) {
      generateRoomId();
    }
  }, [isCreating, roomId]);

  const generateRoomId = async () => {
    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 300));
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(id);
    setCopied(false);
    setIsGenerating(false);
  };

  //method for copying the to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const validateName = (value) => {
    if (!value.trim()) {
      setNameError("Name is required");
      return false;
    }
    if (value.trim().length < 2) {
      setNameError("Name must be at least 2 characters");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateRoomId = (value) => {
    if (!value.trim()) {
      setRoomIdError("Room ID is required");
      return false;
    }
    if (value.trim().length !== 6) {
      setRoomIdError("Room ID must be 6 characters");
      return false;
    }
    setRoomIdError("");
    return true;
  };

  function randomNumber() {
    return Math.round(Math.random() * 1000 + 1);
  }

  const apiUrl = import.meta.env.VITE_API_URL;
  const url = `${apiUrl}/api/room`;

  const handleCreate = async () => {
    if (!validateName(name)) return;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: roomId,
          userId: randomNumber(),
          username: name,
        }),
      });

      //solve this mystry for me mama
      const { id, username, userId } = await response.json();
      userData.id = roomId;
      userData.name = name;
      navigate(`/room/${id}?name=${username}&id=${userId}`);
    } catch (err) {
      console.error("Failed to create room:", err);
    }
  };

  const handleJoin = async () => {
    if (!validateName(name) || !validateRoomId(joinRoomId)) return;

    try {
      const response = await fetch(`${url}/${joinRoomId}`);
      if (!response.ok) throw new Error("Room cannot be found!");

      const { id, userId, username } = await response.json();

      console.log("from room controller : ", userId, " ", username);

      const idOfUser = randomNumber();
      userData.id = idOfUser;
      userData.name = name;

      navigate(`/room/${id}?name=${name}&id=${idOfUser}`);
    } catch (err) {
      console.error("Failed to join room:", err);
    }

    console.log("here in the room page : ", userData);
  };

  // Connect WebSocket after user data is set
  useEffect(() => {
    if (userData.id && userData.name) {
      connectWithUser(userData);
    }
  }, [userData.id, userData.name, connectWithUser, userData]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleModeSwitch = (creating) => {
    setIsCreating(creating);
    setNameError("");
    setRoomIdError("");
    if (creating && !roomId) {
      generateRoomId();
    }
  };

  return (
    <div className="flex items-center justify-center h-full w-full bg-neutral-50 px-4 py-8 dark:bg-neutral-900">
      {/* Header Controls */}
      <div className="absolute top-6 right-6 left-6 z-10 flex items-center justify-between">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2.5 font-medium text-neutral-700 transition-all duration-200 hover:scale-105 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        {/* here theme button */}

      </div>

      {/* Main Card */}
      <div className="relative w-full max-w-lg rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg dark:border-neutral-700 dark:bg-neutral-800">

        {/* Mode Toggle */}
        <div  className="mb-8 flex rounded-xl bg-neutral-100 p-1 dark:bg-neutral-700">
          <button
            onClick={() => handleModeSwitch(true)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
              isCreating
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            <Plus size={18} />
            Create
          </button>
          <button
            onClick={() => handleModeSwitch(false)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-medium transition-all duration-200 ${
              !isCreating
                ? "bg-blue-600 text-white shadow-sm"
                : "text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
            }`}
          >
            <LogIn size={18} />
            Join
          </button>
        </div>

        {/* Form Content */}
        <div className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="mb-3 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) validateName(e.target.value);
              }}
              onBlur={() => validateName(name)}
              className={`w-full rounded-xl border bg-white px-4 py-3 font-medium text-neutral-800 placeholder-neutral-500 transition-all duration-200 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400 ${
                nameError
                  ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600"
              }`}
              placeholder="Enter your display name"
            />
            {nameError && (
              <p className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                <span className="h-1 w-1 rounded-full bg-red-500"></span>
                {nameError}
              </p>
            )}
          </div>

          {isCreating ? (
            <>
              {/* Generated Room ID */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Room ID
                </label>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-600 dark:bg-neutral-700/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      {isGenerating ? (
                        <div className="flex items-center gap-3">
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"></div>
                          <span className="text-sm text-neutral-500 dark:text-neutral-400">
                            Generating...
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="mb-1">
                            <span className="text-xs font-medium tracking-wider text-neutral-500 uppercase dark:text-neutral-400">
                              Your Room Code
                            </span>
                          </div>
                          <div className="font-mono text-2xl font-bold tracking-widest text-blue-600 dark:text-blue-400">
                            {roomId}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={generateRoomId}
                        disabled={isGenerating}
                        className="rounded-lg border border-neutral-200 bg-white p-2.5 text-neutral-600 transition-all duration-200 hover:scale-105 hover:bg-neutral-50 disabled:opacity-50 disabled:hover:scale-100 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600"
                        title="Generate new ID"
                      >
                        <RefreshCw size={16} />
                      </button>
                      <button
                        onClick={copyToClipboard}
                        disabled={isGenerating}
                        className={`rounded-lg p-2.5 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 ${
                          copied
                            ? "border border-green-200 bg-green-100 text-green-700 dark:border-green-500/30 dark:bg-green-500/20 dark:text-green-400"
                            : "border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-600"
                        }`}
                        title={copied ? "Copied!" : "Copy to clipboard"}
                      >
                        {copied ? <Check size={16} /> : <Clipboard size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleCreate}
                disabled={isGenerating || !name.trim()}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-blue-600"
              >
                <span className="flex items-center justify-center gap-2">
                  <Users size={20} />
                  Create Room
                </span>
              </button>
            </>
          ) : (
            <>
              {/* Join Room ID Input */}
              <div>
                <label className="mb-3 block text-sm font-medium text-neutral-700 dark:text-neutral-200">
                  Room ID
                </label>
                <input
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => {
                    const value = e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9]/g, "");
                    setJoinRoomId(value.slice(0, 6));
                    if (roomIdError) validateRoomId(value);
                  }}
                  onBlur={() => validateRoomId(joinRoomId)}
                  className={`w-full rounded-xl border bg-white px-4 py-3 text-center font-mono text-lg font-medium tracking-widest text-neutral-800 placeholder-neutral-500 transition-all duration-200 dark:bg-neutral-700 dark:text-white dark:placeholder-neutral-400 ${
                    roomIdError
                      ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-neutral-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-neutral-600"
                  }`}
                  placeholder="XXXXXX"
                  maxLength={6}
                />
                {roomIdError && (
                  <p className="mt-2 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <span className="h-1 w-1 rounded-full bg-red-500"></span>
                    {roomIdError}
                  </p>
                )}
              </div>

              <button
                onClick={handleJoin}
                disabled={!name.trim() || !joinRoomId.trim()}
                className="w-full rounded-xl bg-blue-600 py-3.5 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-blue-600"
              >
                <span className="flex items-center justify-center gap-2">
                  <Users size={20} />
                  Join Room
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
