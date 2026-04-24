from datetime import datetime
from pydantic import BaseModel


class BuyersSummary(BaseModel):
    totalBuyers: int
    activeBuyers: int
    avgParticipation: float
    repeatRate: float
    newBuyersThisMonth: int


class BuyerParticipationItem(BaseModel):
    buyer: str
    frequency: int
    totalBids: int
    wonAuctions: int


class MostActiveBuyerItem(BaseModel):
    buyer: str
    volume: float
    spend: float
    avgBid: float


class BidIncrementAnalysisItem(BaseModel):
    buyer: str
    avgIncrement: float
    maxIncrement: float
    bidStyle: str


class DemandByGradeItem(BaseModel):
    grade: str
    buyerDemand: dict[str, float]


class RepeatBuyerRateItem(BaseModel):
    month: str
    newBuyers: int
    repeatBuyers: int
    rate: float


class BuyerSegmentationItem(BaseModel):
    segment: str
    buyers: int
    percentage: float
    contribution: float


class MonthlyEngagementItem(BaseModel):
    month: str
    activeBuyers: int
    totalBids: int
    avgBidsPerBuyer: float


class AnalyticsBuyersResponse(BaseModel):
    generatedAt: datetime
    refreshIntervalMs: int
    summary: BuyersSummary
    summaryWindowMonths: int
    summaryWindowLabel: str
    buyerSeries: list[str]
    buyerParticipation: list[BuyerParticipationItem]
    mostActiveBuyers: list[MostActiveBuyerItem]
    bidIncrementAnalysis: list[BidIncrementAnalysisItem]
    demandByGrade: list[DemandByGradeItem]
    repeatBuyerRate: list[RepeatBuyerRateItem]
    buyerSegmentation: list[BuyerSegmentationItem]
    monthlyEngagement: list[MonthlyEngagementItem]
