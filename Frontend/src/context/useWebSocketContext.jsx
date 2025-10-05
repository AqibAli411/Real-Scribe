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

// Create the WebSocket Context
const WebSocketContext = createContext(null);

// WebSocket Provider Component (used in parent, e.g., App.js)
export function WebSocketProvider({ children }) {
  const [connected, setConnected] = useState(false);
  const clientRef = useRef(null);
  const subscriptionsRef = useRef(new Map()); // Track active subscriptions

  // const userRef = useRef({ id: null, name: null }); // Use ref to avoid state re-renders
  const [user, setUser] = useState({ id: null, name: null });

  // Function to update user and connect WebSocket
  const connectWithUser = useCallback((userData) => {
    if (!userData.id || !userData.name) {
      console.error("User ID and name are required for WebSocket connection");
      return;
    }

    setUser(userData);
    // Only update if user data changes
    // if (
    //   userRef.current.id !== userData.id ||
    //   userRef.current.name !== userData.name
    // ) {
    //   console.log("Updating user data:", userData);
    //   userRef.current.id = userData.id;
    //   userRef.current.name = userData.name;
    // }
  }, []);

  useEffect(() => {
    // Only connect if user data is available and client is not already active
    if (
      // !userRef.current.id ||
      // !userRef.current.name ||
      !user.id ||
      !user.name ||
      clientRef.current?.active
    ) {
      console.log("Skipping WebSocket connection:", {
        // hasUser: !!userRef.current.id && !!userRef.current.name,
        hasUser: !!user.id && !!user.name,
        isClientActive: !!clientRef.current?.active,
      });
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`http://localhost:8080/ws`),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: {
        userId: user.id,
        name: user.name,
      },
      debug: (str) => console.log("STOMP:", str),
    });

    client.onConnect = (frame) => {
      console.log("Connected to WebSocket:", frame);
      setConnected(true);
      // Re-subscribe to existing subscriptions
      subscriptionsRef.current.forEach((handler, topic) => {
        try {
          const subscription = client.subscribe(topic, (message) => {
            console.log(`Received message on ${topic}:`, message);
            handler(message);
          });
          subscriptionsRef.current.set(topic, { handler, subscription });
          console.log(`Re-subscribed to: ${topic}`);
        } catch (error) {
          console.error(`Failed to re-subscribe to ${topic}:`, error);
        }
      });
    };

    client.onDisconnect = (frame) => {
      console.log("Disconnected from WebSocket:", frame);
      setConnected(false);
    };

    client.onStompError = (frame) => {
      console.error("STOMP error:", frame);
      setConnected(false);
    };

    client.onWebSocketError = (error) => {
      console.error("WebSocket error:", error);
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      console.log("Cleaning up WebSocket connection in Provider");
      subscriptionsRef.current.forEach(({ subscription }, topic) => {
        try {
          if (subscription) {
            subscription.unsubscribe();
            console.log(`Unsubscribed from: ${topic}`);
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
  }, [user.id, user.name]); // Empty deps: run once unless manually triggered

  // Subscribe to a topic
  const subscribe = useCallback((topic, handler) => {
    if (!clientRef.current?.connected) {
      console.warn(`Client not connected; queuing subscription for ${topic}`);
      subscriptionsRef.current.set(topic, { handler, subscription: null });
      return;
    }

    if (subscriptionsRef.current.has(topic)) {
      console.warn(`Already subscribed to ${topic}`);
      return;
    }

    try {
      const subscription = clientRef.current.subscribe(topic, handler);
      subscriptionsRef.current.set(topic, { handler, subscription });
      console.log(`Subscribed to: ${topic}`);
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
          console.log(`Unsubscribed from: ${topic}`);
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
      console.error("Cannot publish: Client not connected");
      return;
    }

    try {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
        headers,
      });
      console.log(`Published to ${destination}:`, body);
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
