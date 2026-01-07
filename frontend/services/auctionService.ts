import { AuctionData, AuctionCardHomePreview, AuctionCard, AuctionHistoryCard, AuctionOrderCard, AuctionHistoryDialog, AuctionOrderDialog } from "../types/auction.types";
import { Bid } from "../types/bid.types";
import { Order } from "../types/order.types";

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

// Create a new auction
export async function createAuction(auction: Partial<AuctionData>): Promise<AuctionData> {
	return fetcher(`${API_BASE_URL}/auctions/`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(auction),
	});
}

// Get auction by ID
export async function getAuction(auctionId: string): Promise<AuctionData> {
	return fetcher(`${API_BASE_URL}/auctions/${auctionId}`);
}

// List auctions (optionally filtered)
export async function listAuctions(params?: { userId?: string; asBuyer?: boolean; status?: string }): Promise<AuctionCard[]> {
	const query = new URLSearchParams();
	if (params?.userId) query.append("user_id", params.userId);
	if (params?.asBuyer) query.append("as_buyer", String(params.asBuyer));
	if (params?.status) query.append("status", params.status);
	const url = `${API_BASE_URL}/auctions/?${query.toString()}`;
	return fetcher(url);
}

// List auction history for user
export async function listAuctionsHistory(userId: string, asBuyer = false): Promise<AuctionHistoryCard[]> {
	const url = `${API_BASE_URL}/auctions/user/${userId}/history?as_buyer=${asBuyer}`;
	return fetcher(url);
}

// List auction orders for user
export async function listAuctionsOrder(userId: string): Promise<AuctionOrderCard[]> {
	const url = `${API_BASE_URL}/auctions/user/${userId}/orders`;
	return fetcher(url);
}

// List auctions in user's watchlist
export async function listAuctionsWatchlist(userId: string): Promise<AuctionCard[]> {
	const url = `${API_BASE_URL}/auctions/user/${userId}/watchlist`;
	return fetcher(url);
}

// Get preview auctions for home page
export async function getHomePreviewAuctions(userId: string): Promise<AuctionCardHomePreview[]> {
	const url = `${API_BASE_URL}/auctions/user/${userId}/preview`;
	return fetcher(url);
}

// Get auction history dialog (with bids)
export async function getAuctionHistoryDialog(auctionId: string): Promise<AuctionHistoryDialog> {
	const url = `${API_BASE_URL}/auctions/${auctionId}/history-dialog`;
	return fetcher(url);
}

// Get auction order dialog (with order details)
export async function getAuctionOrderDialog(auctionId: string): Promise<AuctionOrderDialog> {
	const url = `${API_BASE_URL}/auctions/${auctionId}/order-dialog`;
	return fetcher(url);
}

