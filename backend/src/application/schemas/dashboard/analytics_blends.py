from datetime import datetime
from pydantic import BaseModel


class BlendsSummary(BaseModel):
    totalBlends: int
    averageProfitMarginPct: float
    bestPerformerBlend: str
    bestPerformerMarginPct: float
    totalBlendRevenueLkr: float


class BlendCompositionItem(BaseModel):
    blend: str
    ratios: dict[str, float]


class BlendProfitabilityItem(BaseModel):
    blend: str
    cost: float
    sellPrice: float
    margin: float
    revenue: float


class MonthlyBlendPerformanceItem(BaseModel):
    month: str
    revenues: dict[str, float]


class BlendMarketShareItem(BaseModel):
    blend: str
    share: float
    value: float


class ProfitMarginTrendItem(BaseModel):
    month: str
    margins: dict[str, float]


class AnnualComparisonItem(BaseModel):
    blend: str
    previousYearRevenue: float
    currentYearRevenue: float
    growth: float


class AnalyticsBlendsResponse(BaseModel):
    generatedAt: datetime
    refreshIntervalMs: int
    summary: BlendsSummary
    compositionStandards: list[str]
    blendSeries: list[str]
    summaryWindowMonths: int
    summaryWindowLabel: str
    annualPreviousYear: int
    annualCurrentYear: int
    blendComposition: list[BlendCompositionItem]
    blendProfitability: list[BlendProfitabilityItem]
    monthlyBlendPerformance: list[MonthlyBlendPerformanceItem]
    blendMarketShare: list[BlendMarketShareItem]
    profitMarginTrend: list[ProfitMarginTrendItem]
    annualComparison: list[AnnualComparisonItem]
