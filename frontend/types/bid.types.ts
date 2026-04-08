export interface Bid {
  auction_id: string;
  bid_id: string;
  bid_amount: number;
  bid_time: Date;  // Use date type for better logic handling 
  buyer_id: string;
}
