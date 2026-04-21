export interface Bid {
  auction_id: string;
  bid_id: string;
  bid_amount: number;
  bid_time: Date;
  buyer_id: string;
  buyer_name?: string;
}
