import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session


class AnalyticsBlendsRepository:
    BLEND_EXPR = """
        COALESCE(
            NULLIF(LTRIM(RTRIM(auction_name)), ''),
            NULLIF(LTRIM(RTRIM(custom_auction_id)), ''),
            CAST(auction_id AS VARCHAR(64))
        )
    """

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _num(value: Any) -> float:
        return float(value or 0)

    @staticmethod
    def _normalize_months(months: int) -> int:
        return max(int(months or 1), 1)

    @staticmethod
    def _normalize_limit(limit: int) -> int:
        return max(int(limit or 1), 1)

    def _summary(self, months: int, top_blends_limit: int) -> dict[str, float | int | str]:
        months = self._normalize_months(months)
        top_blends_limit = self._normalize_limit(top_blends_limit)

        row = self.db.execute(
            text(
                f"""
                WITH sold_window AS (
                    SELECT
                        {self.BLEND_EXPR} AS blend,
                        CAST(COALESCE(quantity, 0) AS FLOAT) AS quantity_kg,
                        CAST(COALESCE(base_price, 0) AS FLOAT) AS base_price_per_kg,
                        CAST(COALESCE(sold_price, 0) AS FLOAT) AS revenue
                    FROM auctions
                    WHERE status = 'History'
                      AND buyer IS NOT NULL
                      AND sold_price > 0
                      AND quantity > 0
                      AND start_time >= DATEADD(
                            month,
                            -:months + 1,
                            DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                      )
                ),
                blend_metrics AS (
                    SELECT
                        blend,
                        SUM(revenue) AS total_revenue,
                        SUM(base_price_per_kg * quantity_kg) AS total_cost
                    FROM sold_window
                    GROUP BY blend
                ),
                top_blends AS (
                    SELECT TOP (:top_blends_limit)
                        blend,
                        total_revenue,
                        CASE
                            WHEN total_revenue > 0
                            THEN ((total_revenue - total_cost) / total_revenue) * 100.0
                            ELSE 0
                        END AS margin_pct
                    FROM blend_metrics
                    ORDER BY total_revenue DESC
                )
                SELECT
                    COALESCE((SELECT COUNT(DISTINCT blend) FROM blend_metrics), 0) AS total_blends,
                    COALESCE(
                        (
                            SELECT
                                CASE
                                    WHEN SUM(total_revenue) > 0
                                    THEN (SUM(total_revenue - total_cost) / SUM(total_revenue)) * 100.0
                                    ELSE 0
                                END
                            FROM blend_metrics
                        ),
                        0
                    ) AS average_profit_margin_pct,
                    COALESCE((SELECT TOP 1 blend FROM top_blends ORDER BY margin_pct DESC, total_revenue DESC), 'N/A') AS best_performer_blend,
                    COALESCE((SELECT TOP 1 margin_pct FROM top_blends ORDER BY margin_pct DESC, total_revenue DESC), 0) AS best_performer_margin_pct,
                    COALESCE((SELECT SUM(total_revenue) FROM blend_metrics), 0) AS total_blend_revenue_lkr
                """
            ),
            {"months": months, "top_blends_limit": top_blends_limit},
        ).mappings().one()

        return {
            "totalBlends": int(self._num(row["total_blends"])),
            "averageProfitMarginPct": round(self._num(row["average_profit_margin_pct"]), 2),
            "bestPerformerBlend": str(row["best_performer_blend"]),
            "bestPerformerMarginPct": round(self._num(row["best_performer_margin_pct"]), 2),
            "totalBlendRevenueLkr": round(self._num(row["total_blend_revenue_lkr"]), 2),
        }

    def _blend_series(self, months: int, top_blends_limit: int) -> list[str]:
        months = self._normalize_months(months)
        top_blends_limit = self._normalize_limit(top_blends_limit)

        rows = self.db.execute(
            text(
                f"""
                WITH sold_window AS (
                    SELECT
                        {self.BLEND_EXPR} AS blend,
                        CAST(COALESCE(sold_price, 0) AS FLOAT) AS revenue
                    FROM auctions
                    WHERE status = 'History'
                      AND buyer IS NOT NULL
                      AND sold_price > 0
                      AND quantity > 0
                      AND start_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                )
                SELECT TOP (:top_blends_limit)
                    blend,
                    SUM(revenue) AS total_revenue
                FROM sold_window
                GROUP BY blend
                ORDER BY total_revenue DESC
                """
            ),
            {"months": months, "top_blends_limit": top_blends_limit},
        ).mappings().all()

        return [str(r["blend"]) for r in rows]

    def _composition_standards(self, blend_series: list[str]) -> list[str]:
        if not blend_series:
            return []

        rows = self.db.execute(
            text(
                f"""
                SELECT
                    COALESCE(NULLIF(LTRIM(RTRIM(grade)), ''), 'Unknown') AS standard,
                    SUM(CAST(COALESCE(quantity, 0) AS FLOAT)) AS total_qty
                FROM auctions
                WHERE status = 'History'
                  AND buyer IS NOT NULL
                  AND sold_price > 0
                  AND quantity > 0
                  AND {self.BLEND_EXPR} IN :blend_series
                GROUP BY COALESCE(NULLIF(LTRIM(RTRIM(grade)), ''), 'Unknown')
                ORDER BY total_qty DESC
                """
            ).bindparams(bindparam("blend_series", expanding=True)),
            {"blend_series": blend_series},
        ).mappings().all()

        return [str(r["standard"]) for r in rows]

    def _blend_composition(self, blend_series: list[str], composition_standards: list[str]) -> list[dict[str, Any]]:
        if not blend_series:
            return []

        rows = self.db.execute(
            text(
                f"""
                WITH grade_qty AS (
                    SELECT
                        {self.BLEND_EXPR} AS blend,
                        COALESCE(NULLIF(LTRIM(RTRIM(grade)), ''), 'Unknown') AS standard,
                        SUM(CAST(COALESCE(quantity, 0) AS FLOAT)) AS qty
                    FROM auctions
                    WHERE status = 'History'
                      AND buyer IS NOT NULL
                      AND sold_price > 0
                      AND quantity > 0
                      AND {self.BLEND_EXPR} IN :blend_series
                    GROUP BY
                        {self.BLEND_EXPR},
                        COALESCE(NULLIF(LTRIM(RTRIM(grade)), ''), 'Unknown')
                ),
                blend_total AS (
                    SELECT blend, SUM(qty) AS total_qty
                    FROM grade_qty
                    GROUP BY blend
                )
                SELECT
                    sq.blend,
                    sq.standard,
                    CASE
                        WHEN bt.total_qty > 0 THEN (sq.qty / bt.total_qty) * 100.0
                        ELSE 0
                    END AS ratio_pct
                FROM grade_qty sq
                INNER JOIN blend_total bt ON bt.blend = sq.blend
                ORDER BY sq.blend, sq.standard
                """
            ).bindparams(bindparam("blend_series", expanding=True)),
            {"blend_series": blend_series},
        ).mappings().all()

        by_blend: dict[str, dict[str, float]] = {
            blend: {standard: 0.0 for standard in composition_standards} for blend in blend_series
        }

        for row in rows:
            blend = str(row["blend"])
            standard = str(row["standard"])
            if blend in by_blend and standard in by_blend[blend]:
                by_blend[blend][standard] = round(self._num(row["ratio_pct"]), 2)

        return [{"blend": blend, "ratios": by_blend[blend]} for blend in blend_series]

    def _blend_profitability(self, months: int, blend_series: list[str]) -> list[dict[str, float | str]]:
        if not blend_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH sold_window AS (
                    SELECT
                        {self.BLEND_EXPR} AS blend,
                        CAST(COALESCE(quantity, 0) AS FLOAT) AS quantity_kg,
                        CAST(COALESCE(base_price, 0) AS FLOAT) AS base_price_per_kg,
                        CAST(COALESCE(sold_price, 0) AS FLOAT) AS revenue
                    FROM auctions
                    WHERE status = 'History'
                      AND buyer IS NOT NULL
                      AND sold_price > 0
                      AND quantity > 0
                      AND start_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                      AND {self.BLEND_EXPR} IN :blend_series
                ),
                blend_metrics AS (
                    SELECT
                        blend,
                        SUM(quantity_kg) AS total_qty,
                        SUM(base_price_per_kg * quantity_kg) AS total_cost,
                        SUM(revenue) AS total_revenue
                    FROM sold_window
                    GROUP BY blend
                )
                SELECT
                    blend,
                    COALESCE(total_cost / NULLIF(total_qty, 0), 0) AS avg_cost_per_kg,
                    COALESCE(total_revenue / NULLIF(total_qty, 0), 0) AS avg_sell_price_per_kg,
                    COALESCE(
                        CASE
                            WHEN total_revenue > 0 THEN ((total_revenue - total_cost) / total_revenue) * 100.0
                            ELSE 0
                        END,
                        0
                    ) AS margin_pct,
                    COALESCE(total_revenue, 0) AS total_revenue
                FROM blend_metrics
                ORDER BY total_revenue DESC
                """
            ).bindparams(bindparam("blend_series", expanding=True)),
            {"months": months, "blend_series": blend_series},
        ).mappings().all()

        return [
            {
                "blend": str(r["blend"]),
                "cost": round(self._num(r["avg_cost_per_kg"]), 2),
                "sellPrice": round(self._num(r["avg_sell_price_per_kg"]), 2),
                "margin": round(self._num(r["margin_pct"]), 2),
                "revenue": round(self._num(r["total_revenue"]) / 1_000_000.0, 2),
            }
            for r in rows
        ]

    def _monthly_blend_performance(self, months: int, blend_series: list[str]) -> list[dict[str, Any]]:
        if not blend_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                SELECT
                    YEAR(start_time) AS year_num,
                    MONTH(start_time) AS month_num,
                    {self.BLEND_EXPR} AS blend,
                    SUM(CAST(COALESCE(sold_price, 0) AS FLOAT)) AS revenue
                FROM auctions
                WHERE status = 'History'
                  AND buyer IS NOT NULL
                  AND sold_price > 0
                  AND quantity > 0
                  AND start_time >= DATEADD(
                    month,
                    -:months + 1,
                    DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                )
                  AND {self.BLEND_EXPR} IN :blend_series
                GROUP BY
                    YEAR(start_time),
                    MONTH(start_time),
                    {self.BLEND_EXPR}
                ORDER BY year_num ASC, month_num ASC, blend ASC
                """
            ).bindparams(bindparam("blend_series", expanding=True)),
            {"months": months, "blend_series": blend_series},
        ).mappings().all()

        points_by_month: dict[tuple[int, int], dict[str, Any]] = {}

        for row in rows:
            y = int(row["year_num"])
            m = int(row["month_num"])
            key = (y, m)

            if key not in points_by_month:
                month_label = datetime(y, m, 1).strftime("%b %y")
                points_by_month[key] = {
                    "month": month_label,
                    "revenues": {blend: 0.0 for blend in blend_series},
                }

            blend = str(row["blend"])
            if blend in points_by_month[key]["revenues"]:
                points_by_month[key]["revenues"][blend] = round(self._num(row["revenue"]) / 1_000_000.0, 2)

        return [points_by_month[key] for key in sorted(points_by_month.keys())]

    def _blend_market_share(self, blend_profitability: list[dict[str, float | str]]) -> list[dict[str, float | str]]:
        total_revenue_m = sum(self._num(item.get("revenue")) for item in blend_profitability)
        if total_revenue_m <= 0:
            return []

        return [
            {
                "blend": str(item["blend"]),
                "share": round((self._num(item["revenue"]) / total_revenue_m) * 100.0, 2),
                "value": round(self._num(item["revenue"]), 2),
            }
            for item in blend_profitability
        ]

    def _profit_margin_trend(self, months: int, blend_series: list[str]) -> list[dict[str, Any]]:
        if not blend_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH sold_window AS (
                    SELECT
                        {self.BLEND_EXPR} AS blend,
                        YEAR(start_time) AS year_num,
                        MONTH(start_time) AS month_num,
                        CAST(COALESCE(quantity, 0) AS FLOAT) AS quantity_kg,
                        CAST(COALESCE(base_price, 0) AS FLOAT) AS base_price_per_kg,
                        CAST(COALESCE(sold_price, 0) AS FLOAT) AS revenue
                    FROM auctions
                    WHERE status = 'History'
                      AND buyer IS NOT NULL
                      AND sold_price > 0
                      AND quantity > 0
                      AND start_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                      AND {self.BLEND_EXPR} IN :blend_series
                ),
                month_blend_metrics AS (
                    SELECT
                        blend,
                        year_num,
                        month_num,
                        SUM(revenue) AS total_revenue,
                        SUM(base_price_per_kg * quantity_kg) AS total_cost
                    FROM sold_window
                    GROUP BY blend, year_num, month_num
                )
                SELECT
                    year_num,
                    month_num,
                    blend,
                    CASE
                        WHEN total_revenue > 0 THEN ((total_revenue - total_cost) / total_revenue) * 100.0
                        ELSE 0
                    END AS margin_pct
                FROM month_blend_metrics
                ORDER BY year_num ASC, month_num ASC, blend ASC
                """
            ).bindparams(bindparam("blend_series", expanding=True)),
            {"months": months, "blend_series": blend_series},
        ).mappings().all()

        points_by_month: dict[tuple[int, int], dict[str, Any]] = {}

        for row in rows:
            y = int(row["year_num"])
            m = int(row["month_num"])
            key = (y, m)

            if key not in points_by_month:
                month_label = datetime(y, m, 1).strftime("%b %y")
                points_by_month[key] = {
                    "month": month_label,
                    "margins": {blend: 0.0 for blend in blend_series},
                }

            blend = str(row["blend"])
            if blend in points_by_month[key]["margins"]:
                points_by_month[key]["margins"][blend] = round(self._num(row["margin_pct"]), 2)

        return [points_by_month[key] for key in sorted(points_by_month.keys())]

    def _annual_comparison(self, blend_series: list[str]) -> tuple[list[dict[str, float | str]], int, int]:
        now = datetime.now(timezone.utc)
        current_year = now.year
        previous_year = current_year - 1

        if not blend_series:
            return [], previous_year, current_year

        rows = self.db.execute(
            text(
                                f"""
                SELECT
                                        {self.BLEND_EXPR} AS blend,
                                        SUM(CASE WHEN YEAR(start_time) = :previous_year THEN CAST(COALESCE(sold_price, 0) AS FLOAT) ELSE 0 END) AS previous_revenue,
                                        SUM(CASE WHEN YEAR(start_time) = :current_year THEN CAST(COALESCE(sold_price, 0) AS FLOAT) ELSE 0 END) AS current_revenue
                                FROM auctions
                                WHERE status = 'History'
                                    AND buyer IS NOT NULL
                                    AND sold_price > 0
                                    AND quantity > 0
                                    AND {self.BLEND_EXPR} IN :blend_series
                                    AND YEAR(start_time) IN (:previous_year, :current_year)
                                GROUP BY {self.BLEND_EXPR}
                """
            ).bindparams(bindparam("blend_series", expanding=True)),
            {
                "previous_year": previous_year,
                "current_year": current_year,
                "blend_series": blend_series,
            },
        ).mappings().all()

        by_blend = {str(r["blend"]): r for r in rows}
        response: list[dict[str, float | str]] = []

        for blend in blend_series:
            row = by_blend.get(blend)
            prev_rev = self._num(row["previous_revenue"]) / 1_000_000.0 if row else 0.0
            curr_rev = self._num(row["current_revenue"]) / 1_000_000.0 if row else 0.0

            if prev_rev > 0:
                growth = ((curr_rev - prev_rev) / prev_rev) * 100.0
            elif curr_rev > 0:
                growth = 100.0
            else:
                growth = 0.0

            response.append(
                {
                    "blend": blend,
                    "previousYearRevenue": round(prev_rev, 2),
                    "currentYearRevenue": round(curr_rev, 2),
                    "growth": round(growth, 2),
                }
            )

        return response, previous_year, current_year

    def create_snapshot(self, chart_months: int, refresh_interval_ms: int, top_blends_limit: int = 5) -> dict:
        chart_months = max(chart_months, 1)
        top_blends_limit = max(top_blends_limit, 1)

        summary = self._summary(months=chart_months, top_blends_limit=top_blends_limit)
        blend_series = self._blend_series(months=chart_months, top_blends_limit=top_blends_limit)
        composition_standards = self._composition_standards(blend_series)
        blend_composition = self._blend_composition(blend_series, composition_standards)
        blend_profitability = self._blend_profitability(months=chart_months, blend_series=blend_series)
        monthly_blend_performance = self._monthly_blend_performance(months=chart_months, blend_series=blend_series)
        blend_market_share = self._blend_market_share(blend_profitability)
        profit_margin_trend = self._profit_margin_trend(months=chart_months, blend_series=blend_series)
        annual_comparison, annual_previous_year, annual_current_year = self._annual_comparison(blend_series)

        now_utc = datetime.now(timezone.utc)

        payload = {
            "generatedAt": now_utc,
            "refreshIntervalMs": refresh_interval_ms,
            "summary": summary,
            "compositionStandards": composition_standards,
            "blendSeries": blend_series,
            "summaryWindowMonths": chart_months,
            "summaryWindowLabel": f"Last {chart_months} months",
            "annualPreviousYear": annual_previous_year,
            "annualCurrentYear": annual_current_year,
            "blendComposition": blend_composition,
            "blendProfitability": blend_profitability,
            "monthlyBlendPerformance": monthly_blend_performance,
            "blendMarketShare": blend_market_share,
            "profitMarginTrend": profit_margin_trend,
            "annualComparison": annual_comparison,
        }

        self.db.execute(
            text(
                """
                INSERT INTO analytics_blends_snapshots (
                    snapshot_at,
                    payload_json
                )
                VALUES (
                    :snapshot_at,
                    :payload_json
                )
                """
            ),
            {
                "snapshot_at": now_utc,
                "payload_json": json.dumps(
                    {
                        **payload,
                        "generatedAt": now_utc.isoformat(),
                    }
                ),
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
                    payload_json
                FROM analytics_blends_snapshots
                ORDER BY snapshot_at DESC, snapshot_id DESC
                """
            )
        ).mappings().first()

        if not row:
            return None

        snapshot_at = row["snapshot_at"]
        if snapshot_at.tzinfo is None:
            snapshot_at = snapshot_at.replace(tzinfo=timezone.utc)

        payload = json.loads(row["payload_json"])
        payload["generatedAt"] = snapshot_at
        payload["refreshIntervalMs"] = refresh_interval_ms

        return payload

    def prune_old_snapshots(self, retention_days: int) -> None:
        self.db.execute(
            text(
                """
                DELETE FROM analytics_blends_snapshots
                WHERE snapshot_at < DATEADD(day, -:retention_days, SYSUTCDATETIME())
                """
            ),
            {"retention_days": retention_days},
        )
        self.db.commit()
