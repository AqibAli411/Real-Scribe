import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useState,
} from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { getWsUrl } from "../utils/api";

// Create the WebSocket Context
const WebSocketContext = createContext(null);

// WebSocket Provider Component (used in parent, e.g., App.js)
export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map()); // Track active subscriptions
  const [user, setUser] = useState({ id: null, name: null });

  // Function to update user and connect WebSocket
  const connectWithUser = useCallback((userData) => {
    if (!userData.id || !userData.name) {
      console.error("User ID and name are required for WebSocket connection");
      return;
    }
    setUser(userData);
  }, []);

  useEffect(() => {
    // Only connect if user data is available and client is not already active
    if (!user.id || !user.name || clientRef.current?.active) {
      return;
    }

    const webSocketUrl = getWsUrl();

    const client = new Client({
      webSocketFactory: () => {
        // SockJS expects http(s) URLs — it handles ws(s) upgrade internally
        let finalUrl = webSocketUrl;

        // Ensure HTTPS if page is loaded over HTTPS
        if (
          window.location.protocol === "https:" &&
          finalUrl.startsWith("http://")
        ) {
          finalUrl = finalUrl.replace("http://", "https://");
        }

        // Fix accidentally passed ws:// or wss:// (SockJS needs http/https)
        if (finalUrl.startsWith("ws://") || finalUrl.startsWith("wss://")) {
          finalUrl = finalUrl.replace(/^wss?:\/\//, "https://");
        }

        return new SockJS(finalUrl);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        userId: user.id,
        name: user.name,
      },
      debug:
        import.meta.env.DEV
          ? (str) => console.debug("STOMP:", str)
          : () => {},
    });

    client.onConnect = () => {
      setConnected(true);
      // Re-subscribe to existing subscriptions
      subscriptionsRef.current.forEach((subInfo, topic) => {
        try {
          const subscription = client.subscribe(topic, (message) => {
            subInfo.handler(message);
          });
          subscriptionsRef.current.set(topic, {
            handler: subInfo.handler,
            subscription,
          });
        } catch (error) {
          console.error(`Failed to re-subscribe to ${topic}:`, error);
        }
      });
    };

    client.onDisconnect = () => {
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame.headers?.message || frame);
      setConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      subscriptionsRef.current.forEach(({ subscription }, topic) => {
        try {
          if (subscription) {
            subscription.unsubscribe();
          }
        } catch (error) {
          console.error(`Error unsubscribing from ${topic}:`, error);
        }
      });
      subscriptionsRef.current.clear();

      if (clientRef.current && clientRef.current.active) {
        try {
          clientRef.current.deactivate();
        } catch (error) {
          console.error("Error deactivating client:", error);
        }
      }
      clientRef.current = null;
    };
  }, [user.id, user.name]);

  // Subscribe to a topic
  const subscribe = useCallback((topic, handler) => {
    if (!clientRef.current?.connected) {
      // Queue subscription for when connection is established
      subscriptionsRef.current.set(topic, { handler, subscription: null });
      return;
    }

    if (subscriptionsRef.current.has(topic)) {
      return; // Already subscribed
    }

    try {
      const subscription = clientRef.current.subscribe(topic, handler);
      subscriptionsRef.current.set(topic, { handler, subscription });
    } catch (error) {
      console.error(`Failed to subscribe to ${topic}:`, error);
    }
  }, []);

  // Unsubscribe from a topic
  const unsubscribe = useCallback((topic) => {
    const subInfo = subscriptionsRef.current.get(topic);
    if (subInfo) {
      try {
        if (subInfo.subscription) {
          subInfo.subscription.unsubscribe();
        }
        subscriptionsRef.current.delete(topic);
      } catch (error) {
        console.error(`Error unsubscribing from ${topic}:`, error);
      }
    }
  }, []);

  // Publish a message
  const publish = useCallback((destination, body, headers = {}) => {
    if (!clientRef.current?.connected) {
      console.warn("Cannot publish: Client not connected");
      return;
    }

    try {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
        headers,
      });
    } catch (error) {
      console.error(`Failed to publish to ${destination}:`, error);
    }
  }, []);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        isReady: connected && clientRef.current?.connected,
        subscribe,
        unsubscribe,
        publish,
        connectWithUser,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
}

// Custom Hook for Child Components
export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }
  return context;
}
