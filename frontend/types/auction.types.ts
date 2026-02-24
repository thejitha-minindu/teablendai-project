export type AuctionType = "scheduled" | "live" | "history";

export interface AuctionData {
  auction_id: string;
  seller_id: string;
  grade: string;
  quantity: number;
  base_price: number;
  date: Date;
  duration: number;
  status: AuctionType;
  buyer?: string;
  sold_price?: number;
  countdown?: string;
}

export interface AuctionCardProps {
  type: AuctionType;
  id: string;
  data: AuctionData;
  onViewClick?: (id: string) => void; // Added this
}