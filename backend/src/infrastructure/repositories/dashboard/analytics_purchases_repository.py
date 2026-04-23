import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


class AnalyticsPurchasesRepository:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _num(value: Any) -> float:
        return float(value or 0)

    def _summary(self) -> dict[str, float | int]:
        row = self.db.execute(
            text(
                """
                SELECT
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS total_purchased,
                    COALESCE(SUM(CAST(base_price AS FLOAT) * CAST(quantity AS FLOAT)), 0) AS total_cost,
                    COALESCE(COUNT(DISTINCT NULLIF(LTRIM(RTRIM(COALESCE(company_name, estate_name, ''))), '')), 0) AS unique_suppliers,
                    COALESCE(COUNT(*), 0) AS purchase_orders,
                    COALESCE(SUM(CASE WHEN status = 'Scheduled' THEN 1 ELSE 0 END), 0) AS pending_orders
                FROM auctions
                """
            )
        ).mappings().one()

        new_suppliers_row = self.db.execute(
            text(
                """
                WITH supplier_first_seen AS (
                    SELECT supplier_name, MIN(start_time) AS first_seen
                    FROM (
                        SELECT
                            NULLIF(LTRIM(RTRIM(COALESCE(company_name, estate_name, ''))), '') AS supplier_name,
                            start_time
                        FROM auctions
                    ) src
                    WHERE supplier_name IS NOT NULL
                    GROUP BY supplier_name
                )
                SELECT COUNT(*) AS new_suppliers_this_month
                FROM supplier_first_seen
                WHERE first_seen >= DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                """
            )
        ).mappings().one()

        total_purchased = self._num(row["total_purchased"])
        total_cost = self._num(row["total_cost"])
        average_price = (total_cost / total_purchased) if total_purchased > 0 else 0.0

        return {
            "totalPurchasedKg": round(total_purchased, 2),
            "totalCostLkr": round(total_cost, 2),
            "averagePriceLkrPerKg": round(average_price, 2),
            "uniqueSuppliers": int(self._num(row["unique_suppliers"])),
            "newSuppliersThisMonth": int(self._num(new_suppliers_row["new_suppliers_this_month"])),
            "purchaseOrders": int(self._num(row["purchase_orders"])),
            "pendingOrders": int(self._num(row["pending_orders"])),
        }

    def _purchase_volume_by_grade(self) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                SELECT
                    COALESCE(NULLIF(grade, ''), 'Unknown') AS grade,
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS quantity,
                    COALESCE(SUM(CAST(base_price AS FLOAT) * CAST(quantity AS FLOAT)), 0) AS cost
                FROM auctions
                GROUP BY COALESCE(NULLIF(grade, ''), 'Unknown')
                ORDER BY quantity DESC
                """
            )
        ).mappings().all()

        return [
            {
                "grade": str(r["grade"]),
                "quantity": round(self._num(r["quantity"]), 2),
                "cost": round(self._num(r["cost"]), 2),
            }
            for r in rows
        ]

    def _price_trends(
        self, months: int, ordered_grades: list[str]
    ) -> tuple[list[dict[str, dict[str, float] | str]], list[str]]:
        rows = self.db.execute(
            text(
                """
                SELECT
                    YEAR(start_time) AS year_num,
                    MONTH(start_time) AS month_num,
                    COALESCE(NULLIF(grade, ''), 'Unknown') AS grade,
                    COALESCE(AVG(CAST(base_price AS FLOAT)), 0) AS avg_price
                FROM auctions
                WHERE start_time >= DATEADD(
                    month,
                    -:months + 1,
                    DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                )
                GROUP BY
                    YEAR(start_time),
                    MONTH(start_time),
                    COALESCE(NULLIF(grade, ''), 'Unknown')
                ORDER BY year_num ASC, month_num ASC, grade ASC
                """
            ),
            {"months": max(months, 1)},
        ).mappings().all()

        grade_set = {str(row["grade"]) for row in rows}
        if ordered_grades:
            grade_order = [grade for grade in ordered_grades if grade in grade_set]
            grade_order.extend(sorted(grade for grade in grade_set if grade not in grade_order))
        else:
            grade_order = sorted(grade_set)

        points_by_month: dict[tuple[int, int], dict[str, Any]] = {}
        for row in rows:
            y = int(row["year_num"])
            m = int(row["month_num"])
            key = (y, m)
            if key not in points_by_month:
                month_label = datetime(y, m, 1).strftime("%b %y")
                points_by_month[key] = {
                    "month": month_label,
                    "prices": {grade: 0.0 for grade in grade_order},
                }
            grade_name = str(row["grade"])
            if grade_name in points_by_month[key]["prices"]:
                points_by_month[key]["prices"][grade_name] = round(self._num(row["avg_price"]), 2)
            else:
                points_by_month[key]["prices"][grade_name] = round(self._num(row["avg_price"]), 2)

        trend_points = [points_by_month[key] for key in sorted(points_by_month.keys())]
        return trend_points, grade_order

    def _source_distribution(self) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                SELECT
                    CASE
                        WHEN LOWER(COALESCE(origin, '')) LIKE '%broker%' THEN 'Brokers'
                        WHEN LOWER(COALESCE(origin, '')) LIKE '%factory%'
                          OR LOWER(COALESCE(origin, '')) LIKE '%estate%' THEN 'Factories'
                        ELSE 'Others'
                    END AS source,
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS quantity
                FROM auctions
                GROUP BY
                    CASE
                        WHEN LOWER(COALESCE(origin, '')) LIKE '%broker%' THEN 'Brokers'
                        WHEN LOWER(COALESCE(origin, '')) LIKE '%factory%'
                          OR LOWER(COALESCE(origin, '')) LIKE '%estate%' THEN 'Factories'
                        ELSE 'Others'
                    END
                ORDER BY quantity DESC
                """
            )
        ).mappings().all()

        total_qty = sum(self._num(r["quantity"]) for r in rows)
        if total_qty <= 0:
            return []

        return [
            {
                "source": str(r["source"]),
                "quantity": round(self._num(r["quantity"]), 2),
                "percentage": round((self._num(r["quantity"]) / total_qty) * 100.0, 2),
            }
            for r in rows
        ]

    def _supplier_contribution(self, limit: int = 5) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                SELECT TOP (:limit)
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(company_name)), ''),
                        NULLIF(LTRIM(RTRIM(estate_name)), ''),
                        'Unknown Supplier'
                    ) AS supplier,
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS quantity,
                    COALESCE(SUM(CAST(base_price AS FLOAT) * CAST(quantity AS FLOAT)), 0) AS cost
                FROM auctions
                GROUP BY
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(company_name)), ''),
                        NULLIF(LTRIM(RTRIM(estate_name)), ''),
                        'Unknown Supplier'
                    )
                ORDER BY quantity DESC
                """
            ),
            {"limit": max(limit, 1)},
        ).mappings().all()

        return [
            {
                "supplier": str(r["supplier"]),
                "quantity": round(self._num(r["quantity"]), 2),
                "cost": round(self._num(r["cost"]), 2),
            }
            for r in rows
        ]

    def create_snapshot(self, chart_months: int, refresh_interval_ms: int) -> dict:
        summary = self._summary()
        purchase_volume_by_grade = self._purchase_volume_by_grade()
        ordered_grades = [str(item["grade"]) for item in purchase_volume_by_grade]
        price_trends, price_trend_grades = self._price_trends(chart_months, ordered_grades)
        source_distribution = self._source_distribution()
        supplier_contribution = self._supplier_contribution()

        now_utc = datetime.now(timezone.utc)

        self.db.execute(
            text(
                """
                INSERT INTO analytics_purchases_snapshots (
                    snapshot_at,
                    summary_json,
                    purchase_volume_by_grade_json,
                    price_trends_json,
                    price_trend_grades_json,
                    source_distribution_json,
                    supplier_contribution_json
                )
                VALUES (
                    :snapshot_at,
                    :summary_json,
                    :purchase_volume_by_grade_json,
                    :price_trends_json,
                    :price_trend_grades_json,
                    :source_distribution_json,
                    :supplier_contribution_json
                )
                """
            ),
            {
                "snapshot_at": now_utc,
                "summary_json": json.dumps(summary),
                "purchase_volume_by_grade_json": json.dumps(purchase_volume_by_grade),
                "price_trends_json": json.dumps(price_trends),
                "price_trend_grades_json": json.dumps(price_trend_grades),
                "source_distribution_json": json.dumps(source_distribution),
                "supplier_contribution_json": json.dumps(supplier_contribution),
            },
        )
        self.db.commit()

        return self.get_latest_snapshot(refresh_interval_ms=refresh_interval_ms)

    def get_latest_snapshot(self, refresh_interval_ms: int) -> dict | None:
        row = self.db.execute(
            text(
                """
                SELECT TOP 1
                    snapshot_at,
                    summary_json,
                    purchase_volume_by_grade_json,
                    price_trends_json,
                    price_trend_grades_json,
                    source_distribution_json,
                    supplier_contribution_json
                FROM analytics_purchases_snapshots
                ORDER BY snapshot_at DESC, snapshot_id DESC
                """
            )
        ).mappings().first()

        if not row:
            return None

        generated_at = row["snapshot_at"]
        if generated_at.tzinfo is None:
            generated_at = generated_at.replace(tzinfo=timezone.utc)

        return {
            "generatedAt": generated_at,
            "refreshIntervalMs": refresh_interval_ms,
            "summary": json.loads(row["summary_json"]),
            "purchaseVolumeByGrade": json.loads(row["purchase_volume_by_grade_json"]),
            "priceTrends": json.loads(row["price_trends_json"]),
            "priceTrendGrades": json.loads(row["price_trend_grades_json"]),
            "sourceDistribution": json.loads(row["source_distribution_json"]),
            "supplierContribution": json.loads(row["supplier_contribution_json"]),
        }

    def prune_old_snapshots(self, retention_days: int) -> None:
        self.db.execute(
            text(
                """
                DELETE FROM analytics_purchases_snapshots
                WHERE snapshot_at < DATEADD(day, -:retention_days, SYSUTCDATETIME())
                """
            ),
            {"retention_days": retention_days},
        )
        self.db.commit()
