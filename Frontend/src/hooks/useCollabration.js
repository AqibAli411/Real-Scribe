// useCollaboration.jsx (unchanged from last version, but verify me is stable)
import { useEffect, useState, useRef } from "react";
import { useWebSocket } from "../context/useWebSocketContext";

export default function useCollaboration(roomId, me) {
  const [users, setUsers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const hasJoinedRef = useRef(false);
  const cleanupRef = useRef(null);
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
    console.log("this doesnt run");

    if (!isReady) return;
    const presenceTopic = `/topic/room.${roomId}.presence`;
    const presenceHandler = (message) => {
      try {
        const data = JSON.parse(message.body);
        console.log("Presence event:", data);
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
        console.log("Chat event:", data);
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
          } else {
            console.log("Duplicate message ignored:", newMessage?.id);
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
      try {
        const [usersResponse, messagesResponse] = await Promise.all([
          fetch(`http://localhost:8080/api/rooms/${roomId}/users`),
          fetch(`http://localhost:8080/api/rooms/${roomId}/messages?limit=100`),
        ]);

        const usersData = usersResponse.ok ? await usersResponse.json() : [];
        console.log("tracking users: ", usersData);
        const messagesData = messagesResponse.ok
          ? await messagesResponse.json()
          : [];

        messagesData.forEach((msg) => {
          if (msg.id) messageIdsRef.current.add(msg.id);
        });

        setUsers(usersData);
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
        hasJoinedRef.current = true;
      } catch (error) {
        console.error("Failed to join room:", error);
      }
    }

    cleanupRef.current = () => {
      if (isReady && hasJoinedRef.current) {
        try {
          publish(`/app/room/${roomId}/presence.leave`, {
            userId: me.id,
            name: me.name,
          });
          hasJoinedRef.current = false;
        } catch (error) {
          console.error("Failed to leave room:", error);
        }
      }
    };

    return cleanupRef.current;
  }, [isReady, roomId, me.id, me.name, publish]);

  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
      messageIdsRef.current.clear();
    };
  }, []);

  const sendMessage = (content) => {
    if (!isReady || !content.trim()) {
      console.warn("Cannot send message: not ready or empty content");
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
