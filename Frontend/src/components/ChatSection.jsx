import { Send, Bot, Users, MoveLeft, MoveRight, Loader2 } from "lucide-react";
import { memo, useEffect, useState, useRef } from "react";
import useCollaboration from "../hooks/useCollabration";

// Helper functions - use the imported ones from utils in real implementation
const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const getUserInitials = (name) => {
  if (!name) return "?";
  const nameParts = name.split(" ");
  if (nameParts.length >= 2) {
    return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`.toUpperCase();
  }
  return nameParts[0].charAt(0).toUpperCase();
};

const getUserAvatarColor = (name) => {
  if (!name) return "bg-gray-500";
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-teal-500",
  ];
  const hash = name.split("").reduce((a, b) => a + b.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const isSystemMessage = (message) => {
  return message.type === "SYSTEM" || message.userId === "system";
};

function ChatSection({
  roomId = "demo-room",
  currentUser = { id: "current-user", name: "You" },
}) {
  const [newMessage, setNewMessage] = useState("");
  const [isAiMode, setIsAiMode] = useState(false);
  const [isCompact, setIsCompact] = useState(false);
  const messagesEndRef = useRef(null);

  const { users, messages, sendMessage, connected, isLoading, isReady } =
    useCollaboration(roomId, currentUser);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const success = sendMessage(newMessage);
      if (success) {
        setNewMessage("");
      }
    }
  };

  const toggleMode = () => {
    setIsAiMode(!isAiMode);
  };

  // Filter active users
  const joiningUsers = users.filter((user) => user.type === "joining");
  const onlineCount = joiningUsers.length;

  useEffect(
    function () {
      console.log("messages ", messages);
      console.log("users ", users);
      console.log("joiningUsers ", joiningUsers);
    },
    [messages, users, joiningUsers],
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={`flex ${!isCompact ? "flex-1" : ""} border-r border-gray-200 bg-white dark:border-neutral-700 dark:bg-neutral-900`}
    >
      {/* Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Compact Mode Users */}
        {isCompact && (
          <div className="flex flex-col gap-2 overflow-y-auto border-b border-gray-200 p-2 dark:border-neutral-700">
            <button
              onClick={() => setIsCompact(!isCompact)}
              className="rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700"
            >
              <MoveRight className="h-5 w-5 text-gray-600 dark:text-neutral-400" />
            </button>
            <div className="space-y-3">
              {joiningUsers.slice(0, 8).map((user) => (
                <div key={user.id} className="flex justify-center">
                  <div
                    className={`h-10 w-10 rounded-full ${getUserAvatarColor(user.name)} relative flex items-center justify-center text-sm font-medium text-white`}
                  >
                    {getUserInitials(user.name)}
                    <div className="absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-neutral-700"></div>
                  </div>
                </div>
              ))}
              {joiningUsers.length > 8 && (
                <div className="flex justify-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-400 text-xs font-medium text-white dark:bg-neutral-600">
                    +{joiningUsers.length - 8}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Header */}

        {!isCompact && (
          <>
            <div className="flex justify-between border-b border-gray-200 p-4 dark:border-neutral-700">
              <div className="mb-2 flex items-center">
                <button
                  onClick={() => setIsCompact(!isCompact)}
                  className="rounded-lg p-2 transition-colors hover:bg-gray-200 dark:hover:bg-neutral-700"
                >
                  <MoveLeft className="h-5 w-5 text-gray-600 dark:text-neutral-400" />
                </button>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-neutral-100">
                  {isAiMode ? "AI Assistant" : "Team Chat"}
                </h2>
                <p className="text-sm text-gray-500 dark:text-neutral-400">
                  {isAiMode ? "Get AI-powered help" : `${onlineCount} online`}
                </p>
              </div>
              <div className="flex items-center justify-between gap-4 bg-white dark:bg-neutral-900">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 dark:border-neutral-600 dark:bg-neutral-700">
                    <button
                      onClick={() => setIsAiMode(false)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        !isAiMode
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-600"
                      }`}
                    >
                      <Users className="h-4 w-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => setIsAiMode(true)}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        isAiMode
                          ? "bg-blue-500 text-white shadow-sm"
                          : "text-gray-600 hover:bg-gray-100 dark:text-neutral-300 dark:hover:bg-neutral-600"
                      }`}
                    >
                      <Bot className="h-4 w-4" />
                      AI
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {!isAiMode ? (
                <>
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                      <span className="ml-2 text-gray-500 dark:text-neutral-400">
                        Loading messages...
                      </span>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div key={message.id}>
                        {isSystemMessage(message) ? (
                          <div className="flex justify-center">
                            <div className="rounded-full bg-gray-100 px-3 py-1 dark:bg-neutral-700">
                              <p className="text-sm text-gray-600 dark:text-neutral-400">
                                {message.content} •{" "}
                                {formatTimestamp(message.timestamp)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3">
                            <div
                              className={`h-8 w-8 rounded-full ${getUserAvatarColor(message.senderName)} flex flex-shrink-0 items-center justify-center text-sm font-medium text-white`}
                            >
                              {message.userId === currentUser.id
                                ? "Y"
                                : getUserInitials(message.senderName)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-baseline gap-2">
                                <span className="font-medium text-gray-900 dark:text-neutral-100">
                                  {message.userId === currentUser.id
                                    ? "You"
                                    : message.senderName}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-neutral-400">
                                  {formatTimestamp(message.timestamp)}
                                </span>
                              </div>
                              <p className="leading-relaxed text-gray-700 dark:text-neutral-300">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <Bot className="mb-4 h-16 w-16 text-blue-500" />
                  <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-neutral-100">
                    AI Assistant Ready
                  </h3>
                  <p className="mb-4 text-gray-500 dark:text-neutral-400">
                    Ask me anything about your project or get help with
                    collaboration.
                  </p>
                  <div className="space-y-2 text-sm text-gray-400 dark:text-neutral-500">
                    <p>• Generate ideas and suggestions</p>
                    <p>• Help with project planning</p>
                    <p>• Answer questions about collaboration</p>
                  </div>
                </div>
              )}
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-900">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={
                      isAiMode ? "Ask AI assistant..." : "Type a message..."
                    }
                    rows="1"
                    disabled={!isReady}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-600 dark:bg-neutral-700 dark:text-neutral-100 dark:placeholder-neutral-400"
                    style={{ minHeight: "44px", maxHeight: "120px" }}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height =
                        Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                  />
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isReady}
                  className={`rounded-lg p-3 transition-all duration-200 ${
                    newMessage.trim() && connected
                      ? "bg-blue-500 text-white shadow-sm hover:bg-blue-600 hover:shadow-md"
                      : "cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-neutral-700 dark:text-neutral-500"
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        )}
        {/* Messages */}
      </div>
    </div>
  );
}

export default memo(ChatSection);
