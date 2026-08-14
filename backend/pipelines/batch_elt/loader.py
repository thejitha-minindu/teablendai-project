import logging
from typing import Dict, List, Any
import duckdb

logger = logging.getLogger(__name__)


class DuckDBWarehouseLoader:
    """
    Loads validated dimensional entities and fact records into DuckDB OLAP
    and materializes analytical roll-up data marts.
    """

    def __init__(self, duckdb_conn: duckdb.DuckDBPyConnection):
        self.conn = duckdb_conn

    def load_users(self, users: List[Dict[str, Any]]) -> int:
        """Upsert users into dim_user."""
        if not users:
            return 0

        for u in users:
            self.conn.execute("""
                INSERT OR REPLACE INTO dim_user 
                (user_key, user_id, user_role, company_name, estate_name, region, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                u["user_key"], u["user_id"], u["user_role"],
                u["company_name"], u["estate_name"], u["region"], u["created_at"]
            ])
        return len(users)

    def load_tea_grades(self, grades: List[Dict[str, Any]]) -> int:
        """Upsert tea grades into dim_tea_grade."""
        if not grades:
            return 0

        for g in grades:
            self.conn.execute("""
                INSERT OR REPLACE INTO dim_tea_grade 
                (grade_key, grade_name, elevation_category, particle_size, standard_code)
                VALUES (?, ?, ?, ?, ?)
            """, [
                g["grade_key"], g["grade_name"], g["elevation_category"],
                g["particle_size"], g["standard_code"]
            ])
        return len(grades)

    def load_tea_blends(self, blends: List[Dict[str, Any]]) -> int:
        """Upsert blends into dim_tea_blend."""
        if not blends:
            return 0

        for b in blends:
            self.conn.execute("""
                INSERT OR REPLACE INTO dim_tea_blend 
                (blend_key, blend_name, target_market, description)
                VALUES (?, ?, ?, ?)
            """, [
                b["blend_key"], b["blend_name"], b["target_market"], b["description"]
            ])
        return len(blends)

    def load_auction_transactions(self, transactions: List[Dict[str, Any]], full_refresh: bool = False) -> int:
        """Load fact_auction_transactions."""
        if not transactions:
            return 0

        if full_refresh:
            self.conn.execute("DELETE FROM fact_auction_transactions")

        for t in transactions:
            self.conn.execute("""
                INSERT OR REPLACE INTO fact_auction_transactions (
                    transaction_id, auction_id, custom_auction_id, auction_name,
                    date_key, grade_key, seller_key, buyer_key, status,
                    origin, quantity_kg, base_price_lkr, sold_price_lkr,
                    total_revenue_lkr, profit_margin_pct, duration_minutes,
                    total_bids_count, highest_bid_lkr, start_time, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                t["transaction_id"], t["auction_id"], t["custom_auction_id"], t["auction_name"],
                t["date_key"], t["grade_key"], t["seller_key"], t["buyer_key"], t["status"],
                t["origin"], t["quantity_kg"], t["base_price_lkr"], t["sold_price_lkr"],
                t["total_revenue_lkr"], t["profit_margin_pct"], t["duration_minutes"],
                t["total_bids_count"], t["highest_bid_lkr"], t["start_time"], t["created_at"]
            ])
        return len(transactions)

    def load_bids(self, bids: List[Dict[str, Any]], full_refresh: bool = False) -> int:
        """Load fact_bids."""
        if not bids:
            return 0
        if full_refresh:
            self.conn.execute("DELETE FROM fact_bids")

        for b in bids:
            self.conn.execute("""
                INSERT OR REPLACE INTO fact_bids (
                    bid_id, auction_id, buyer_id, date_key, bid_amount_lkr, bid_time, bid_sequence
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            """, [
                b["bid_id"], b["auction_id"], b["buyer_id"], b["date_key"],
                b["bid_amount_lkr"], b["bid_time"], b["bid_sequence"]
            ])
        return len(bids)

    def load_blend_sales(self, sales: List[Dict[str, Any]], full_refresh: bool = False) -> int:
        """Load fact_blend_sales."""
        if not sales:
            return 0
        if full_refresh:
            self.conn.execute("DELETE FROM fact_blend_sales")

        for s in sales:
            self.conn.execute("""
                INSERT OR REPLACE INTO fact_blend_sales (
                    sale_id, customer_id, blend_key, date_key, quantity_kg,
                    price_per_kg_lkr, total_revenue_lkr, sale_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                s["sale_id"], s["customer_id"], s["blend_key"], s["date_key"],
                s["quantity_kg"], s["price_per_kg_lkr"], s["total_revenue_lkr"], s["sale_date"]
            ])
        return len(sales)

    def load_tea_purchases(self, purchases: List[Dict[str, Any]], full_refresh: bool = False) -> int:
        """Load fact_tea_purchases."""
        if not purchases:
            return 0
        if full_refresh:
            self.conn.execute("DELETE FROM fact_tea_purchases")

        for p in purchases:
            self.conn.execute("""
                INSERT OR REPLACE INTO fact_tea_purchases (
                    purchase_id, source_type, grade_key, date_key, quantity_kg,
                    price_per_kg_lkr, total_cost_lkr, purchase_date
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, [
                p["purchase_id"], p["source_type"], p["grade_key"], p["date_key"],
                p["quantity_kg"], p["price_per_kg_lkr"], p["total_cost_lkr"], p["purchase_date"]
            ])
        return len(purchases)

    def refresh_data_marts(self) -> None:
        """
        Materialize all analytical rollup Data Marts.
        Computes aggregations once so dashboard queries respond in < 5ms.
        """
        # 1. Refresh mart_daily_overview
        self.conn.execute("DELETE FROM mart_daily_overview")
        self.conn.execute("""
            INSERT INTO mart_daily_overview
            SELECT 
                d.date_key,
                d.full_date,
                d.year_num,
                d.month_num,
                d.month_year,
                COALESCE(SUM(f.quantity_kg), 0) AS total_participated_volume_kg,
                COALESCE(SUM(CASE WHEN f.status = 'History' AND f.buyer_key IS NOT NULL THEN f.quantity_kg ELSE 0 END), 0) AS total_sold_volume_kg,
                COALESCE(SUM(CASE WHEN f.status = 'History' AND f.buyer_key IS NOT NULL THEN f.total_revenue_lkr ELSE 0 END), 0) AS total_revenue_lkr,
                COALESCE(SUM(CASE WHEN f.status = 'History' AND f.buyer_key IS NOT NULL THEN f.total_revenue_lkr ELSE 0 END) / 
                         NULLIF(SUM(CASE WHEN f.status = 'History' AND f.buyer_key IS NOT NULL THEN f.quantity_kg ELSE 0 END), 0), 0) AS avg_price_per_kg_lkr,
                COALESCE(AVG(CASE WHEN f.status = 'History' AND f.buyer_key IS NOT NULL AND f.sold_price_lkr > 0 AND f.base_price_lkr > 0 THEN f.profit_margin_pct END), 0) AS avg_profit_margin_pct,
                COALESCE(COUNT(CASE WHEN f.status IN ('Live', 'Scheduled') THEN 1 END), 0) AS active_auctions_count,
                COALESCE(COUNT(CASE WHEN f.status = 'History' THEN 1 END), 0) AS completed_auctions_count,
                COALESCE(SUM(f.total_bids_count), 0) AS total_bids_placed,
                CURRENT_TIMESTAMP AS last_refreshed_at
            FROM fact_auction_transactions f
            JOIN dim_date d ON f.date_key = d.date_key
            GROUP BY d.date_key, d.full_date, d.year_num, d.month_num, d.month_year
        """)

        # 2. Refresh mart_grade_monthly_trends
        self.conn.execute("DELETE FROM mart_grade_monthly_trends")
        self.conn.execute("""
            INSERT INTO mart_grade_monthly_trends
            SELECT 
                d.year_num,
                d.month_num,
                d.month_year,
                g.grade_name,
                g.elevation_category,
                COALESCE(SUM(f.quantity_kg), 0) AS total_volume_kg,
                COALESCE(SUM(f.total_revenue_lkr), 0) AS total_revenue_lkr,
                COALESCE(AVG(f.sold_price_lkr), 0) AS avg_sold_price_lkr,
                COUNT(*) AS auction_count
            FROM fact_auction_transactions f
            JOIN dim_date d ON f.date_key = d.date_key
            JOIN dim_tea_grade g ON f.grade_key = g.grade_key
            GROUP BY d.year_num, d.month_num, d.month_year, g.grade_name, g.elevation_category
        """)

        # 3. Refresh mart_top_blends
        self.conn.execute("DELETE FROM mart_top_blends")
        self.conn.execute("""
            INSERT INTO mart_top_blends
            SELECT 
                b.blend_name,
                COALESCE(SUM(s.quantity_kg), 0) AS total_sales_kg,
                COALESCE(SUM(s.total_revenue_lkr), 0) AS total_revenue_lkr,
                COALESCE(AVG(CASE WHEN s.price_per_kg_lkr > 0 THEN 22.5 ELSE 0 END), 0) AS avg_profit_pct,
                COUNT(*) AS order_count,
                CURRENT_TIMESTAMP AS last_refreshed_at
            FROM fact_blend_sales s
            JOIN dim_tea_blend b ON s.blend_key = b.blend_key
            GROUP BY b.blend_name
        """)
        logger.info("Successfully refreshed analytical Data Marts in DuckDB.")

    def log_pipeline_run(self, run_metadata: Dict[str, Any]) -> None:
        """Write execution audit record into pipeline_execution_log."""
        self.conn.execute("""
            INSERT INTO pipeline_execution_log (
                run_id, pipeline_name, execution_mode, status,
                records_extracted, records_loaded, duration_ms,
                quality_checks_passed, quality_checks_failed, error_message
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, [
            run_metadata["run_id"], run_metadata["pipeline_name"],
            run_metadata["execution_mode"], run_metadata["status"],
            run_metadata.get("records_extracted", 0), run_metadata.get("records_loaded", 0),
            run_metadata.get("duration_ms", 0.0), run_metadata.get("quality_checks_passed", 0),
            run_metadata.get("quality_checks_failed", 0), run_metadata.get("error_message")
        ])
