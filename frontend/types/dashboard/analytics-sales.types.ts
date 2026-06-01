export interface SalesSummary {
  totalRevenueLkr: number;
  averageClosingPriceLkrPerKg: number;
  auctionsHeld: number;
  totalBids: number;
  averageTimeToSellDays: number;
}

export interface AuctionPerformanceItem {
  auction: string;
  basePrice: number;
  closingPrice: number;
  volume: number;
  bidCount: number;
}

export interface SellingTrendItem {
  month: string;
  revenue: number;
  volume: number;
  avgPrice: number;
}

export interface SellerPerformanceItem {
  seller: string;
  totalSales: number;
  avgMargin: number;
  auctionsWon: number;
}

export interface BidVolumeAnalysisItem {
  auction: string;
  totalBids: number;
  avgBidIncrement: number;
  winningBids: number;
}

export interface AnalyticsSalesResponse {
  generatedAt: string;
  refreshIntervalMs: number;
  summary: SalesSummary;
  auctionPerformance: AuctionPerformanceItem[];
  sellingTrends: SellingTrendItem[];
  sellerPerformance: SellerPerformanceItem[];
  bidVolumeAnalysis: BidVolumeAnalysisItem[];
}
