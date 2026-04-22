import json
from datetime import datetime, timedelta, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


class AnalyticsOverviewRepository:
    GRADE_COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"]

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _num(value: Any) -> float:
        return float(value or 0)

    @staticmethod
    def _trend(current: float, previous: float) -> tuple[float, str]:
        if abs(previous) < 1e-9:
            if abs(current) < 1e-9:
                return 0.0, "neutral"
            return 100.0, "up"
        pct = ((current - previous) / abs(previous)) * 100.0
        if abs(pct) < 0.01:
            return 0.0, "neutral"
        return round(pct, 2), ("up" if pct > 0 else "down")

    def _window_metrics(self, from_ts: datetime, to_ts: datetime) -> dict[str, float]:
        row = self.db.execute(
            text(
                """
                SELECT
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS total_purchased,
                    COALESCE(SUM(CASE WHEN status = 'History' AND buyer IS NOT NULL THEN CAST(quantity AS FLOAT) ELSE 0 END), 0) AS total_sold,
                    COALESCE(SUM(CASE WHEN status = 'History' AND buyer IS NOT NULL THEN CAST(sold_price AS FLOAT) * CAST(quantity AS FLOAT) ELSE 0 END), 0) AS total_revenue,
                    COALESCE(AVG(CASE WHEN status = 'History' AND buyer IS NOT NULL AND sold_price IS NOT NULL THEN CAST(sold_price AS FLOAT) END), 0) AS avg_auction_price,
                    COALESCE(AVG(
                        CASE
                            WHEN status = 'History' AND buyer IS NOT NULL AND sold_price > 0 AND base_price > 0
                            THEN ((CAST(sold_price AS FLOAT) - CAST(base_price AS FLOAT)) / CAST(base_price AS FLOAT)) * 100
                        END
                    ), 0) AS profit_margin
                FROM auctions
                WHERE start_time >= :from_ts AND start_time < :to_ts
                """
            ),
            {"from_ts": from_ts, "to_ts": to_ts},
        ).mappings().one()

        return {
            "totalPurchased": self._num(row["total_purchased"]),
            "totalSold": self._num(row["total_sold"]),
            "totalRevenue": self._num(row["total_revenue"]),
            "avgAuctionPrice": self._num(row["avg_auction_price"]),
            "profitMargin": self._num(row["profit_margin"]),
        }

    def _active_auctions_now(self) -> float:
        row = self.db.execute(
            text(
                """
                SELECT COUNT(*) AS active_count
                FROM auctions
                WHERE status IN ('Live', 'Scheduled')
                """
            )
        ).mappings().one()
        return self._num(row["active_count"])

    def _revenue_by_month(self, months: int) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                SELECT TOP (:months)
                    CONCAT(LEFT(DATENAME(month, DATEFROMPARTS(YEAR(start_time), MONTH(start_time), 1)), 3), ' ', RIGHT(CAST(YEAR(start_time) AS VARCHAR(4)), 2)) AS [month],
                    COALESCE(SUM(CASE WHEN status = 'History' AND buyer IS NOT NULL THEN CAST(sold_price AS FLOAT) * CAST(quantity AS FLOAT) ELSE 0 END), 0) AS revenue,
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS purchases,
                    YEAR(start_time) AS year_num,
                    MONTH(start_time) AS month_num
                FROM auctions
                GROUP BY YEAR(start_time), MONTH(start_time)
                ORDER BY year_num DESC, month_num DESC
                """
            ),
            {"months": months},
        ).mappings().all()

        out = [
            {
                "month": r["month"],
                "revenue": round(self._num(r["revenue"]), 2),
                "purchases": round(self._num(r["purchases"]), 2),
            }
            for r in rows
        ]
        out.reverse()
        return out

    def _tea_grade_distribution(self) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                WITH sold AS (
                    SELECT grade, CAST(quantity AS FLOAT) AS qty
                    FROM auctions
                    WHERE status = 'History' AND buyer IS NOT NULL
                )
                SELECT
                    grade AS [name],
                    CAST((SUM(qty) * 100.0) / NULLIF((SELECT SUM(qty) FROM sold), 0) AS FLOAT) AS [value]
                FROM sold
                GROUP BY grade
                ORDER BY SUM(qty) DESC
                """
            )
        ).mappings().all()

        out = []
        for i, r in enumerate(rows):
            out.append(
                {
                    "name": r["name"] or "Unknown",
                    "value": round(self._num(r["value"]), 2),
                    "color": self.GRADE_COLORS[i % len(self.GRADE_COLORS)],
                }
            )
        return out

    def _top_blends(self, limit: int = 5) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                SELECT TOP (:limit)
                    COALESCE(NULLIF(auction_name, ''), 'Unknown Blend') AS [name],
                    COALESCE(SUM(CASE WHEN status = 'History' AND buyer IS NOT NULL THEN CAST(quantity AS FLOAT) ELSE 0 END), 0) AS sales,
                    COALESCE(AVG(
                        CASE
                            WHEN status = 'History' AND buyer IS NOT NULL AND sold_price > 0 AND base_price > 0
                            THEN ((CAST(sold_price AS FLOAT) - CAST(base_price AS FLOAT)) / CAST(base_price AS FLOAT)) * 100
                        END
                    ), 0) AS profit
                FROM auctions
                GROUP BY COALESCE(NULLIF(auction_name, ''), 'Unknown Blend')
                ORDER BY sales DESC
                """
            ),
            {"limit": limit},
        ).mappings().all()

        return [
            {
                "name": r["name"],
                "sales": round(self._num(r["sales"]), 2),
                "profit": round(self._num(r["profit"]), 2),
            }
            for r in rows
        ]

    def _quick_stats(self) -> dict[str, float | int]:
        row = self.db.execute(
            text(
                """
                SELECT
                    (SELECT COUNT(*) FROM users WHERE default_role = 'buyer') AS total_customers,
                    (SELECT COUNT(DISTINCT buyer_id) FROM bids WHERE bid_time >= DATEADD(day, -30, SYSUTCDATETIME())) AS active_buyers,
                    (SELECT COUNT(*) FROM auctions WHERE status = 'History' AND start_time >= DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)) AS completed_auctions_this_month,
                    (SELECT COALESCE(AVG(
                        CASE
                            WHEN status = 'History' AND buyer IS NOT NULL AND sold_price > 0 AND base_price > 0
                            THEN ((CAST(sold_price AS FLOAT) - CAST(base_price AS FLOAT)) / CAST(base_price AS FLOAT)) * 100
                        END
                    ), 0) FROM auctions WHERE start_time >= DATEADD(day, -30, SYSUTCDATETIME())) AS average_blend_margin,
                    (SELECT COALESCE(SUM(CAST(quantity AS FLOAT)), 0)
                     FROM auctions
                     WHERE status IN ('Scheduled', 'Live') OR (status = 'History' AND buyer IS NULL)) AS inventory_stock_kg,
                    (SELECT COUNT(*) FROM orders WHERE CAST(status AS VARCHAR(40)) IN ('pending', 'OrderStatus.pending')) AS pending_orders
                """
            )
        ).mappings().one()

        return {
            "totalCustomers": int(self._num(row["total_customers"])),
            "activeBuyers": int(self._num(row["active_buyers"])),
            "completedAuctionsThisMonth": int(self._num(row["completed_auctions_this_month"])),
            "averageBlendMargin": round(self._num(row["average_blend_margin"]), 2),
            "inventoryStockKg": round(self._num(row["inventory_stock_kg"]), 2),
            "pendingOrders": int(self._num(row["pending_orders"])),
        }

    def create_snapshot(self, lookback_days: int, chart_months: int, refresh_interval_ms: int) -> dict:
        now_utc = datetime.now(timezone.utc)
        current_from = now_utc - timedelta(days=lookback_days)
        previous_from = current_from - timedelta(days=lookback_days)

        current = self._window_metrics(current_from, now_utc)
        previous = self._window_metrics(previous_from, current_from)

        kpis = {}
        for key in ("totalPurchased", "totalSold", "totalRevenue", "avgAuctionPrice", "profitMargin"):
            trend, direction = self._trend(current[key], previous[key])
            kpis[key] = {"value": round(current[key], 2), "trend": trend, "trending": direction}

        kpis["activeAuctions"] = {"value": self._active_auctions_now(), "trend": 0.0, "trending": "neutral"}

        revenue_by_month = self._revenue_by_month(chart_months)
        tea_grade_distribution = self._tea_grade_distribution()
        top_blends = self._top_blends()
        quick_stats = self._quick_stats()

        self.db.execute(
            text(
                """
                INSERT INTO analytics_overview_snapshots (
                    snapshot_at,
                    kpis_json,
                    revenue_by_month_json,
                    tea_grade_distribution_json,
                    top_blends_json,
                    quick_stats_json
                )
                VALUES (
                    :snapshot_at,
                    :kpis_json,
                    :revenue_by_month_json,
                    :tea_grade_distribution_json,
                    :top_blends_json,
                    :quick_stats_json
                )
                """
            ),
            {
                "snapshot_at": now_utc,
                "kpis_json": json.dumps(kpis),
                "revenue_by_month_json": json.dumps(revenue_by_month),
                "tea_grade_distribution_json": json.dumps(tea_grade_distribution),
                "top_blends_json": json.dumps(top_blends),
                "quick_stats_json": json.dumps(quick_stats),
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
                    kpis_json,
                    revenue_by_month_json,
                    tea_grade_distribution_json,
                    top_blends_json,
                    quick_stats_json
                FROM analytics_overview_snapshots
                ORDER BY snapshot_at DESC, snapshot_id DESC
                """
            )
        ).mappings().first()

        if not row:
            return None

        snapshot_at = row["snapshot_at"]
        if snapshot_at.tzinfo is None:
            snapshot_at = snapshot_at.replace(tzinfo=timezone.utc)

        return {
            "generatedAt": snapshot_at,
            "refreshIntervalMs": refresh_interval_ms,
            "kpis": json.loads(row["kpis_json"]),
            "revenueByMonth": json.loads(row["revenue_by_month_json"]),
            "teaGradeDistribution": json.loads(row["tea_grade_distribution_json"]),
            "topBlends": json.loads(row["top_blends_json"]),
            "quickStats": json.loads(row["quick_stats_json"]),
        }

    def prune_old_snapshots(self, retention_days: int) -> None:
        self.db.execute(
            text(
                """
                DELETE FROM analytics_overview_snapshots
                WHERE snapshot_at < DATEADD(day, -:retention_days, SYSUTCDATETIME())
                """
            ),
            {"retention_days": retention_days},
        )
        self.db.commit()
