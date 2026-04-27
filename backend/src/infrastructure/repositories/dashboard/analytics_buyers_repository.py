import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import bindparam, text
from sqlalchemy.orm import Session


class AnalyticsBuyersRepository:
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

    @staticmethod
    def _month_label(year_num: int, month_num: int) -> str:
        return datetime(int(year_num), int(month_num), 1).strftime("%b %y")

    BID_BUYER_EXPR = "COALESCE(NULLIF(LTRIM(RTRIM(u.user_name)), ''), CAST(b.buyer_id AS VARCHAR(64)))"
    AUCTION_BUYER_EXPR = "COALESCE(NULLIF(LTRIM(RTRIM(u.user_name)), ''), CAST(a.buyer AS VARCHAR(64)))"
    WIN_BUYER_EXPR = "COALESCE(NULLIF(LTRIM(RTRIM(u.user_name)), ''), CAST(wa.user_id AS VARCHAR(64)))"

    def _buyer_series(self, months: int, limit: int) -> list[str]:
        months = self._normalize_months(months)
        limit = self._normalize_limit(limit)

        rows = self.db.execute(
            text(
                f"""
                WITH bid_window AS (
                    SELECT
                        {self.BID_BUYER_EXPR} AS buyer,
                        COUNT(*) AS total_bids
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                    GROUP BY b.buyer_id, u.user_name
                )
                SELECT TOP (:limit)
                    buyer
                FROM bid_window
                ORDER BY total_bids DESC, buyer ASC
                """
            ),
            {"months": months, "limit": limit},
        ).mappings().all()

        return [str(r["buyer"]) for r in rows]

    def _buyer_participation(self, months: int, buyer_series: list[str]) -> list[dict[str, Any]]:
        if not buyer_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH bid_metrics AS (
                    SELECT
                        {self.BID_BUYER_EXPR} AS buyer,
                        COUNT(DISTINCT b.auction_id) AS frequency,
                        COUNT(*) AS total_bids
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                    GROUP BY b.buyer_id, u.user_name
                ),
                win_metrics AS (
                    SELECT
                        {self.WIN_BUYER_EXPR} AS buyer,
                        COUNT(DISTINCT wa.auction_id) AS won_auctions
                    FROM wins_auction wa
                    INNER JOIN orders o ON o.order_id = wa.order_id
                    LEFT JOIN users u ON u.user_id = wa.user_id
                    WHERE o.order_date >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                    GROUP BY wa.user_id, u.user_name
                )
                SELECT
                    b.buyer,
                    COALESCE(bm.frequency, 0) AS frequency,
                    COALESCE(bm.total_bids, 0) AS total_bids,
                    COALESCE(wm.won_auctions, 0) AS won_auctions
                FROM (SELECT value AS buyer FROM STRING_SPLIT(:buyers_csv, '|')) b
                LEFT JOIN bid_metrics bm ON bm.buyer = b.buyer
                LEFT JOIN win_metrics wm ON wm.buyer = b.buyer
                ORDER BY
                    CASE
                        WHEN COALESCE(bm.total_bids, 0) > 0 THEN COALESCE(wm.won_auctions, 0) * 1.0 / COALESCE(bm.total_bids, 0)
                        ELSE 0
                    END DESC,
                    COALESCE(bm.total_bids, 0) DESC,
                    b.buyer ASC
                """
            ),
            {"months": months, "buyers_csv": "|".join(buyer_series)},
        ).mappings().all()

        return [
            {
                "buyer": str(r["buyer"]),
                "frequency": int(self._num(r["frequency"])),
                "totalBids": int(self._num(r["total_bids"])),
                "wonAuctions": int(self._num(r["won_auctions"])),
            }
            for r in rows
        ]

    def _most_active_buyers(self, months: int, buyer_series: list[str]) -> list[dict[str, Any]]:
        if not buyer_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH sold_metrics AS (
                    SELECT
                        {self.AUCTION_BUYER_EXPR} AS buyer,
                        SUM(CAST(COALESCE(a.quantity, 0) AS FLOAT)) AS volume,
                        SUM(CAST(COALESCE(a.sold_price, 0) AS FLOAT)) AS spend
                    FROM auctions a
                    LEFT JOIN users u ON u.user_id = a.buyer
                    WHERE a.status = 'History'
                      AND a.buyer IS NOT NULL
                      AND a.sold_price > 0
                      AND a.quantity > 0
                      AND a.start_time >= DATEADD(
                            month,
                            -:months + 1,
                            DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                      )
                    GROUP BY a.buyer, u.user_name
                ),
                bid_avg AS (
                    SELECT
                        {self.BID_BUYER_EXPR} AS buyer,
                        AVG(CAST(COALESCE(b.bid_amount, 0) AS FLOAT)) AS avg_bid
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                    GROUP BY b.buyer_id, u.user_name
                )
                SELECT
                    b.buyer,
                    COALESCE(sm.volume, 0) AS volume,
                    COALESCE(sm.spend, 0) AS spend,
                    COALESCE(ba.avg_bid, 0) AS avg_bid
                FROM (SELECT value AS buyer FROM STRING_SPLIT(:buyers_csv, '|')) b
                LEFT JOIN sold_metrics sm ON sm.buyer = b.buyer
                LEFT JOIN bid_avg ba ON ba.buyer = b.buyer
                ORDER BY COALESCE(sm.volume, 0) DESC, b.buyer ASC
                """
            ),
            {"months": months, "buyers_csv": "|".join(buyer_series)},
        ).mappings().all()

        return [
            {
                "buyer": str(r["buyer"]),
                "volume": round(self._num(r["volume"]), 2),
                "spend": round(self._num(r["spend"]) / 1_000_000.0, 2),
                "avgBid": round(self._num(r["avg_bid"]), 2),
            }
            for r in rows
        ]

    def _bid_increment_analysis(self, months: int, buyer_series: list[str]) -> list[dict[str, Any]]:
        if not buyer_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH buyer_bids AS (
                    SELECT
                        {self.BID_BUYER_EXPR} AS buyer,
                        CAST(COALESCE(b.bid_amount, 0) AS FLOAT) AS bid_amount,
                        LAG(CAST(COALESCE(b.bid_amount, 0) AS FLOAT)) OVER (
                            PARTITION BY b.buyer_id
                            ORDER BY b.bid_time, b.bid_id
                        ) AS prev_bid_amount
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                ),
                increments AS (
                    SELECT
                        buyer,
                        CASE WHEN prev_bid_amount IS NOT NULL THEN bid_amount - prev_bid_amount ELSE NULL END AS increment
                    FROM buyer_bids
                ),
                increment_metrics AS (
                    SELECT
                        buyer,
                        AVG(CASE WHEN increment > 0 THEN increment END) AS avg_increment,
                        MAX(CASE WHEN increment > 0 THEN increment END) AS max_increment
                    FROM increments
                    GROUP BY buyer
                )
                SELECT
                    b.buyer,
                    COALESCE(im.avg_increment, 0) AS avg_increment,
                    COALESCE(im.max_increment, 0) AS max_increment,
                    CASE
                        WHEN COALESCE(im.avg_increment, 0) >= 50 THEN 'Aggressive'
                        WHEN COALESCE(im.avg_increment, 0) >= 35 THEN 'Moderate'
                        ELSE 'Conservative'
                    END AS bid_style
                FROM (SELECT value AS buyer FROM STRING_SPLIT(:buyers_csv, '|')) b
                LEFT JOIN increment_metrics im ON im.buyer = b.buyer
                ORDER BY COALESCE(im.avg_increment, 0) DESC, b.buyer ASC
                """
            ),
            {"months": months, "buyers_csv": "|".join(buyer_series)},
        ).mappings().all()

        return [
            {
                "buyer": str(r["buyer"]),
                "avgIncrement": round(self._num(r["avg_increment"]), 2),
                "maxIncrement": round(self._num(r["max_increment"]), 2),
                "bidStyle": str(r["bid_style"]),
            }
            for r in rows
        ]

    def _demand_by_grade(self, months: int, buyer_series: list[str]) -> list[dict[str, Any]]:
        if not buyer_series:
            return []

        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                SELECT
                    COALESCE(NULLIF(LTRIM(RTRIM(a.grade)), ''), 'Unknown') AS grade,
                    {self.AUCTION_BUYER_EXPR} AS buyer,
                    SUM(CAST(COALESCE(a.quantity, 0) AS FLOAT)) AS demand_qty
                FROM auctions a
                LEFT JOIN users u ON u.user_id = a.buyer
                WHERE a.status = 'History'
                  AND a.buyer IS NOT NULL
                  AND a.sold_price > 0
                  AND a.quantity > 0
                  AND a.start_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                  )
                  AND {self.AUCTION_BUYER_EXPR} IN :buyer_series
                GROUP BY
                    COALESCE(NULLIF(LTRIM(RTRIM(a.grade)), ''), 'Unknown'),
                    a.buyer,
                    u.user_name
                ORDER BY grade ASC, buyer ASC
                """
            ).bindparams(bindparam("buyer_series", expanding=True)),
            {"months": months, "buyer_series": buyer_series},
        ).mappings().all()

        by_grade: dict[str, dict[str, float]] = {}
        for row in rows:
            grade = str(row["grade"])
            buyer = str(row["buyer"])
            if grade not in by_grade:
                by_grade[grade] = {b: 0.0 for b in buyer_series}
            if buyer in by_grade[grade]:
                by_grade[grade][buyer] = round(self._num(row["demand_qty"]), 2)

        for grade in list(by_grade.keys()):
            for buyer in buyer_series:
                by_grade[grade].setdefault(buyer, 0.0)

        return [{"grade": grade, "buyerDemand": by_grade[grade]} for grade in sorted(by_grade.keys())]

    def _repeat_buyer_rate(self, months: int) -> list[dict[str, Any]]:
        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH buyer_month_activity AS (
                    SELECT
                        b.buyer_id AS buyer_key,
                        {self.BID_BUYER_EXPR} AS buyer,
                        YEAR(b.bid_time) AS year_num,
                        MONTH(b.bid_time) AS month_num,
                        DATEFROMPARTS(YEAR(b.bid_time), MONTH(b.bid_time), 1) AS month_start
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                    GROUP BY
                        b.buyer_id,
                        u.user_name,
                        YEAR(b.bid_time),
                        MONTH(b.bid_time),
                        DATEFROMPARTS(YEAR(b.bid_time), MONTH(b.bid_time), 1)
                ),
                first_month AS (
                    SELECT
                        buyer_key,
                        MIN(month_start) AS first_month_start
                    FROM buyer_month_activity
                    GROUP BY buyer_key
                )
                SELECT
                    bma.year_num,
                    bma.month_num,
                    COUNT(*) AS active_buyers,
                    SUM(CASE WHEN fm.first_month_start = bma.month_start THEN 1 ELSE 0 END) AS new_buyers
                FROM buyer_month_activity bma
                INNER JOIN first_month fm ON fm.buyer_key = bma.buyer_key
                GROUP BY bma.year_num, bma.month_num
                ORDER BY bma.year_num ASC, bma.month_num ASC
                """
            ),
            {"months": months},
        ).mappings().all()

        payload: list[dict[str, Any]] = []
        for row in rows:
            active = int(self._num(row["active_buyers"]))
            new_buyers = int(self._num(row["new_buyers"]))
            repeat_buyers = max(active - new_buyers, 0)
            rate = (repeat_buyers / active * 100.0) if active > 0 else 0.0
            payload.append(
                {
                    "month": self._month_label(int(row["year_num"]), int(row["month_num"])),
                    "newBuyers": new_buyers,
                    "repeatBuyers": repeat_buyers,
                    "rate": round(rate, 2),
                }
            )

        return payload

    def _buyer_segmentation(self, months: int) -> list[dict[str, Any]]:
        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                f"""
                WITH buyer_bid_pool AS (
                    SELECT DISTINCT
                        b.buyer_id AS buyer_key,
                        {self.BID_BUYER_EXPR} AS buyer
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                ),
                buyer_spend AS (
                    SELECT
                        a.buyer AS buyer_key,
                        {self.AUCTION_BUYER_EXPR} AS buyer,
                        SUM(CAST(COALESCE(a.sold_price, 0) AS FLOAT)) AS spend
                    FROM auctions a
                    LEFT JOIN users u ON u.user_id = a.buyer
                    WHERE a.status = 'History'
                      AND a.buyer IS NOT NULL
                      AND a.sold_price > 0
                      AND a.quantity > 0
                      AND a.start_time >= DATEADD(
                            month,
                            -:months + 1,
                            DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                      )
                    GROUP BY a.buyer, u.user_name
                ),
                avg_spend AS (
                    SELECT AVG(spend) AS avg_value
                    FROM buyer_spend
                    WHERE spend > 0
                ),
                buyer_profile AS (
                    SELECT
                        bp.buyer_key,
                        bp.buyer,
                        COALESCE(bs.spend, 0) AS spend,
                        CASE
                            WHEN COALESCE(bs.spend, 0) >= COALESCE(a.avg_value, 0) * 1.5 THEN 'High Volume'
                            WHEN COALESCE(bs.spend, 0) >= COALESCE(a.avg_value, 0) AND COALESCE(bs.spend, 0) > 0 THEN 'Regular'
                            WHEN COALESCE(bs.spend, 0) > 0 THEN 'Occasional'
                            ELSE 'New/Trial'
                        END AS segment
                    FROM buyer_bid_pool bp
                    LEFT JOIN buyer_spend bs ON bs.buyer_key = bp.buyer_key
                    CROSS JOIN avg_spend a
                ),
                totals AS (
                    SELECT
                        COUNT(*) AS total_buyers,
                        SUM(spend) AS total_spend
                    FROM buyer_profile
                )
                SELECT
                    segment,
                    COUNT(*) AS buyers,
                    SUM(spend) AS spend,
                    MAX(t.total_buyers) AS total_buyers,
                    MAX(t.total_spend) AS total_spend
                FROM buyer_profile
                CROSS JOIN totals t
                GROUP BY segment
                """
            ),
            {"months": months},
        ).mappings().all()

        by_segment: dict[str, dict[str, float]] = {
            "High Volume": {"buyers": 0, "percentage": 0.0, "contribution": 0.0},
            "Regular": {"buyers": 0, "percentage": 0.0, "contribution": 0.0},
            "Occasional": {"buyers": 0, "percentage": 0.0, "contribution": 0.0},
            "New/Trial": {"buyers": 0, "percentage": 0.0, "contribution": 0.0},
        }

        for row in rows:
            segment = str(row["segment"])
            if segment not in by_segment:
                continue

            buyers = int(self._num(row["buyers"]))
            total_buyers = self._num(row["total_buyers"])
            spend = self._num(row["spend"])
            total_spend = self._num(row["total_spend"])

            by_segment[segment] = {
                "buyers": buyers,
                "percentage": round((buyers / total_buyers) * 100.0, 2) if total_buyers > 0 else 0.0,
                "contribution": round((spend / total_spend) * 100.0, 2) if total_spend > 0 else 0.0,
            }

        return [
            {
                "segment": segment,
                "buyers": int(values["buyers"]),
                "percentage": float(values["percentage"]),
                "contribution": float(values["contribution"]),
            }
            for segment, values in by_segment.items()
        ]

    def _monthly_engagement(self, months: int) -> list[dict[str, Any]]:
        months = self._normalize_months(months)

        rows = self.db.execute(
            text(
                """
                SELECT
                    YEAR(b.bid_time) AS year_num,
                    MONTH(b.bid_time) AS month_num,
                    COUNT(DISTINCT b.buyer_id) AS active_buyers,
                    COUNT(*) AS total_bids
                FROM bids b
                WHERE b.bid_time >= DATEADD(
                    month,
                    -:months + 1,
                    DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                )
                GROUP BY YEAR(b.bid_time), MONTH(b.bid_time)
                ORDER BY year_num ASC, month_num ASC
                """
            ),
            {"months": months},
        ).mappings().all()

        return [
            {
                "month": self._month_label(int(r["year_num"]), int(r["month_num"])),
                "activeBuyers": int(self._num(r["active_buyers"])),
                "totalBids": int(self._num(r["total_bids"])),
                "avgBidsPerBuyer": round(
                    self._num(r["total_bids"]) / self._num(r["active_buyers"])
                    if self._num(r["active_buyers"]) > 0
                    else 0.0,
                    2,
                ),
            }
            for r in rows
        ]

    def _summary(self, months: int, repeat_buyer_rate: list[dict[str, Any]]) -> dict[str, Any]:
        months = self._normalize_months(months)

        row = self.db.execute(
            text(
                f"""
                WITH buyer_pool AS (
                    SELECT DISTINCT
                        b.buyer_id AS buyer_key,
                        {self.BID_BUYER_EXPR} AS buyer
                    FROM bids b
                    LEFT JOIN users u ON u.user_id = b.buyer_id
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                ),
                bid_window AS (
                    SELECT
                        COUNT(*) AS total_bids
                    FROM bids b
                    WHERE b.bid_time >= DATEADD(
                        month,
                        -:months + 1,
                        DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                    )
                ),
                active_month AS (
                    SELECT
                        COUNT(DISTINCT b.buyer_id) AS active_buyers
                    FROM bids b
                    WHERE b.bid_time >= DATEFROMPARTS(YEAR(SYSUTCDATETIME()), MONTH(SYSUTCDATETIME()), 1)
                )
                SELECT
                    (SELECT COUNT(*) FROM buyer_pool) AS total_buyers,
                    (SELECT active_buyers FROM active_month) AS active_buyers,
                    (SELECT total_bids FROM bid_window) AS total_bids
                """
            ),
            {"months": months},
        ).mappings().one()

        total_buyers = int(self._num(row["total_buyers"]))
        total_bids = int(self._num(row["total_bids"]))

        latest_repeat = repeat_buyer_rate[-1] if repeat_buyer_rate else None

        return {
            "totalBuyers": total_buyers,
            "activeBuyers": int(self._num(row["active_buyers"])),
            "avgParticipation": round((total_bids / total_buyers) if total_buyers > 0 else 0.0, 2),
            "repeatRate": float(latest_repeat["rate"]) if latest_repeat else 0.0,
            "newBuyersThisMonth": int(latest_repeat["newBuyers"]) if latest_repeat else 0,
        }

    def create_snapshot(self, chart_months: int, refresh_interval_ms: int, top_buyers_limit: int = 5) -> dict:
        chart_months = self._normalize_months(chart_months)
        top_buyers_limit = self._normalize_limit(top_buyers_limit)

        buyer_series = self._buyer_series(chart_months, top_buyers_limit)
        buyer_participation = self._buyer_participation(chart_months, buyer_series)
        most_active_buyers = self._most_active_buyers(chart_months, buyer_series)
        bid_increment_analysis = self._bid_increment_analysis(chart_months, buyer_series)
        demand_by_grade = self._demand_by_grade(chart_months, buyer_series)
        repeat_buyer_rate = self._repeat_buyer_rate(chart_months)
        buyer_segmentation = self._buyer_segmentation(chart_months)
        monthly_engagement = self._monthly_engagement(chart_months)
        summary = self._summary(chart_months, repeat_buyer_rate)

        now_utc = datetime.now(timezone.utc)

        payload = {
            "generatedAt": now_utc,
            "refreshIntervalMs": refresh_interval_ms,
            "summary": summary,
            "summaryWindowMonths": chart_months,
            "summaryWindowLabel": f"Last {chart_months} months",
            "buyerSeries": buyer_series,
            "buyerParticipation": buyer_participation,
            "mostActiveBuyers": most_active_buyers,
            "bidIncrementAnalysis": bid_increment_analysis,
            "demandByGrade": demand_by_grade,
            "repeatBuyerRate": repeat_buyer_rate,
            "buyerSegmentation": buyer_segmentation,
            "monthlyEngagement": monthly_engagement,
        }

        self.db.execute(
            text(
                """
                INSERT INTO analytics_buyers_snapshots (
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
                "payload_json": json.dumps({**payload, "generatedAt": now_utc.isoformat()}),
            },
        )
        self.db.commit()

        return self.get_latest_snapshot(refresh_interval_ms)

    def get_latest_snapshot(self, refresh_interval_ms: int) -> dict | None:
        row = self.db.execute(
            text(
                """
                SELECT TOP 1
                    snapshot_at,
                    payload_json
                FROM analytics_buyers_snapshots
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
                DELETE FROM analytics_buyers_snapshots
                WHERE snapshot_at < DATEADD(day, -:retention_days, SYSUTCDATETIME())
                """
            ),
            {"retention_days": retention_days},
        )
        self.db.commit()
