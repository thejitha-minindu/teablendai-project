import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";

const API_BASE_URL = (() => {
  const baseUrl = (process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000/api/v1").replace(/\/$/, "");
  return `${baseUrl}/buyer`;
})();

export function createAuctionBidSocket(
  auctionId: string,
  onEvent: (evt: BidWsEvent) => void,
  onOpen?: () => void,
  onClose?: () => void,
) {
  // Get JWT token from localStorage
  const token = typeof window !== "undefined" ? localStorage.getItem("teablend_token") : null;
  
  if (!token) {
    console.error("No authentication token found. User must be logged in.");
    onClose?.();
    // Return a dummy WebSocket that won't connect
    const dummyWs = new WebSocket("about:blank");
    dummyWs.close();
    return dummyWs;
  }

  const wsUrl = `${API_BASE_URL}/live/auction/${auctionId}?token=${encodeURIComponent(token)}`;
  console.log("Connecting to WebSocket:", wsUrl.substring(0, wsUrl.length - 20) + "...[token]");
  
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connected for auction:", auctionId);
    onOpen?.();
  };
  
  ws.onclose = (event) => {
    console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
    onClose?.();
  };
  
  ws.onerror = (event) => {
    console.error("WebSocket error:", {
      type: event.type,
      timeStamp: event.timeStamp,
      readyState: ws.readyState,
      url: ws.url,
      message: "Connection failed. Check if server is running and token is valid.",
    });
  };
  
  ws.onmessage = (msg) => {
    console.log("Raw WebSocket message received:", msg.data);
    // Check for error messages from server
    try {
      const data = JSON.parse(msg.data);
      console.log("✅ Parsed WebSocket message:", data);
      
      if (data.error) {
        console.error("Server error via WebSocket:", data.error);
        ws.close();
        onClose?.();
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
      console.log("Calling onEvent with:", normalized);
      onEvent(normalized);
    } catch (e) {
      console.error('Failed to parse WebSocket message:', {
        raw: msg.data,
        error: e instanceof Error ? e.message : String(e),
        errorStack: e instanceof Error ? e.stack : undefined
      });
    }
  };

  return ws;
}
