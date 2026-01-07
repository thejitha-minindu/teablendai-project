import { Bid } from "../types/bid.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

// Helper for fetch with error handling
async function fetcher<T>(url: string, options: RequestInit = {}): Promise<T> {
	const res = await fetch(url, options);
	if (!res.ok) {
		const error = await res.text();
		throw new Error(error || res.statusText);
	}
	return res.json();
}

// Create a new bid
export async function createBid(bid: Partial<Bid>): Promise<Bid> {
	return fetcher(`${API_BASE_URL}/bids`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(bid),
	});
}

// Get bid by ID
export async function getBid(bidId: string): Promise<Bid> {
	return fetcher(`${API_BASE_URL}/bids/${bidId}`);
}

// List bids (optionally filtered)
export async function listBids(params?: { userId?: string; auctionId?: string; minAmount?: number }): Promise<Bid[]> {
	const query = new URLSearchParams();
	if (params?.userId) query.append("user_id", params.userId);
	if (params?.auctionId) query.append("auction_id", params.auctionId);
	if (params?.minAmount !== undefined) query.append("min_amount", String(params.minAmount));
	const url = `${API_BASE_URL}/bids?${query.toString()}`;
	return fetcher(url);
}

// List all bids for an auction
export async function listBidsByAuction(auctionId: string): Promise<Bid[]> {
	const url = `${API_BASE_URL}/bids/auction/${auctionId}`;
	return fetcher(url);
}

// List bids by user for a specific auction
export async function listBidsByUserAuction(userId: string, auctionId: string): Promise<Bid[]> {
	const url = `${API_BASE_URL}/bids/auction/${auctionId}/user/${userId}`;
	return fetcher(url);
}

// Get the highest bid for an auction
export async function getHighestBidForAuction(auctionId: string): Promise<Bid> {
	const url = `${API_BASE_URL}/bids/auction/${auctionId}/highest`;
	return fetcher(url);
}
