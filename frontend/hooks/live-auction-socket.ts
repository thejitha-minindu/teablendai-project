import { useEffect, useRef, useState } from "react";
import { createAuctionBidSocket } from "@/services/buyer/LiveAuctionSocketService";
import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";

export function useAuctionBidsSocket(auctionId: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<BidWsEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    const ws = createAuctionBidSocket(
      auctionId,
      (evt) => setEvents((prev) => [evt, ...prev]),
      () => setConnected(true),
      () => setConnected(false)
    );

    wsRef.current = ws;

    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 25000);

    return () => {
      clearInterval(ping);
      ws.close();
    };
  }, [auctionId]);

  return { connected, events };
}