import { useEffect, useRef, useState } from "react";
import { createAuctionBidSocket } from "@/services/buyer/LiveAuctionSocketService";
import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";
import { subscribeToAuthChanges } from "@/lib/auth";

export function useAuctionBidsSocket(auctionId: string) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<BidWsEvent[]>([]);
  const [auctionStatus, setAuctionStatus] = useState<"Live" | "Won" | "Closed">("Live");
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [bidCount, setBidCount] = useState<number>(0);
  const [isExtended, setIsExtended] = useState<boolean>(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const extensionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!auctionId) return;

    const cleanupSocket = (socket: WebSocket) => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (extensionTimeoutRef.current) clearTimeout(extensionTimeoutRef.current);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };

    const ws = createAuctionBidSocket(
      auctionId,
      (evt: BidWsEvent) => {
        // Handle different event types based on event_type field
        const eventType = String(evt.event_type);
        console.log("Received WebSocket event:", eventType, evt);
        
        if (eventType === "BID_CREATED") {
          console.log("Bid created event received:", evt.data);
          setEvents((prev) => [evt, ...prev]);
          setAuctionStatus("Live");

          const bidAmount = Number(evt.data?.bid_amount ?? 0);
          setHighestBid((prev) => Math.max(prev, bidAmount));
          setBidCount((prev) => prev + 1);

          setTimeLeft((prev) => {
            if (prev > 0 && prev <= 10) {
              setIsExtended(true);
              if (extensionTimeoutRef.current) clearTimeout(extensionTimeoutRef.current);
              extensionTimeoutRef.current = setTimeout(() => {
                setIsExtended(false);
              }, 1500);
              return prev + 10;
            }
            return prev;
          });
        }
        
        if (eventType === "AUCTION_WON") {
          console.log("Auction won event received:", evt.data);
          setEvents((prev) => [evt, ...prev]);
          setWinner(evt.data?.winner_id || null);
          setFinalPrice(evt.data?.final_price || 0);
          setAuctionStatus("Won");
          setTimeLeft(0);
          if (evt.data?.final_price) setHighestBid(evt.data.final_price);
        }
        
        if (eventType === "AUCTION_CLOSED") {
          setWinner(evt.data?.buyer_id || null);
          setFinalPrice(evt.data?.bid_amount || 0);
          setAuctionStatus("Closed");
          setTimeLeft(0);
          if (evt.data?.bid_amount) setHighestBid(evt.data.bid_amount);
          console.log(`Auction Closed: ${evt.data?.buyer_id} - $${evt.data?.bid_amount}`);
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

    const unsubscribe = subscribeToAuthChanges((detail) => {
      if (detail.reason === "logout" || detail.reason === "expired") {
        cleanupSocket(ws);
      }
    });

    return () => {
      unsubscribe();
      clearInterval(ping);
      cleanupSocket(ws);
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