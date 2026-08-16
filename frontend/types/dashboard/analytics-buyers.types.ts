export interface BuyersSummary {
  totalBuyers: number;
  activeBuyers: number;
  avgParticipation: number;
  repeatRate: number;
  newBuyersThisMonth: number;
}

export interface BuyerParticipationItem {
  buyer: string;
  frequency: number;
  totalBids: number;
  wonAuctions: number;
}

export interface MostActiveBuyerItem {
  buyer: string;
  volume: number;
  spend: number;
  avgBid: number;
}

export interface BidIncrementAnalysisItem {
  buyer: string;
  avgIncrement: number;
  maxIncrement: number;
  bidStyle: string;
}

export interface DemandByGradeItem {
  grade: string;
  buyerDemand: Record<string, number>;
}

export interface RepeatBuyerRateItem {
  month: string;
  newBuyers: number;
  repeatBuyers: number;
  rate: number;
}

export interface BuyerSegmentationItem {
  segment: string;
  buyers: number;
  percentage: number;
  contribution: number;
}

export interface MonthlyEngagementItem {
  month: string;
  activeBuyers: number;
  totalBids: number;
  avgBidsPerBuyer: number;
}

export interface AnalyticsBuyersResponse {
  generatedAt: string;
  refreshIntervalMs: number;
  summary: BuyersSummary;
  summaryWindowMonths: number;
  summaryWindowLabel: string;
  buyerSeries: string[];
  buyerParticipation: BuyerParticipationItem[];
  mostActiveBuyers: MostActiveBuyerItem[];
  bidIncrementAnalysis: BidIncrementAnalysisItem[];
  demandByGrade: DemandByGradeItem[];
  repeatBuyerRate: RepeatBuyerRateItem[];
  buyerSegmentation: BuyerSegmentationItem[];
  monthlyEngagement: MonthlyEngagementItem[];
}
