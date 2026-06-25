import { useState, useEffect, useRef, useCallback } from "react";
import messageService, { OrderMessage } from "@/services/messageService";
import { getAuthToken } from "@/lib/auth";

const WS_BASE_URL =
  (process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000/api/v1").replace(/\/$/, "");

const POLLING_INTERVAL_MS = 5000;
const POLLING_FALLBACK_DELAY_MS = 1500; // Delay before starting polling to avoid React StrictMode false triggers

export function useOrderMessages(orderId: string, currentUserId: string) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // ----- Helper: clear polling -----
  const clearPolling = useCallback(() => {
    if (pollingDelayRef.current) {
      clearTimeout(pollingDelayRef.current);
      pollingDelayRef.current = null;
    }
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  // ----- Initial load -----
  useEffect(() => {
    if (!orderId) return;
    setIsLoading(true);
    messageService
      .getMessages(orderId)
      .then((msgs) => {
        setMessages(msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [orderId]);

  // ----- WebSocket -----
  useEffect(() => {
    if (!orderId) return;

    mountedRef.current = true;

    const token = getAuthToken();
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}/messages/order/${orderId}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Clear any pending or active polling — WS is live
      clearPolling();
    };

    ws.onmessage = (event) => {
      try {
        const msg: OrderMessage = JSON.parse(event.data);
        addMessages([msg]);
      } catch (e) {
        console.error("Failed to parse order message WS event", e);
      }
    };

    ws.onclose = () => {
      setConnected(false);

      // Only start polling fallback if the component is still mounted
      // and no polling is already active. Use a delay to avoid false
      // triggers from React StrictMode unmount/remount cycles.
      if (!mountedRef.current) return;
      if (pollingRef.current || pollingDelayRef.current) return;

      pollingDelayRef.current = setTimeout(() => {
        // Double-check mount status after delay
        if (!mountedRef.current) return;

        pollingRef.current = setInterval(async () => {
          try {
            const msgs = await messageService.getMessages(orderId);
            addMessages(msgs);
          } catch (e) {
            console.error("Polling failed", e);
          }
        }, POLLING_INTERVAL_MS);
      }, POLLING_FALLBACK_DELAY_MS);
    };

    ws.onerror = () => {
      console.warn("Order chat WebSocket error – will fall back to polling.");
    };

    // Ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 25000);

    return () => {
      mountedRef.current = false;
      clearInterval(pingInterval);
      clearPolling();
      ws.close();
    };
  }, [orderId, addMessages, clearPolling]);

  // ----- Send a message -----
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return;

      // If WS is open, send via WS (server saves and broadcasts)
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ content }));
      } else {
        // Fallback: REST POST
        const msg = await messageService.sendMessage(orderId, content);
        addMessages([msg]);
      }
    },
    [orderId, addMessages]
  );

  return { messages, connected, isLoading, sendMessage, currentUserId };
}
