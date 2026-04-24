from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.config import get_settings
from src.infrastructure.database.connection import get_db
from src.infrastructure.repositories.dashboard.analytics_overview_repository import AnalyticsOverviewRepository
from src.application.schemas.dashboard.analytics_overview import AnalyticsOverviewResponse
from src.infrastructure.repositories.dashboard.analytics_purchases_repository import AnalyticsPurchasesRepository
from src.application.schemas.dashboard.analytics_purchases import AnalyticsPurchasesResponse
from src.infrastructure.repositories.dashboard.analytics_sales_repository import AnalyticsSalesRepository
from src.application.schemas.dashboard.analytics_sales import AnalyticsSalesResponse
from src.infrastructure.repositories.dashboard.analytics_blends_repository import AnalyticsBlendsRepository
from src.application.schemas.dashboard.analytics_blends import AnalyticsBlendsResponse

router = APIRouter(prefix="", tags=["Analytics Dashboard"])

@router.get("/analytics/overview", response_model=AnalyticsOverviewResponse)
def get_analytics_overview(
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    refresh_interval_ms = settings.ANALYTICS_SNAPSHOT_INTERVAL_SECONDS * 1000
    repo = AnalyticsOverviewRepository(db)

    if force_refresh:
        return repo.create_snapshot(
            lookback_days=settings.ANALYTICS_KPI_LOOKBACK_DAYS,
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    snapshot = repo.get_latest_snapshot(refresh_interval_ms=refresh_interval_ms)
    if snapshot is None:
        return repo.create_snapshot(
            lookback_days=settings.ANALYTICS_KPI_LOOKBACK_DAYS,
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )
    return snapshot

@router.get("/analytics/purchases", response_model=AnalyticsPurchasesResponse)
def get_analytics_purchases(
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    refresh_interval_ms = settings.ANALYTICS_SNAPSHOT_INTERVAL_SECONDS * 1000
    repo = AnalyticsPurchasesRepository(db)

    if force_refresh:
        return repo.create_snapshot(
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    snapshot = repo.get_latest_snapshot(refresh_interval_ms=refresh_interval_ms)
    if snapshot is None:
        return repo.create_snapshot(
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    return snapshot

@router.get("/analytics/sales", response_model=AnalyticsSalesResponse)
def get_analytics_sales(
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    refresh_interval_ms = settings.ANALYTICS_SNAPSHOT_INTERVAL_SECONDS * 1000
    repo = AnalyticsSalesRepository(db)

    if force_refresh:
        return repo.create_snapshot(
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    snapshot = repo.get_latest_snapshot(refresh_interval_ms=refresh_interval_ms)
    if snapshot is None:
        return repo.create_snapshot(
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    return snapshot


@router.get("/analytics/blends", response_model=AnalyticsBlendsResponse)
def get_analytics_blends(
    force_refresh: bool = Query(False),
    db: Session = Depends(get_db),
):
    settings = get_settings()
    refresh_interval_ms = settings.ANALYTICS_SNAPSHOT_INTERVAL_SECONDS * 1000
    repo = AnalyticsBlendsRepository(db)

    if force_refresh:
        return repo.create_snapshot(
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    snapshot = repo.get_latest_snapshot(refresh_interval_ms=refresh_interval_ms)
    if snapshot is None:
        return repo.create_snapshot(
            chart_months=settings.ANALYTICS_CHART_MONTHS,
            refresh_interval_ms=refresh_interval_ms,
        )

    return snapshot