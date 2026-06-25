from sqlalchemy.orm import Session
from sqlalchemy import func
from src.infrastructure.database.models.auction_orm import AuctionORM
from sqlalchemy import text


class AdminRepository:

    def __init__(self, db: Session):
        self.db = db

    def get_total_auctions(self):
        try:
            result = self.db.query(func.count(AuctionORM.auction_id)).scalar()
            return int(result or 0)
        except Exception:
            return 0

    def get_total_sellers(self):
        try:
            sql = text(
                """
                SELECT COUNT(*) as cnt
                FROM users
                WHERE LOWER(verification_status) = 'approved'
                  AND (
                    LOWER(default_role) = 'seller'
                    OR LOWER(ISNULL(seller_verification_status, '')) = 'approved'
                  )
                """
            )
            res = self.db.execute(sql).scalar()
            return int(res or 0)
        except Exception:
            return 0

    def get_total_buyers(self):
        try:
            sql = text("SELECT COUNT(*) as cnt FROM users WHERE LOWER(default_role) = 'buyer' AND LOWER(verification_status) = 'approved'")
            res = self.db.execute(sql).scalar()
            return int(res or 0)
        except Exception:
            return 0

    def get_pending_sellers(self):
        try:
            sql = text(
                """
                SELECT COUNT(*) as cnt
                FROM users
                WHERE LOWER(ISNULL(seller_verification_status, '')) = 'pending'
                   OR (
                     LOWER(default_role) = 'seller'
                     AND LOWER(verification_status) = 'pending'
                   )
                """
            )
            res = self.db.execute(sql).scalar()
            return int(res or 0)
        except Exception:
            return 0

    def get_pending_buyers(self):
        try:
            sql = text("SELECT COUNT(*) as cnt FROM users WHERE LOWER(default_role) = 'buyer' AND LOWER(verification_status) = 'pending'")
            res = self.db.execute(sql).scalar()
            return int(res or 0)
        except Exception:
            return 0
        
    def get_total_violations(self):
        try:
            sql = text("SELECT COUNT(*) FROM violations")
            result = self.db.execute(sql).scalar()
            return int(result or 0)
        except Exception:
            return 0

    def get_weekly_system_activity(self):
        try:
            dialect_name = self.db.bind.dialect.name
            if dialect_name == "sqlite":
                sql = text(
                    """
                    SELECT date(created_at, 'weekday 0', '-6 days') as week_start, COUNT(*) as cnt
                    FROM system_logs
                    GROUP BY week_start
                    ORDER BY week_start ASC
                    """
                )
            else:
                sql = text(
                    """
                    SELECT CONVERT(VARCHAR(10), DATEADD(wk, DATEDIFF(wk, 0, created_at), 0), 120) as week_start, COUNT(*) as cnt
                    FROM system_logs
                    GROUP BY CONVERT(VARCHAR(10), DATEADD(wk, DATEDIFF(wk, 0, created_at), 0), 120)
                    ORDER BY week_start ASC
                    """
                )
            res = self.db.execute(sql).fetchall()
            return [{"week": row[0], "count": int(row[1] or 0)} for row in res]
        except Exception:
            return []
