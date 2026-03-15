import { useEffect, useRef, useState } from "react";
import { createAuctionBidSocket } from "@/services/buyer/LiveAuctionSocketService";
import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";

export function useAuctionBidsSocket(auctionId: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<BidWsEvent[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<"Live" | "Won" | "Closed">("Live");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [bidCount, setBidCount] = useState<number>(0);
  const [isExtended, setIsExtended] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    const ws = createAuctionBidSocket(
      auctionId,
      (evt: BidWsEvent) => {
        // Handle different event types based on event_type field
        console.log("Received WebSocket event:", evt.event_type, evt);
        
        if (evt.event_type === "BID_CREATED") {
          console.log("Bid created event received:", evt.data);
          setEvents((prev) => [evt, ...prev]);
          setAuctionStatus("Live");
        }
        
        if (evt.event_type === "AUCTION_WON") {
          setWinner(evt.data?.buyer_id || null);
          setFinalPrice(evt.data?.bid_amount || 0);
          setAuctionStatus("Won");
          console.log(`Auction Won: ${evt.data?.buyer_id} - $${evt.data?.bid_amount}`);
        }
        
        if (evt.event_type === "AUCTION_ENDED") {
          setWinner(evt.data?.buyer_id || null);
          setFinalPrice(evt.data?.bid_amount || 0);
          setAuctionStatus("Closed");
          setTimeLeft(0);
          console.log(`Auction Ended: ${evt.data?.buyer_id} - $${evt.data?.bid_amount}`);
        }
      },
      () => setConnected(true),
      () => setConnected(false)
    );

    wsRef.current = ws;

    // Ping to keep connection alive
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send("ping");
    }, 25000);

    // Local countdown timer
    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(ping);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      ws.close();
    };
  }, [auctionId]);

  return { 
    connected, 
    events, 
    auctionStatus,
    timeLeft,
    highestBid,
    bidCount,
    isExtended,
    winner,
    finalPrice
  };
}