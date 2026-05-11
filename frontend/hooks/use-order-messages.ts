import { useState, useEffect, useRef, useCallback } from "react";
import messageService, { OrderMessage } from "@/services/messageService";
import { getAuthToken } from "@/lib/auth";

const WS_BASE_URL =
  (process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000/api/v1").replace(/\/$/, "");

const POLLING_INTERVAL_MS = 5000;

export function useOrderMessages(orderId: string, currentUserId: string) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const usingPollingRef = useRef(false);

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

    const token = getAuthToken();
    if (!token) return;

    const wsUrl = `${WS_BASE_URL}/messages/order/${orderId}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      usingPollingRef.current = false;
      // Clear any polling fallback
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
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
      // Start polling fallback if not already running
      if (!pollingRef.current) {
        usingPollingRef.current = true;
        pollingRef.current = setInterval(async () => {
          try {
            const msgs = await messageService.getMessages(orderId);
            addMessages(msgs);
          } catch (e) {
            console.error("Polling failed", e);
          }
        }, POLLING_INTERVAL_MS);
      }
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
      clearInterval(pingInterval);
      ws.close();
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [orderId, addMessages]);

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
