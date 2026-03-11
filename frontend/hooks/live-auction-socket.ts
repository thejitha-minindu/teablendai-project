import { useEffect, useRef, useState } from "react";
import { createAuctionBidSocket } from "@/services/buyer/LiveAuctionSocketService";
import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";

export interface AuctionTimerEvent {
  event: "BID_PLACED" | "AUCTION_WON" | "AUCTION_ENDED";
  remaining_seconds?: number;
  extended?: boolean;
  grace_period_seconds?: number;
  winner_id?: string;
  final_price?: number;
  status?: "Live" | "Won" | "Closed";
  highest_bid?: number;
  bid_count?: number;
}

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
      (evt) => {
        // Handle different event types
        const event = evt as AuctionTimerEvent;
        
        if (event.event === "BID_PLACED") {
          setEvents((prev) => [evt, ...prev]);
          setTimeLeft(event.remaining_seconds || 0);
          setHighestBid(event.highest_bid || 0);
          setBidCount(event.bid_count || 0);
          setAuctionStatus("Live");
          
          // Show extension animation
          if (event.extended) {
            setIsExtended(true);
            setTimeout(() => setIsExtended(false), 1000);
          }
        }
        
        if (event.event === "AUCTION_WON") {
          setWinner(event.winner_id || null);
          setFinalPrice(event.final_price || 0);
          setAuctionStatus("Won");
          setTimeLeft(event.grace_period_seconds || 0);
          console.log(`🏆 Auction Won: ${event.winner_id} - $${event.final_price}`);
        }
        
        if (event.event === "AUCTION_ENDED") {
          setWinner(event.winner_id || null);
          setFinalPrice(event.final_price || 0);
          setAuctionStatus("Closed");
          setTimeLeft(0);
          console.log(`✅ Auction Ended: ${event.winner_id} - $${event.final_price}`);
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