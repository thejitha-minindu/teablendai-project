import { Bid } from "./bid.types";
import { Order } from "./order.types";

export type AuctionType = "scheduled" | "live" | "history";

export interface AuctionData {
  auction_id: string;
  auction_name: string;
  company_name: string;
  estate_name: string;
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
  image_url?: string;
}

export interface AuctionCardProps {
  type: AuctionType;
  id: string;
  data: AuctionData;
  onViewClick?: (id: string) => void; // Added this
}

export type AuctionCardHomePreview = Pick<
  AuctionData,
  "auction_id" | "grade" | "quantity" | "base_price" | "date" | "status" | "image_url"
>;

export type AuctionCard = Pick<
  AuctionData,
  "auction_id" | "auction_name" | "company_name" | "estate_name" | "grade" | "quantity" | "base_price" | "date"
  >;

export type AuctionHistoryCard = Pick<
  AuctionData,
  "auction_id" | "auction_name" | "company_name" | "estate_name" | "grade" | "quantity" | "date" | "buyer" | "sold_price"
>;

export type AuctionOrderCard = Pick<
  AuctionData,
  "auction_id" | "auction_name" | "company_name" | "estate_name" | "grade" | "quantity" | "sold_price" | "date"
>;

export type AuctionHistoryDialog = Pick<
  AuctionData,
  "auction_id" | "auction_name" | "estate_name" | "grade" | "quantity" | "base_price" | "date" | "buyer" | "sold_price"
> & {
  bids: Bid[];
};

export type AuctionOrderDialog = Pick<
  AuctionData,
  "auction_id" | "auction_name" | "estate_name" | "grade" | "quantity" | "sold_price" | "date" | "base_price"
> & {
  order_id: string;
};