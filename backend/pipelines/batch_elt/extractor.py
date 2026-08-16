import logging
from datetime import datetime, date, timedelta
from typing import Dict, List, Any, Optional
import pandas as pd
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


class MSSQLExtractor:
    """
    Extracts transactional data from the operational MSSQL database.
    Supports incremental (watermark-based) and full extraction.
    """

    def __init__(self, db_session: Optional[Session] = None):
        self.db = db_session

    def extract_users(self, watermark: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Extract user master data (sellers, buyers, admins)."""
        if not self.db:
            return []
        
        query = """
            SELECT 
                user_id,
                email,
                default_role AS user_role,
                first_name,
                last_name,
                created_at
            FROM users
        """
        params = {}
        if watermark:
            query += " WHERE created_at >= :watermark"
            params["watermark"] = watermark

        try:
            result = self.db.execute(text(query), params).mappings().all()
            return [dict(row) for row in result]
        except Exception as e:
            logger.warning(f"Error extracting users from MSSQL: {e}")
            return []

    def extract_auctions(self, watermark: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Extract auction transaction lots and outcomes."""
        if not self.db:
            return []

        query = """
            SELECT 
                auction_id,
                custom_auction_id,
                auction_name,
                seller_id,
                seller_brand,
                grade,
                company_name,
                estate_name,
                quantity,
                origin,
                base_price,
                start_time,
                duration,
                status,
                buyer,
                sold_price,
                created_at
            FROM auctions
        """
        params = {}
        if watermark:
            query += " WHERE created_at >= :watermark OR start_time >= :watermark"
            params["watermark"] = watermark

        try:
            result = self.db.execute(text(query), params).mappings().all()
            return [dict(row) for row in result]
        except Exception as e:
            logger.warning(f"Error extracting auctions from MSSQL: {e}")
            return []

    def extract_bids(self, watermark: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Extract all auction bid events."""
        if not self.db:
            return []

        query = """
            SELECT 
                bid_id,
                auction_id,
                buyer_id,
                bid_amount,
                bid_time
            FROM bids
        """
        params = {}
        if watermark:
            query += " WHERE bid_time >= :watermark"
            params["watermark"] = watermark

        try:
            result = self.db.execute(text(query), params).mappings().all()
            return [dict(row) for row in result]
        except Exception as e:
            logger.warning(f"Error extracting bids from MSSQL: {e}")
            return []

    def extract_tea_purchases(self, watermark: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Extract raw inventory purchases."""
        if not self.db:
            return []

        query = """
            SELECT 
                id,
                source_type,
                standard,
                price_per_kg,
                quantity_kg,
                purchase_date
            FROM tea_purchases
        """
        params = {}
        if watermark:
            query += " WHERE purchase_date >= :watermark"
            params["watermark"] = watermark.date() if isinstance(watermark, datetime) else watermark

        try:
            result = self.db.execute(text(query), params).mappings().all()
            return [dict(row) for row in result]
        except Exception as e:
            logger.warning(f"Error extracting tea_purchases from MSSQL: {e}")
            return []

    def extract_tea_blend_sales(self, watermark: Optional[datetime] = None) -> List[Dict[str, Any]]:
        """Extract tea blend sales records."""
        if not self.db:
            return []

        query = """
            SELECT 
                id,
                customer_id,
                blend_name,
                price_per_kg,
                quantity_kg,
                sale_date
            FROM tea_blend_sales
        """
        params = {}
        if watermark:
            query += " WHERE sale_date >= :watermark"
            params["watermark"] = watermark.date() if isinstance(watermark, datetime) else watermark

        try:
            result = self.db.execute(text(query), params).mappings().all()
            return [dict(row) for row in result]
        except Exception as e:
            logger.warning(f"Error extracting tea_blend_sales from MSSQL: {e}")
            return []

    def extract_all(self, watermark: Optional[datetime] = None) -> Dict[str, List[Dict[str, Any]]]:
        """Extract complete dataset across all operational tables."""
        return {
            "users": self.extract_users(watermark),
            "auctions": self.extract_auctions(watermark),
            "bids": self.extract_bids(watermark),
            "tea_purchases": self.extract_tea_purchases(watermark),
            "tea_blend_sales": self.extract_tea_blend_sales(watermark),
        }
