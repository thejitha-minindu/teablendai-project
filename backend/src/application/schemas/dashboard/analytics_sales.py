from datetime import datetime
from pydantic import BaseModel


class SalesSummary(BaseModel):
    totalRevenueLkr: float
    averageClosingPriceLkrPerKg: float
    auctionsHeld: int
    totalBids: int
    averageTimeToSellDays: float


class AuctionPerformanceItem(BaseModel):
    auction: str
    basePrice: float
    closingPrice: float
    volume: float
    bidCount: int


class SellingTrendItem(BaseModel):
    month: str
    revenue: float
    volume: float
    avgPrice: float


class SellerPerformanceItem(BaseModel):
    seller: str
    totalSales: float
    avgMargin: float
    auctionsWon: int


class BidVolumeAnalysisItem(BaseModel):
    auction: str
    totalBids: int
    avgBidIncrement: float
    winningBids: int


class AnalyticsSalesResponse(BaseModel):
    generatedAt: datetime
    refreshIntervalMs: int
    summary: SalesSummary
    auctionPerformance: list[AuctionPerformanceItem]
    sellingTrends: list[SellingTrendItem]
    sellerPerformance: list[SellerPerformanceItem]
    bidVolumeAnalysis: list[BidVolumeAnalysisItem]