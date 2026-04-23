from datetime import datetime
from typing import Literal
from pydantic import BaseModel

Trending = Literal["up", "down", "neutral"]


class KPIItem(BaseModel):
    value: float
    trend: float
    trending: Trending

class QuickStats(BaseModel):
    totalCustomers: int
    activeBuyers: int
    completedAuctionsThisMonth: int
    averageBlendMargin: float
    inventoryStockKg: float
    pendingOrders: int

class RevenueByMonthItem(BaseModel):
    month: str
    revenue: float
    purchases: float

class TeaGradeDistributionItem(BaseModel):
    name: str
    value: float
    color: str

class TopBlendItem(BaseModel):
    name: str
    sales: float
    profit: float

class AnalyticsOverviewResponse(BaseModel):
    generatedAt: datetime
    refreshIntervalMs: int
    kpis: dict[str, KPIItem]
    revenueByMonth: list[RevenueByMonthItem]
    teaGradeDistribution: list[TeaGradeDistributionItem]
    topBlends: list[TopBlendItem]
    quickStats: QuickStats