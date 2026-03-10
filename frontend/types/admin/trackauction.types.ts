
export type TrackAuctionDetails = {
    
	createdDetails?: string;
	bidedDetails?: string;
	wonDetails?: string;
	paymentDetails?: string;
};

export type TrackAuctionCardProps = {
	auctionName: string;
} & TrackAuctionDetails;

export type TrackAuctionItem = {
	id: string | number;
	auctionName: string;
	details?: TrackAuctionDetails;
	status?: "created" | "bided" | "won" | "paid" | string;
	createdAt?: string; // ISO timestamp
};

export type TrackAuctionPageProps = {
	items: TrackAuctionItem[];
	total?: number;
	loading?: boolean;
	error?: string | null;
};

export type TrackAuctionApiResponse = {
	data: TrackAuctionItem[];
	total?: number;
};

