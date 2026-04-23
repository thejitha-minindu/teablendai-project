from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.config import get_settings
from src.infrastructure.database.connection import get_db
from src.infrastructure.repositories.admin.admin_repository import AdminRepository
from src.application.use_cases.admin.get_dashboard_stats import GetDashboardStatsUseCase
from src.infrastructure.repositories.admin.analytics_overview_repository import AnalyticsOverviewRepository
from src.application.schemas.admin.analytics_overview import AnalyticsOverviewResponse

router = APIRouter(prefix="", tags=["Admin Dashboard"])


@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    repo = AdminRepository(db)
    usecase = GetDashboardStatsUseCase(repo)
    return usecase.execute()


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
