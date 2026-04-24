import asyncio
import logging

from src.config import get_settings
from src.infrastructure.database.connection import SessionLocal
from src.infrastructure.repositories.dashboard.analytics_overview_repository import AnalyticsOverviewRepository
from src.infrastructure.repositories.dashboard.analytics_purchases_repository import AnalyticsPurchasesRepository
from src.infrastructure.repositories.dashboard.analytics_sales_repository import AnalyticsSalesRepository
from src.infrastructure.repositories.dashboard.analytics_blends_repository import AnalyticsBlendsRepository

logger = logging.getLogger(__name__)


class AnalyticsSnapshotScheduler:
    def __init__(self) -> None:
        self._stop_event = asyncio.Event()

    async def start(self) -> None:
        settings = get_settings()
        interval = max(settings.ANALYTICS_SNAPSHOT_INTERVAL_SECONDS, 10)

        while not self._stop_event.is_set():
            db = SessionLocal()
            try:
                overview_repo = AnalyticsOverviewRepository(db)
                overview_repo.create_snapshot(
                    lookback_days=settings.ANALYTICS_KPI_LOOKBACK_DAYS,
                    chart_months=settings.ANALYTICS_CHART_MONTHS,
                    refresh_interval_ms=interval * 1000,
                )
                overview_repo.prune_old_snapshots(settings.ANALYTICS_SNAPSHOT_RETENTION_DAYS)

                purchases_repo = AnalyticsPurchasesRepository(db)
                purchases_repo.create_snapshot(
                    chart_months=settings.ANALYTICS_CHART_MONTHS,
                    refresh_interval_ms=interval * 1000,
                )
                purchases_repo.prune_old_snapshots(settings.ANALYTICS_SNAPSHOT_RETENTION_DAYS)

                sales_repo = AnalyticsSalesRepository(db)
                sales_repo.create_snapshot(
                    chart_months=settings.ANALYTICS_CHART_MONTHS,
                    refresh_interval_ms=interval * 1000,
                )
                sales_repo.prune_old_snapshots(settings.ANALYTICS_SNAPSHOT_RETENTION_DAYS)

                blends_repo = AnalyticsBlendsRepository(db)
                blends_repo.create_snapshot(
                    chart_months=settings.ANALYTICS_CHART_MONTHS,
                    refresh_interval_ms=interval * 1000,
                )
                blends_repo.prune_old_snapshots(settings.ANALYTICS_SNAPSHOT_RETENTION_DAYS)
            except Exception:
                logger.exception("Analytics snapshot refresh failed")
                db.rollback()
            finally:
                db.close()

            try:
                await asyncio.wait_for(self._stop_event.wait(), timeout=interval)
            except asyncio.TimeoutError:
                continue

    def stop(self) -> None:
        self._stop_event.set()


analytics_snapshot_scheduler = AnalyticsSnapshotScheduler()
