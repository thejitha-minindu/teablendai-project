export type BidEventType =
  | "BID_CREATED"
  | "BID_UPDATED"
  | "BID_RETRACTED"
  | "AUCTION_CLOSED";

export type BidData = {
  winner_name: string | undefined;
  buyer_name: string | undefined;
  auction_id: string;
  bid_id: string;
  bid_amount: number;
  bid_time: Date;
  buyer_id: string;
  winner_id?: string;
  final_price?: number;
};

export type BidWsEvent = {
  event_id: string;
  event_type: BidEventType;
  version: 1;
  auction_id: string;
  occurred_at: string;
  data: BidData;
};