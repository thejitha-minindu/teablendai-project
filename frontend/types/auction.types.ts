export interface Auction {
  auction_id: string;
  seller_id: string;
  base_price: number;
  tea_code: string;
  status: 'active' | 'closed' | 'pending';
  duration: number;
  start_time: string;
}
