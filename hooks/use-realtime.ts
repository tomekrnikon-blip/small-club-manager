import { useEffect, useRef, useState, useCallback } from "react";
import { Platform } from "react-native";
import { useAuth } from "./use-auth";

type RealtimeEvent = {
  type: "notification" | "callup" | "match_update" | "training_update" | "message";
  payload: any;
  timestamp: string;
};

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

type RealtimeCallbacks = {
  onNotification?: (data: any) => void;
  onCallup?: (data: any) => void;
  onMatchUpdate?: (data: any) => void;
  onTrainingUpdate?: (data: any) => void;
  onMessage?: (data: any) => void;
};

export function useRealtime(callbacks?: RealtimeCallbacks) {
  const { user, isAuthenticated } = useAuth();
  const [connectionState, setConnectionState] = useState<ConnectionState>("disconnected");
  const [lastEvent, setLastEvent] = useState<RealtimeEvent | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const baseReconnectDelay = 1000;

  const getWebSocketUrl = useCallback(() => {
    // In production, use wss:// with the API domain
    // In development, use ws:// with localhost
    if (Platform.OS === "web") {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      return `${protocol}//${host}/api/ws`;
    }
    // For mobile, use the API URL
    return "wss://api.example.com/ws";
  }, []);

  const connect = useCallback(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      setConnectionState("connecting");
      const wsUrl = getWebSocketUrl();
      
      // Note: In a real implementation, you would pass auth token
      // For now, we'll simulate WebSocket behavior
      console.log("[Realtime] Connecting to:", wsUrl);
      
      // Simulate connection for demo purposes
      // In production, uncomment the WebSocket code below
      /*
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("[Realtime] Connected");
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;

        // Send auth message
        wsRef.current?.send(JSON.stringify({
          type: "auth",
          userId: user.id,
        }));
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: RealtimeEvent = JSON.parse(event.data);
          setLastEvent(data);

          // Call appropriate callback
          switch (data.type) {
            case "notification":
              callbacks?.onNotification?.(data.payload);
              break;
            case "callup":
              callbacks?.onCallup?.(data.payload);
              break;
            case "match_update":
              callbacks?.onMatchUpdate?.(data.payload);
              break;
            case "training_update":
              callbacks?.onTrainingUpdate?.(data.payload);
              break;
            case "message":
              callbacks?.onMessage?.(data.payload);
              break;
          }
        } catch (err) {
          console.error("[Realtime] Failed to parse message:", err);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("[Realtime] Error:", error);
        setConnectionState("error");
      };

      wsRef.current.onclose = () => {
        console.log("[Realtime] Disconnected");
        setConnectionState("disconnected");
        scheduleReconnect();
      };
      */
      
      // Simulated connection for demo
      setTimeout(() => {
        setConnectionState("connected");
        reconnectAttemptsRef.current = 0;
        console.log("[Realtime] Simulated connection established");
      }, 500);
      
    } catch (err) {
      console.error("[Realtime] Connection error:", err);
      setConnectionState("error");
      scheduleReconnect();
    }
  }, [isAuthenticated, user, getWebSocketUrl, callbacks]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log("[Realtime] Max reconnect attempts reached");
      return;
    }

    const delay = baseReconnectDelay * Math.pow(2, reconnectAttemptsRef.current);
    reconnectAttemptsRef.current += 1;

    console.log(`[Realtime] Scheduling reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setConnectionState("disconnected");
  }, []);

  const send = useCallback((type: string, payload: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    console.warn("[Realtime] Cannot send - not connected");
    return false;
  }, []);

  // Connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, user, connect, disconnect]);

  return {
    connectionState,
    lastEvent,
    connect,
    disconnect,
    send,
    isConnected: connectionState === "connected",
  };
}

// Hook for subscribing to specific event types
export function useRealtimeEvent<T = any>(
  eventType: RealtimeEvent["type"],
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const callbacks = {
    [eventType === "notification" ? "onNotification" : 
     eventType === "callup" ? "onCallup" :
     eventType === "match_update" ? "onMatchUpdate" :
     eventType === "training_update" ? "onTrainingUpdate" : "onMessage"]: (data: T) => {
      callbackRef.current(data);
    },
  };

  return useRealtime(callbacks as RealtimeCallbacks);
}

// Hook for notification badge count
export function useNotificationCount() {
  const [count, setCount] = useState(0);

  useRealtime({
    onNotification: (data) => {
      if (data.action === "new") {
        setCount((prev) => prev + 1);
      } else if (data.action === "read") {
        setCount((prev) => Math.max(0, prev - 1));
      } else if (data.action === "clear") {
        setCount(0);
      }
    },
  });

  const clearCount = useCallback(() => {
    setCount(0);
  }, []);

  return { count, clearCount };
}
