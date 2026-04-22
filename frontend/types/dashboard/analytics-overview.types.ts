export type Trending = "up" | "down" | "neutral";

export interface KPIItem {
  value: number;
  trend: number;
  trending: Trending;
}

export interface RevenueByMonthItem {
  month: string;
  revenue: number;
  purchases: number;
}

export interface TeaGradeDistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface TopBlendItem {
  name: string;
  sales: number;
  profit: number;
}

export interface QuickStats {
  totalCustomers: number;
  activeBuyers: number;
  completedAuctionsThisMonth: number;
  averageBlendMargin: number;
  inventoryStockKg: number;
  pendingOrders: number;
}

export interface AnalyticsOverviewResponse {
  generatedAt: string;
  refreshIntervalMs: number;
  kpis: {
    totalPurchased: KPIItem;
    totalSold: KPIItem;
    totalRevenue: KPIItem;
    avgAuctionPrice: KPIItem;
    profitMargin: KPIItem;
    activeAuctions: KPIItem;
  };
  revenueByMonth: RevenueByMonthItem[];
  teaGradeDistribution: TeaGradeDistributionItem[];
  topBlends: TopBlendItem[];
  quickStats: QuickStats;
}
