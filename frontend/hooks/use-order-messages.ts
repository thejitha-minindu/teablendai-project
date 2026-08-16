import { useState, useEffect, useRef, useCallback } from "react";
import messageService, { OrderMessage } from "@/services/messageService";
import { getAuthToken } from "@/lib/auth";

const WS_BASE_URL =
  (process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000/api/v1").replace(/\/$/, "");

const POLLING_INTERVAL_MS = 4000;
const RECONNECT_INTERVAL_MS = 4000;

export function useOrderMessages(orderId: string, currentUserId: string) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  // ----- Helper: add unique messages -----
  const addMessages = useCallback((incoming: OrderMessage[]) => {
    setMessages((prev) => {
      const existingIds = new Set(prev.map((m) => m.message_id));
      const newOnes = incoming.filter((m) => !existingIds.has(m.message_id));
      if (newOnes.length === 0) return prev;
      return [...prev, ...newOnes].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    });
  }, []);

  // ----- Clear all timers -----
  const clearTimers = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = null;
    }
  }, []);

  // ----- Initial load -----
  const loadHistory = useCallback(async () => {
    if (!orderId) return;
    try {
      setIsLoading(true);
      const msgs = await messageService.getMessages(orderId);
      setMessages(
        msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      );
    } catch (err) {
      console.error("Failed to load message history", err);
    } finally {
      setIsLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ----- WebSocket Connection Logic -----
  const connectWebSocket = useCallback(() => {
    if (!orderId || !mountedRef.current) return;

    const token = getAuthToken();
    if (!token) return;

    // Clean up existing WS before starting new one
    if (wsRef.current) {
      try {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      } catch {}
      wsRef.current = null;
    }

    const wsUrl = `${WS_BASE_URL}/messages/order/${orderId}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setConnected(true);
      setIsReconnecting(false);

      // Stop polling when WS is active
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }

      // Keepalive ping
      if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
      pingIntervalRef.current = setInterval(() => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "ping" }));
        }
      }, 20000);
    };

    ws.onmessage = (event) => {
      try {
        const msg: OrderMessage = JSON.parse(event.data);
        if (msg && msg.message_id) {
          addMessages([msg]);
        }
      } catch (e) {
        console.error("Failed to parse message event", e);
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      setIsReconnecting(true);

      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }

      // Start polling fallback if not already running
      if (!pollingRef.current) {
        pollingRef.current = setInterval(async () => {
          if (!mountedRef.current) return;
          try {
            const msgs = await messageService.getMessages(orderId);
            addMessages(msgs);
          } catch (e) {
            console.error("Chat polling failed", e);
          }
        }, POLLING_INTERVAL_MS);
      }

      // Schedule auto-reconnect
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          connectWebSocket();
        }
      }, RECONNECT_INTERVAL_MS);
    };

    ws.onerror = (e) => {
      console.warn("Chat WebSocket error event:", e);
    };
  }, [orderId, addMessages]);

  // Connect on mount
  useEffect(() => {
    mountedRef.current = true;
    connectWebSocket();

    return () => {
      mountedRef.current = false;
      clearTimers();
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connectWebSocket, clearTimers]);

  // ----- Send message -----
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content }));
      } else {
        const msg = await messageService.sendMessage(orderId, content);
        addMessages([msg]);
      }
    },
    [orderId, addMessages]
  );

  const reconnect = useCallback(() => {
    setIsReconnecting(true);
    connectWebSocket();
  }, [connectWebSocket]);

  return {
    messages,
    connected,
    isReconnecting,
    isLoading,
    sendMessage,
    reconnect,
    currentUserId,
  };
}
