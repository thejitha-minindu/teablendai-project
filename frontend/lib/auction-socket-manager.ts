/**
 * Shared Auction WebSocket Manager
 * 
 * Singleton that manages ONE WebSocket connection per auction ID with
 * reference counting. Multiple components calling useAuctionBidsSocket()
 * for the same auction will share the same underlying WebSocket.
 */
import { createWsClient } from "@/lib/wsClient";
import { getAuthToken } from "@/lib/auth";
import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";

interface AuctionSocketCallbacks {
  onEvent: (evt: BidWsEvent) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

interface ManagedSocket {
  ws: WebSocket;
  subscribers: Map<string, AuctionSocketCallbacks>;
  pingInterval: ReturnType<typeof setInterval>;
}

// Module-level singleton map: auctionId -> ManagedSocket
const activeSockets = new Map<string, ManagedSocket>();

let subscriberIdCounter = 0;

function generateSubscriberId(): string {
  return `sub_${++subscriberIdCounter}_${Date.now()}`;
}

/**
 * Subscribe to an auction's WebSocket events.
 * If no connection exists for this auction, one is created.
 * If one already exists, the subscriber piggybacks on it.
 * 
 * Returns an unsubscribe function. When the last subscriber
 * unsubscribes, the WebSocket is closed.
 */
export function subscribeToAuction(
  auctionId: string,
  callbacks: AuctionSocketCallbacks
): () => void {
  if (!auctionId) {
    return () => {};
  }

  const subscriberId = generateSubscriberId();

  // If a connection already exists for this auction, add the subscriber
  const existing = activeSockets.get(auctionId);
  if (existing) {
    existing.subscribers.set(subscriberId, callbacks);

    // If already connected, notify immediately
    if (existing.ws.readyState === WebSocket.OPEN) {
      callbacks.onOpen?.();
    }

    return () => unsubscribe(auctionId, subscriberId);
  }

  // No existing connection — create a new one
  const token = getAuthToken();
  if (!token) {
    console.error("[AuctionSocketManager] No auth token found");
    callbacks.onClose?.();
    return () => {};
  }

  const ws = createWsClient(`buyer/live/auction/${auctionId}`, token);
  const subscribers = new Map<string, AuctionSocketCallbacks>();
  subscribers.set(subscriberId, callbacks);

  ws.onopen = () => {
    console.log(`[AuctionSocketManager] Connected: auction=${auctionId} (${subscribers.size} subscribers)`);
    for (const sub of subscribers.values()) {
      sub.onOpen?.();
    }
  };

  ws.onclose = (event) => {
    console.log(`[AuctionSocketManager] Closed: auction=${auctionId} code=${event.code}`);
    for (const sub of subscribers.values()) {
      sub.onClose?.();
    }
    // Clean up the managed socket entry
    const managed = activeSockets.get(auctionId);
    if (managed && managed.ws === ws) {
      clearInterval(managed.pingInterval);
      activeSockets.delete(auctionId);
    }
  };

  ws.onerror = () => {
    // WebSocket errors are expected during React StrictMode cycles and navigation.
    // Browser ErrorEvents never contain useful details (always {}), so we log
    // as warn to avoid triggering the Next.js dev error overlay.
    console.warn(`[AuctionSocketManager] WebSocket error for auction=${auctionId} (readyState=${ws.readyState})`);
  };

  ws.onmessage = (msg) => {
    try {
      const data = JSON.parse(msg.data);
      
      if (data.error) {
        console.error("[AuctionSocketManager] Server error:", data.error);
        ws.close();
        return;
      }

      const parsed = data as BidWsEvent;
      const normalized: BidWsEvent = {
        ...parsed,
        data: {
          ...parsed.data,
          bid_time: new Date(parsed.data.bid_time),
        },
      };

      for (const sub of subscribers.values()) {
        sub.onEvent(normalized);
      }
    } catch (e) {
      console.error("[AuctionSocketManager] Failed to parse message:", {
        raw: msg.data,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  // Ping to keep connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("ping");
    }
  }, 25000);

  activeSockets.set(auctionId, { ws, subscribers, pingInterval });

  return () => unsubscribe(auctionId, subscriberId);
}

function unsubscribe(auctionId: string, subscriberId: string): void {
  const managed = activeSockets.get(auctionId);
  if (!managed) return;

  managed.subscribers.delete(subscriberId);

  // If no more subscribers, close the WebSocket
  if (managed.subscribers.size === 0) {
    console.log(`[AuctionSocketManager] Last subscriber left, closing: auction=${auctionId}`);
    clearInterval(managed.pingInterval);
    if (managed.ws.readyState === WebSocket.OPEN || managed.ws.readyState === WebSocket.CONNECTING) {
      managed.ws.close();
    }
    activeSockets.delete(auctionId);
  }
}
