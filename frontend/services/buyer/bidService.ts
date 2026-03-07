import { Bid } from "@/types/buyer/bid.types";
import { apiClient } from "@/lib/apiClient";

const BUYER_API_BASE = "/buyer";

// Create a new bid
export async function createBid(bid: Partial<Bid>): Promise<Bid> {
	const response = await apiClient.post<Bid>(`${BUYER_API_BASE}/bids`, bid);
	return response.data;
}

// Get bid by ID
export async function getBid(bidId: string): Promise<Bid> {
	const response = await apiClient.get<Bid>(`${BUYER_API_BASE}/bids/${bidId}`);
	return response.data;
}

// List bids (optionally filtered)
export async function listBids(params?: { userId?: string; auctionId?: string; minAmount?: number }): Promise<Bid[]> {
	const response = await apiClient.get<Bid[]>(`${BUYER_API_BASE}/bids`, {
		params: {
			...(params?.userId ? { user_id: params.userId } : {}),
			...(params?.auctionId ? { auction_id: params.auctionId } : {}),
			...(params?.minAmount !== undefined ? { min_amount: params.minAmount } : {}),
		},
	});
	return response.data;
}

// List all bids for an auction
export async function listBidsByAuction(auctionId: string): Promise<Bid[]> {
	const response = await apiClient.get<Bid[]>(`${BUYER_API_BASE}/bids/auction/${auctionId}`);
	return response.data;
}

// List bids by user for a specific auction
export async function listBidsByUserAuction(userId: string, auctionId: string): Promise<Bid[]> {
	const response = await apiClient.get<Bid[]>(`${BUYER_API_BASE}/bids/auction/${auctionId}/user/${userId}`);
	return response.data;
}

// Get the highest bid for an auction
export async function getHighestBidForAuction(auctionId: string): Promise<Bid> {
	const response = await apiClient.get<Bid>(`${BUYER_API_BASE}/bids/auction/${auctionId}/highest`);
	return response.data;
}
