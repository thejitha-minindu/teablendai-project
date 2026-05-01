export interface BlendsSummary {
  totalBlends: number;
  averageProfitMarginPct: number;
  bestPerformerBlend: string;
  bestPerformerMarginPct: number;
  totalBlendRevenueLkr: number;
}

export interface BlendCompositionItem {
  blend: string;
  ratios: Record<string, number>;
}

export interface BlendProfitabilityItem {
  blend: string;
  cost: number;
  sellPrice: number;
  margin: number;
  revenue: number;
}

export interface MonthlyBlendPerformanceItem {
  month: string;
  revenues: Record<string, number>;
}

export interface BlendMarketShareItem {
  blend: string;
  share: number;
  value: number;
}

export interface ProfitMarginTrendItem {
  month: string;
  margins: Record<string, number>;
}

export interface AnnualComparisonItem {
  blend: string;
  previousYearRevenue: number;
  currentYearRevenue: number;
  growth: number;
}

export interface AnalyticsBlendsResponse {
  generatedAt: string;
  refreshIntervalMs: number;
  summary: BlendsSummary;
  compositionStandards: string[];
  blendSeries: string[];
  summaryWindowMonths: number;
  summaryWindowLabel: string;
  annualPreviousYear: number;
  annualCurrentYear: number;
  blendComposition: BlendCompositionItem[];
  blendProfitability: BlendProfitabilityItem[];
  monthlyBlendPerformance: MonthlyBlendPerformanceItem[];
  blendMarketShare: BlendMarketShareItem[];
  profitMarginTrend: ProfitMarginTrendItem[];
  annualComparison: AnnualComparisonItem[];
}
