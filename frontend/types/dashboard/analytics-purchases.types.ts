export interface PurchasesSummary {
  totalPurchasedKg: number;
  totalCostLkr: number;
  averagePriceLkrPerKg: number;
  uniqueSuppliers: number;
  newSuppliersThisMonth: number;
  purchaseOrders: number;
  pendingOrders: number;
}

export interface PurchaseVolumeByGradeItem {
  grade: string;
  quantity: number;
  cost: number;
}

export interface PriceTrendItem {
  month: string;
  prices: Record<string, number>;
}

export interface SourceDistributionItem {
  source: string;
  quantity: number;
  percentage: number;
}

export interface SupplierContributionItem {
  supplier: string;
  quantity: number;
  cost: number;
}

export interface AnalyticsPurchasesResponse {
  generatedAt: string;
  refreshIntervalMs: number;
  summary: PurchasesSummary;
  purchaseVolumeByGrade: PurchaseVolumeByGradeItem[];
  priceTrends: PriceTrendItem[];
  priceTrendGrades: string[];
  sourceDistribution: SourceDistributionItem[];
  supplierContribution: SupplierContributionItem[];
}
