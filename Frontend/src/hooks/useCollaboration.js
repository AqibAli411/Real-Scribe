import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "../context/useWebSocketContext";
import { getApiUrl } from "../utils/api";

export default function useCollaboration(roomId, me) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const messageIdsRef = useRef(new Set());

  if (!roomId || !me?.id || !me?.name) {
    console.error("roomId, me.id, and me.name are required");
  }

  const {
    connected,
    isReady,
    subscribe,
    unsubscribe,
    publish,
    connectWithUser,
  } = useWebSocket();

  useEffect(() => {
    if (me?.id && me?.name) {
      connectWithUser({ id: me.id, name: me.name });
    }
  }, [me.id, me.name, connectWithUser]);

  useEffect(() => {
    if (!isReady) return;

    const presenceTopic = `/topic/room.${roomId}.presence`;
    const presenceHandler = (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === "presence_join") {
          const updatedUsers = data.users.map((user) => ({
            ...user,
            type: "joining",
          }));
          setUsers(updatedUsers);
        } else if (data.type === "presence_leave") {
          setUsers((prevUsers) =>
            prevUsers.map((user) => {
              const stillPresent = data.users.some(
                (activeUser) => activeUser.id === user.id,
              );
              return stillPresent
                ? { ...user, type: "joining" }
                : { ...user, type: "leaving" };
            }),
          );
        } else if (data.type === "presence_sync") {
          const updatedUsers = data.users.map((user) => ({
            ...user,
            type: "joining",
          }));
          setUsers(updatedUsers);
        }
      } catch (error) {
        console.error("Error parsing presence message:", error);
      }
    };

    const chatTopic = `/topic/room.${roomId}.chat`;
    const chatHandler = (message) => {
      try {
        const data = JSON.parse(message.body);
        if (data.type === "message_sent" || data.type === "system_message") {
          const newMessage = data.message;
          if (
            newMessage &&
            newMessage.id &&
            !messageIdsRef.current.has(newMessage.id)
          ) {
            messageIdsRef.current.add(newMessage.id);
            setMessages((prevMessages) => {
              const exists = prevMessages.some(
                (msg) => msg.id === newMessage.id,
              );
              if (!exists) {
                return [...prevMessages, newMessage];
              }
              return prevMessages;
            });
          }
        } else if (data.type === "message_history") {
          const newMessages = data.messages || [];
          messageIdsRef.current.clear();
          newMessages.forEach((msg) => {
            if (msg.id) messageIdsRef.current.add(msg.id);
          });
          setMessages(newMessages);
        }
      } catch (error) {
        console.error("Error parsing chat message:", error);
      }
    };

    subscribe(presenceTopic, presenceHandler);
    subscribe(chatTopic, chatHandler);

    return () => {
      unsubscribe(presenceTopic);
      unsubscribe(chatTopic);
    };
  }, [isReady, roomId, subscribe, unsubscribe]);

  useEffect(() => {
    setIsLoading(true);
    messageIdsRef.current.clear();

    const loadData = async () => {
      const apiUrl = getApiUrl();

      if (!roomId) {
        setIsLoading(false);
        return;
      }

      try {
        const [usersResponse, messagesResponse] = await Promise.all([
          fetch(`${apiUrl}/api/rooms/${roomId}/users`),
          fetch(`${apiUrl}/api/rooms/${roomId}/messages?limit=100`),
        ]);

        const usersData = usersResponse.ok ? await usersResponse.json() : [];
        const messagesData = messagesResponse.ok
          ? await messagesResponse.json()
          : [];

        // REST returns { id, name } only — same shape as WS but without `type`.
        // Without type, ChatSection's "online" filter sees 0 users. Also, this fetch
        // can run after WS presence and overwrite typed users — normalize here.
        const usersWithPresenceType = usersData.map((user) => ({
          ...user,
          type: "joining",
        }));

        messagesData.forEach((msg) => {
          if (msg.id) messageIdsRef.current.add(msg.id);
        });

        setUsers(usersWithPresenceType);
        setMessages(messagesData);
      } catch (error) {
        console.error("Failed to load collaboration data:", error);
        setUsers([]);
        setMessages([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [roomId]);

  useEffect(() => {
    if (isReady) {
      try {
        publish(`/app/room/${roomId}/presence.join`, {
          userId: me.id,
          name: me.name,
        });
      } catch (error) {
        console.error("Failed to join room:", error);
      }
    }
  }, [isReady, roomId, me.id, me.name, publish]);

  useEffect(() => {
    return () => {
      messageIdsRef.current.clear();
    };
  }, []);

  const sendMessage = (content) => {
    if (!isReady || !content.trim()) {
      return false;
    }

    try {
      publish(`/app/room/${roomId}/chat.send`, {
        content: content.trim(),
      });
      return true;
    } catch (error) {
      console.error("Failed to send message:", error);
      return false;
    }
  };

  return {
    users,
    messages,
    sendMessage,
    connected,
    isLoading,
    isReady,
  };
}
