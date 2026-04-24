from datetime import datetime
from pydantic import BaseModel


class PurchasesSummary(BaseModel):
    totalPurchasedKg: float
    totalCostLkr: float
    averagePriceLkrPerKg: float
    uniqueSuppliers: int
    newSuppliersThisMonth: int
    purchaseOrders: int
    pendingOrders: int


class PurchaseVolumeByGradeItem(BaseModel):
    grade: str
    quantity: float
    cost: float


class PriceTrendItem(BaseModel):
    month: str
    prices: dict[str, float]


class SourceDistributionItem(BaseModel):
    source: str
    quantity: float
    percentage: float


class SupplierContributionItem(BaseModel):
    supplier: str
    quantity: float
    cost: float


class AnalyticsPurchasesResponse(BaseModel):
    generatedAt: datetime
    refreshIntervalMs: int
    summary: PurchasesSummary
    purchaseVolumeByGrade: list[PurchaseVolumeByGradeItem]
    priceTrends: list[PriceTrendItem]
    priceTrendGrades: list[str]
    sourceDistribution: list[SourceDistributionItem]
    supplierContribution: list[SupplierContributionItem]
