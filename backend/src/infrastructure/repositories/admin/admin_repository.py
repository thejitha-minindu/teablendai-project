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
