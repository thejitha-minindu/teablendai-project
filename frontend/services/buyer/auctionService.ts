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
export async function listAuctionsOrder(userId: string): Promise<AuctionOrderDialog[]> {
    const orders = await apiClient.get<AuctionOrderDialog[]>(`${BUYER_API_BASE}/auctions/user/${userId}/orders`);
    return orders.data.map((order: AuctionOrderDialog) => ({
        auction_id: order.auction_id,
        auction_name: order.auction_name,
        estate_name: order.estate_name,
        grade: order.grade,
        quantity: order.quantity,
        sold_price: order.sold_price || 0,
        date: order.date,
        base_price: order.base_price || 0,
        order_id: order.order_id || "",
    }));
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
        buyer_name: auction.buyer_name,
        sold_price: auction.sold_price,
        origin: auction.origin,
        description: auction.description,
        bids,
    };
}

// Get auction order dialog data
export async function getAuctionOrderDialog(auctionId: string, userId: string): Promise<AuctionOrderDialog> {
    // Call the orders endpoint
    const orders = await listAuctionsOrder(userId);
    
    // Find the specific order by auction_id
    const order = orders.find(o => o.auction_id === auctionId);
    
    if (!order) {
        throw new Error("Order not found");
    }

    // Map to dialog format
    return {
        auction_id: order.auction_id,
        auction_name: order.auction_name,
        estate_name: order.estate_name,
        grade: order.grade,
        quantity: order.quantity,
        sold_price: order.sold_price || 0,
        date: order.date,
        base_price: order.base_price || 0,
        order_id: order.order_id || "",
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