import type { BidWsEvent } from "@/types/buyer/LiveAuctionSocket.types";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_WS_URL || "ws://localhost:8000/api/v1"}/buyer`;

export function createAuctionBidSocket(
  auctionId: string,
  onEvent: (evt: BidWsEvent) => void,
  onOpen?: () => void,
  onClose?: () => void,
) {
  const ws = new WebSocket(`${API_BASE_URL}/live/auction/${auctionId}`);

  ws.onopen = () => onOpen?.();
  ws.onclose = () => onClose?.();
  ws.onmessage = (msg) => {
    try {
      const parsed = JSON.parse(msg.data) as BidWsEvent;
      const normalized: BidWsEvent = {
        ...parsed,
        data: {
          ...parsed.data,
          bid_time: new Date(parsed.data.bid_time),
        },
      };
      onEvent(normalized);
    } catch {
      console.error('Failed to parse WebSocket message:', msg.data);
    }
  };

  return ws;
}
