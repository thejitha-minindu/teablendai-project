from sqlalchemy.orm import Session
from sqlalchemy import func, desc, or_
from datetime import datetime
import logging

from src.domain.models.system_log import SystemLog
from src.domain.repositories.system_log_repository import SystemLogRepositoryInterface

logger = logging.getLogger(__name__)


class SystemLogRepository(SystemLogRepositoryInterface):

    def __init__(self, db: Session):
        self.db = db

    def _next_display_id(self) -> str:
        """Generate the next sequential display_id like ACT001, ACT002, etc."""
        try:
            last = (
                self.db.query(SystemLog.display_id)
                .order_by(desc(SystemLog.created_at))
                .first()
            )
            if last and last.display_id and last.display_id.startswith("ACT"):
                num = int(last.display_id[3:]) + 1
            else:
                num = 1
            return f"ACT{num:03d}"
        except Exception:
            # Fallback: count existing rows
            count = self.db.query(func.count(SystemLog.log_id)).scalar() or 0
            return f"ACT{count + 1:03d}"

    def create(self, log_data: dict):
        """Create a new system log entry."""
        try:
            display_id = self._next_display_id()
            log_entry = SystemLog(
                display_id=display_id,
                user_name=log_data.get("user_name", "System"),
                user_id=log_data.get("user_id"),
                activity_type=log_data.get("activity_type", "Unknown"),
                status=log_data.get("status", "success"),
                ip_address=log_data.get("ip_address"),
                details=log_data.get("details", ""),
            )
            self.db.add(log_entry)
            self.db.commit()
            self.db.refresh(log_entry)
            return log_entry
        except Exception as e:
            logger.error(f"Failed to create system log: {e}")
            self.db.rollback()
            raise

    def get_all(self, filters: dict = None, skip: int = 0, limit: int = 50):
        """List system logs with optional filters."""
        try:
            query = self.db.query(SystemLog)

            if filters:
                if filters.get("status"):
                    query = query.filter(SystemLog.status == filters["status"])
                if filters.get("activity_type"):
                    query = query.filter(SystemLog.activity_type == filters["activity_type"])
                if filters.get("date_from"):
                    try:
                        dt_from = datetime.strptime(filters["date_from"], "%Y-%m-%d")
                        query = query.filter(SystemLog.created_at >= dt_from)
                    except ValueError:
                        pass
                if filters.get("date_to"):
                    try:
                        dt_to = datetime.strptime(filters["date_to"], "%Y-%m-%d")
                        dt_to = dt_to.replace(hour=23, minute=59, second=59)
                        query = query.filter(SystemLog.created_at <= dt_to)
                    except ValueError:
                        pass
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(
                        or_(
                            SystemLog.user_name.ilike(search_term),
                            SystemLog.details.ilike(search_term),
                        )
                    )

            query = query.order_by(desc(SystemLog.created_at))
            return query.offset(skip).limit(limit).all()
        except Exception as e:
            logger.error(f"Failed to list system logs: {e}")
            return []

    def get_recent(self, limit: int = 20):
        """Get most recent system logs."""
        try:
            return (
                self.db.query(SystemLog)
                .order_by(desc(SystemLog.created_at))
                .limit(limit)
                .all()
            )
        except Exception as e:
            logger.error(f"Failed to fetch recent system logs: {e}")
            return []

    def count(self, filters: dict = None) -> int:
        """Count system logs matching filters."""
        try:
            query = self.db.query(func.count(SystemLog.log_id))

            if filters:
                if filters.get("status"):
                    query = query.filter(SystemLog.status == filters["status"])
                if filters.get("activity_type"):
                    query = query.filter(SystemLog.activity_type == filters["activity_type"])
                if filters.get("date_from"):
                    try:
                        dt_from = datetime.strptime(filters["date_from"], "%Y-%m-%d")
                        query = query.filter(SystemLog.created_at >= dt_from)
                    except ValueError:
                        pass
                if filters.get("date_to"):
                    try:
                        dt_to = datetime.strptime(filters["date_to"], "%Y-%m-%d")
                        dt_to = dt_to.replace(hour=23, minute=59, second=59)
                        query = query.filter(SystemLog.created_at <= dt_to)
                    except ValueError:
                        pass
                if filters.get("search"):
                    search_term = f"%{filters['search']}%"
                    query = query.filter(
                        or_(
                            SystemLog.user_name.ilike(search_term),
                            SystemLog.details.ilike(search_term),
                        )
                    )

            return query.scalar() or 0
        except Exception as e:
            logger.error(f"Failed to count system logs: {e}")
            return 0
