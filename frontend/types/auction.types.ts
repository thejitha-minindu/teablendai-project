export interface Auction {
  auction_id: string;
  seller_id: string;
  base_price: number;
  tea_code: string;
  status: 'active' | 'closed' | 'pending';
  duration: number;
  start_time: string;
}

export type AuctionType = 'scheduled' | 'live' | 'history';

export interface AuctionData {
  grade: string;
  quantity: number;
  price: number;
  date?: string;
  time?: string;
  buyer?: string;
  status?: string;
  countdown?: string;
}

export interface AuctionCardProps {
  type: AuctionType;
  id: string; 
  data: AuctionData;
  onViewClick?: (id: string) => void; // Added this
}
