import { apiClient } from "@/lib/apiClient";

// --- Types ---
export interface OrderDetail {
  order_id: string;
  display_order_id: string | null;
  buyer_id: string;
  buyer_name: string | null;
  seller_id: string | null;
  seller_name: string | null;
  auction_id: string;
  auction_name: string | null;
  estate_name: string | null;
  grade: string | null;
  quantity: number | null;
  total_amount: number;
  sold_price: number | null;
  order_date: string | null;
  order_status: string;
  payment_status: string;
  created_at: string | null;
  updated_at: string | null;
  buyer_email?: string | null;
}

// --- Shared Order API ---

/** Get a single order by ID (works for both buyer and seller) */
export async function getOrderById(orderId: string): Promise<OrderDetail> {
  const res = await apiClient.get<OrderDetail>(`/orders/${orderId}`);
  return res.data;
}

/** Buyer: update payment status */
export async function updatePaymentStatus(orderId: string, status: string): Promise<OrderDetail> {
  const res = await apiClient.patch<OrderDetail>(`/orders/${orderId}/payment`, {
    payment_status: status,
  });
  return res.data;
}

/** Seller: update order status */
export async function updateOrderStatus(orderId: string, status: string): Promise<OrderDetail> {
  const res = await apiClient.patch<OrderDetail>(`/orders/${orderId}/status`, {
    order_status: status,
  });
  return res.data;
}

// --- Seller-specific API ---

/** List all orders for the authenticated seller */
export async function getSellerOrders(status?: string): Promise<OrderDetail[]> {
  const params = status ? { status } : {};
  const res = await apiClient.get<OrderDetail[]>("/seller/orders", { params });
  return res.data;
}

/** Get a single seller order detail */
export async function getSellerOrderDetail(orderId: string): Promise<OrderDetail> {
  const res = await apiClient.get<OrderDetail>(`/seller/orders/${orderId}`);
  return res.data;
}

/** Search seller orders by display order ID */
export async function searchSellerOrders(query: string): Promise<OrderDetail[]> {
  const res = await apiClient.get<OrderDetail[]>("/seller/orders/search/by-display-id", {
    params: { q: query },
  });
  return res.data;
}
