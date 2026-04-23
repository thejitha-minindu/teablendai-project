import asyncio
import logging

from src.config import get_settings
from src.infrastructure.database.connection import SessionLocal
from src.infrastructure.repositories.dashboard.analytics_overview_repository import AnalyticsOverviewRepository

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
                repo = AnalyticsOverviewRepository(db)
                repo.create_snapshot(
                    lookback_days=settings.ANALYTICS_KPI_LOOKBACK_DAYS,
                    chart_months=settings.ANALYTICS_CHART_MONTHS,
                    refresh_interval_ms=interval * 1000,
                )
                repo.prune_old_snapshots(settings.ANALYTICS_SNAPSHOT_RETENTION_DAYS)
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
