import logging
from typing import Dict, List, Any, Tuple

logger = logging.getLogger(__name__)


class DataQualityValidator:
    """
    Enforces Data Quality rules, business constraints, and referential integrity
    on transformed dimensional data before persisting into DuckDB OLAP.
    """

    def __init__(self, duckdb_conn):
        self.conn = duckdb_conn

    def validate_auctions(self, fact_auctions: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Validate fact_auction_transactions for constraint compliance."""
        valid_records = []
        violations = []

        for record in fact_auctions:
            tx_id = record.get("transaction_id")
            reasons = []

            # Non-negative prices
            if record.get("base_price_lkr", 0) < 0:
                reasons.append("Negative base price")
            if record.get("sold_price_lkr", 0) < 0:
                reasons.append("Negative sold price")

            # Positive quantity
            if record.get("quantity_kg", 0) <= 0:
                reasons.append("Zero or negative quantity_kg")

            # Valid date_key
            date_key = record.get("date_key", 0)
            if date_key < 20200101 or date_key > 20351231:
                reasons.append(f"Invalid date_key: {date_key}")

            if reasons:
                violations.append({
                    "transaction_id": tx_id,
                    "reasons": reasons,
                    "record": record
                })
            else:
                valid_records.append(record)

        stats = {
            "dataset": "fact_auction_transactions",
            "total_checked": len(fact_auctions),
            "passed": len(valid_records),
            "failed": len(violations),
            "violations": violations[:10]  # sample
        }
        return valid_records, stats

    def validate_blend_sales(self, fact_sales: List[Dict[str, Any]]) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Validate fact_blend_sales."""
        valid_records = []
        violations = []

        for record in fact_sales:
            reasons = []
            if record.get("quantity_kg", 0) <= 0:
                reasons.append("Zero or negative blend sale quantity")
            if record.get("price_per_kg_lkr", 0) <= 0:
                reasons.append("Zero or negative price_per_kg")

            if reasons:
                violations.append({
                    "sale_id": record.get("sale_id"),
                    "reasons": reasons
                })
            else:
                valid_records.append(record)

        stats = {
            "dataset": "fact_blend_sales",
            "total_checked": len(fact_sales),
            "passed": len(valid_records),
            "failed": len(violations),
            "violations": violations[:10]
        }
        return valid_records, stats

    def validate_referential_integrity(self) -> Dict[str, Any]:
        """Verify foreign key integrity inside DuckDB."""
        results = {}
        
        # Check orphan date_keys in fact_auction_transactions
        orphan_dates = self.conn.execute("""
            SELECT COUNT(*) FROM fact_auction_transactions f
            LEFT JOIN dim_date d ON f.date_key = d.date_key
            WHERE d.date_key IS NULL
        """).fetchone()[0]
        results["orphan_dates_count"] = orphan_dates

        # Check orphan grade_keys
        orphan_grades = self.conn.execute("""
            SELECT COUNT(*) FROM fact_auction_transactions f
            LEFT JOIN dim_tea_grade g ON f.grade_key = g.grade_key
            WHERE g.grade_key IS NULL
        """).fetchone()[0]
        results["orphan_grades_count"] = orphan_grades

        results["is_valid"] = (orphan_dates == 0 and orphan_grades == 0)
        return results
