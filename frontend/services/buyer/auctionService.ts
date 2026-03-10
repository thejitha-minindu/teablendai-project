import {
    AuctionData,
    AuctionCardHomePreview,
    AuctionCard,
    AuctionHistoryCard,
    AuctionOrderCard,
    AuctionHistoryDialog,
    AuctionOrderDialog,
} from "@/types/buyer/auction.types";
import { WinsAuction } from "@/types/buyer/order.types";
import { listBidsByAuction } from "./bidService";
import { apiClient } from "@/lib/apiClient";

const BUYER_API_BASE = "/buyer";

// Create a new auction
export async function createAuction(auction: Partial<AuctionData>): Promise<AuctionData> {
    const response = await apiClient.post<AuctionData>(`${BUYER_API_BASE}/auctions/`, auction);
    return response.data;
}

// Get auction by ID
export async function getAuction(auctionId: string): Promise<AuctionData> {
    const response = await apiClient.get<AuctionData>(`${BUYER_API_BASE}/auctions/${auctionId}`);
    return response.data;
}

// List auctions (optionally filtered)
export async function listAuctions(params?: {
    userId?: string;
    asBuyer?: boolean;
    status?: string;
}): Promise<AuctionCard[]> {
    const response = await apiClient.get<AuctionCard[]>(`${BUYER_API_BASE}/auctions/`, {
        params: {
            ...(params?.userId ? { user_id: params.userId } : {}),
            ...(params?.asBuyer !== undefined ? { as_buyer: params.asBuyer } : {}),
            ...(params?.status ? { status: params.status } : {}),
        },
    });
    return response.data;
}

// List auction history for user
export async function listAuctionsHistory(userId: string, asBuyer = false): Promise<AuctionHistoryCard[]> {
    const response = await apiClient.get<AuctionHistoryCard[]>(
        `${BUYER_API_BASE}/auctions/user/${userId}/history`,
        {
            params: { as_buyer: asBuyer },
        }
    );
    return response.data;
}

// List auction orders for user
export async function listAuctionsOrder(userId: string): Promise<AuctionOrderCard[]> {
    const response = await apiClient.get<AuctionOrderCard[]>(`${BUYER_API_BASE}/auctions/user/${userId}/orders`);
    return response.data;
}

// List auctions in user's watchlist
export async function listAuctionsWatchlist(userId: string): Promise<AuctionCard[]> {
    const response = await apiClient.get<AuctionCard[]>(`${BUYER_API_BASE}/auctions/user/${userId}/watchlist`);
    return response.data;
}

// Get preview auctions for home page
export async function getHomePreviewAuctions(userId: string): Promise<AuctionCardHomePreview[]> {
    const response = await apiClient.get<AuctionCardHomePreview[]>(
        `${BUYER_API_BASE}/auctions/user/${userId}/preview`
    );
    return response.data;
}

// Get auction history dialog data
export async function getAuctionHistoryDialog(auctionId: string): Promise<AuctionHistoryDialog> {
    const [auction, bids] = await Promise.all([getAuction(auctionId), listBidsByAuction(auctionId)]);

    return {
        auction_id: auction.auction_id,
        auction_name: auction.auction_name,
        estate_name: auction.estate_name,
        grade: auction.grade,
        quantity: auction.quantity,
        base_price: auction.base_price,
        date: auction.date,
        buyer: auction.buyer,
        sold_price: auction.sold_price,
        bids,
    };
}

// Get auction order dialog data
export async function getAuctionOrderDialog(auctionId: string): Promise<AuctionOrderDialog> {
    const [auction, winsAuctions] = await Promise.all([
        getAuction(auctionId),
        getWinsAuctionByAuctionId(auctionId),
    ]);

    const winsAuction = winsAuctions[0];

    return {
        auction_id: auction.auction_id,
        auction_name: auction.auction_name,
        estate_name: auction.estate_name,
        grade: auction.grade,
        quantity: auction.quantity,
        sold_price: auction.sold_price,
        date: auction.date,
        base_price: auction.base_price,
        order_id: winsAuction?.order_id || "",
    };
}

// Get wins auction records by auction ID
async function getWinsAuctionByAuctionId(auctionId: string): Promise<WinsAuction[]> {
    const response = await apiClient.get<WinsAuction[]>(`${BUYER_API_BASE}/orders/wins/auction/${auctionId}`);
    return response.data;
}

// Add to watchlist
export async function addToWatchlist(userId: string, auctionId: string): Promise<void> {
    await apiClient.post(`${BUYER_API_BASE}/auctions/user/${userId}/watchlist/auctions/${auctionId}`);
}

// Remove from watchlist
export async function removeFromWatchlist(userId: string, auctionId: string): Promise<void> {
    await apiClient.delete(`${BUYER_API_BASE}/auctions/user/${userId}/watchlist/auctions/${auctionId}`);
}