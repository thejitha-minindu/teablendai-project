import logging
from datetime import datetime, date
from typing import Dict, List, Any, Optional, Tuple
import uuid

logger = logging.getLogger(__name__)


class StarSchemaTransformer:
    """
    Transforms raw operational records into Kimball Star Schema dimensional records:
    - Normalizes data types, handles NULLs safely
    - Maps surrogate foreign keys (Date, Tea Grade, User, Blend)
    - Computes analytical metrics (profit margins, duration, total revenue)
    """

    def __init__(self, duckdb_conn):
        self.conn = duckdb_conn
        self._load_dimension_lookups()

    def _load_dimension_lookups(self):
        """Pre-load existing surrogate key maps into memory for ultra-fast vector mapping."""
        # Grade Lookup (grade_name -> grade_key)
        grade_rows = self.conn.execute("SELECT grade_key, grade_name FROM dim_tea_grade").fetchall()
        self.grade_map = {row[1].upper().strip(): row[0] for row in grade_rows}

        # User Lookup (user_id -> user_key)
        user_rows = self.conn.execute("SELECT user_key, user_id FROM dim_user").fetchall()
        self.user_map = {str(row[1]).lower(): row[0] for row in user_rows}

        # Blend Lookup (blend_name -> blend_key)
        blend_rows = self.conn.execute("SELECT blend_key, blend_name FROM dim_tea_blend").fetchall()
        self.blend_map = {row[1].upper().strip(): row[0] for row in blend_rows}

    @staticmethod
    def _to_date_key(dt_val: Any) -> int:
        """Convert a datetime/date/string to an integer date_key (YYYYMMDD)."""
        if dt_val is None:
            return 20260101
        if isinstance(dt_val, str):
            try:
                dt_val = datetime.fromisoformat(dt_val.replace("Z", "+00:00"))
            except Exception:
                try:
                    dt_val = datetime.strptime(dt_val[:10], "%Y-%m-%d")
                except Exception:
                    return 20260101
        if isinstance(dt_val, (datetime, date)):
            return int(dt_val.strftime("%Y%m%d"))
        return 20260101

    @staticmethod
    def _num(val: Any, default: float = 0.0) -> float:
        """Safe numeric conversion."""
        try:
            if val is None:
                return default
            return float(val)
        except Exception:
            return default

    def transform_users(self, raw_users: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform raw users into dim_user records and update user_map."""
        transformed = []
        next_key = (max(self.user_map.values()) + 1) if self.user_map else 1

        for u in raw_users:
            raw_id = str(u.get("user_id", "")).lower()
            if not raw_id:
                continue

            if raw_id not in self.user_map:
                user_key = next_key
                self.user_map[raw_id] = user_key
                next_key += 1
            else:
                user_key = self.user_map[raw_id]

            first_name = (u.get("first_name") or "").strip()
            last_name = (u.get("last_name") or "").strip()
            full_name = f"{first_name} {last_name}".strip() or "Standard User"

            transformed.append({
                "user_key": user_key,
                "user_id": raw_id,
                "user_role": (u.get("user_role") or "buyer").lower(),
                "company_name": full_name,
                "estate_name": full_name,
                "region": "Sri Lanka",
                "created_at": u.get("created_at") or datetime.utcnow(),
            })

        return transformed

    def transform_tea_grades(self, raw_auctions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Discover new tea grades and transform to dim_tea_grade records."""
        transformed = []
        next_key = (max(self.grade_map.values()) + 1) if self.grade_map else 1

        for a in raw_auctions:
            grade_raw = (a.get("grade") or "UNSPECIFIED").upper().strip()
            if grade_raw not in self.grade_map:
                grade_key = next_key
                self.grade_map[grade_raw] = grade_key
                next_key += 1

                elevation = "High Grown" if any(k in grade_raw for k in ["BOP", "BOPF"]) else "Low Grown"
                transformed.append({
                    "grade_key": grade_key,
                    "grade_name": grade_raw,
                    "elevation_category": elevation,
                    "particle_size": "Broken",
                    "standard_code": f"LK-{grade_raw[:6]}",
                })

        return transformed

    def transform_tea_blends(self, raw_sales: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform unique blend names into dim_tea_blend."""
        transformed = []
        next_key = (max(self.blend_map.values()) + 1) if self.blend_map else 1

        for s in raw_sales:
            blend_raw = (s.get("blend_name") or "Standard Blend").upper().strip()
            if blend_raw not in self.blend_map:
                blend_key = next_key
                self.blend_map[blend_raw] = blend_key
                next_key += 1

                transformed.append({
                    "blend_key": blend_key,
                    "blend_name": blend_raw,
                    "target_market": "Export Quality / Local Premium",
                    "description": f"Master formulation for {blend_raw}",
                })

        return transformed

    def transform_auctions(
        self, raw_auctions: List[Dict[str, Any]], raw_bids: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Transform raw auctions into fact_auction_transactions rows:
        - Maps surrogate keys
        - Calculates total bids, highest bid, duration, profit margin
        """
        # Pre-compute bids per auction
        bids_by_auction: Dict[str, List[float]] = {}
        for b in raw_bids:
            auc_id = str(b.get("auction_id", "")).lower()
            amt = self._num(b.get("bid_amount"))
            if auc_id:
                bids_by_auction.setdefault(auc_id, []).append(amt)

        transformed = []
        for a in raw_auctions:
            auc_id_str = str(a.get("auction_id", "")).lower()
            if not auc_id_str:
                continue

            grade_name = (a.get("grade") or "UNSPECIFIED").upper().strip()
            grade_key = self.grade_map.get(grade_name, 99)

            seller_id = str(a.get("seller_id", "")).lower()
            seller_key = self.user_map.get(seller_id, 0)
            if seller_key == 0:
                seller_key = 1  # Default fallback user

            buyer_id = str(a.get("buyer", "")).lower() if a.get("buyer") else None
            buyer_key = self.user_map.get(buyer_id) if buyer_id else None

            start_time = a.get("start_time") or datetime.utcnow()
            date_key = self._to_date_key(start_time)

            quantity_kg = self._num(a.get("quantity"), 0.0)
            base_price = self._num(a.get("base_price"), 0.0)
            sold_price = self._num(a.get("sold_price"), 0.0)
            status = str(a.get("status") or "Scheduled").capitalize()

            # Revenue & Profit margin computation
            total_revenue = sold_price if status == "History" and buyer_key else 0.0
            profit_margin = 0.0
            if sold_price > 0 and base_price > 0:
                profit_margin = round(((sold_price - base_price) / base_price) * 100.0, 2)

            duration_mins = self._num(a.get("duration"), 0.0)

            # Bid stats
            auc_bids = bids_by_auction.get(auc_id_str, [])
            total_bids_count = len(auc_bids)
            highest_bid = max(auc_bids) if auc_bids else (sold_price if sold_price > 0 else base_price)

            transformed.append({
                "transaction_id": str(uuid.uuid4()),
                "auction_id": auc_id_str,
                "custom_auction_id": a.get("custom_auction_id") or f"AUC-{auc_id_str[:8]}",
                "auction_name": a.get("auction_name") or f"Tea Auction Lot",
                "date_key": date_key,
                "grade_key": grade_key,
                "seller_key": seller_key,
                "buyer_key": buyer_key,
                "status": status,
                "origin": a.get("origin") or "Sri Lanka",
                "quantity_kg": quantity_kg,
                "base_price_lkr": base_price,
                "sold_price_lkr": sold_price,
                "total_revenue_lkr": total_revenue,
                "profit_margin_pct": profit_margin,
                "duration_minutes": duration_mins,
                "total_bids_count": total_bids_count,
                "highest_bid_lkr": highest_bid,
                "start_time": start_time,
                "created_at": a.get("created_at") or start_time,
            })

        return transformed

    def transform_bids(self, raw_bids: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform raw bids into fact_bids."""
        transformed = []
        for b in raw_bids:
            bid_id = str(b.get("bid_id", "")).lower() or str(uuid.uuid4())
            auc_id = str(b.get("auction_id", "")).lower()
            buyer_id = str(b.get("buyer_id", "")).lower()
            bid_time = b.get("bid_time") or datetime.utcnow()
            date_key = self._to_date_key(bid_time)

            transformed.append({
                "bid_id": bid_id,
                "auction_id": auc_id,
                "buyer_id": buyer_id,
                "date_key": date_key,
                "bid_amount_lkr": self._num(b.get("bid_amount"), 0.0),
                "bid_time": bid_time,
                "bid_sequence": 1,
            })
        return transformed

    def transform_blend_sales(self, raw_sales: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform raw blend sales into fact_blend_sales."""
        transformed = []
        for s in raw_sales:
            sale_id = str(s.get("id") or uuid.uuid4())
            customer_id = int(s.get("customer_id") or 1)
            blend_name = (s.get("blend_name") or "Standard Blend").upper().strip()
            blend_key = self.blend_map.get(blend_name, 1)

            sale_date = s.get("sale_date") or date.today()
            date_key = self._to_date_key(sale_date)

            qty = self._num(s.get("quantity_kg"), 0.0)
            price_per_kg = self._num(s.get("price_per_kg"), 0.0)
            total_rev = round(qty * price_per_kg, 2)

            transformed.append({
                "sale_id": sale_id,
                "customer_id": customer_id,
                "blend_key": blend_key,
                "date_key": date_key,
                "quantity_kg": qty,
                "price_per_kg_lkr": price_per_kg,
                "total_revenue_lkr": total_rev,
                "sale_date": sale_date,
            })
        return transformed

    def transform_tea_purchases(self, raw_purchases: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Transform raw tea purchases into fact_tea_purchases."""
        transformed = []
        for p in raw_purchases:
            purchase_id = str(p.get("id") or uuid.uuid4())
            source_type = str(p.get("source_type") or "Direct Estate")
            standard = (p.get("standard") or "BOP").upper().strip()
            grade_key = self.grade_map.get(standard, 99)

            purch_date = p.get("purchase_date") or date.today()
            date_key = self._to_date_key(purch_date)

            qty = self._num(p.get("quantity_kg"), 0.0)
            price_per_kg = self._num(p.get("price_per_kg"), 0.0)
            total_cost = round(qty * price_per_kg, 2)

            transformed.append({
                "purchase_id": purchase_id,
                "source_type": source_type,
                "grade_key": grade_key,
                "date_key": date_key,
                "quantity_kg": qty,
                "price_per_kg_lkr": price_per_kg,
                "total_cost_lkr": total_cost,
                "purchase_date": purch_date,
            })
        return transformed
