export interface WinsAuction {
  auction_id: string;
  user_id: string;
  order_id: string;
}

export interface Order {
  order_id: string;
  user_id: string;
  auction_id: string;
  total_price: number;
  order_date: Date;
  status: "pending" | "completed" | "canceled";
  payment_details: PaymentDetails;
}

export interface PaymentDetails {
  payment_id: string;
  payment_method: string;
  payment_date: Date;
  order_id: string;
  amount: number;
  status: "successful" | "failed" | "pending";
}
