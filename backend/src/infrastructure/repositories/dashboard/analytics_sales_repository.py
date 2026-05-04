import json
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import text
from sqlalchemy.orm import Session


class AnalyticsSalesRepository:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _num(value: Any) -> float:
        return float(value or 0)

    def _summary(self) -> dict[str, float | int]:
        row = self.db.execute(
            text(
                """
                WITH sold_auctions AS (
                    SELECT
                        auction_id,
                        CAST(COALESCE(quantity, 0) AS FLOAT) AS quantity,
                        CAST(COALESCE(base_price, 0) AS FLOAT) AS base_price,
                        CAST(COALESCE(sold_price, 0) AS FLOAT) AS sold_price,
                        CASE
                            WHEN TRY_CAST(duration AS FLOAT) IS NULL OR TRY_CAST(duration AS FLOAT) <= 0 THEN NULL
                            ELSE TRY_CAST(duration AS FLOAT)
                        END AS duration_minutes
                    FROM auctions
                    WHERE status = 'History'
                      AND buyer IS NOT NULL
                      AND sold_price > 0
                      AND quantity > 0
                ),
                bids_for_sold AS (
                    SELECT COUNT(*) AS total_bids
                    FROM bids b
                    INNER JOIN sold_auctions sa ON sa.auction_id = b.auction_id
                )
                SELECT
                    COALESCE(SUM(sa.sold_price), 0) AS total_revenue,
                    COALESCE(SUM(sa.quantity), 0) AS total_volume,
                    COALESCE(COUNT(*), 0) AS auctions_held,
                    COALESCE(MAX(bfs.total_bids), 0) AS total_bids,
                    COALESCE(AVG(sa.duration_minutes) / 1440.0, 0) AS average_time_to_sell_days
                FROM sold_auctions sa
                CROSS JOIN bids_for_sold bfs
                """
            )
        ).mappings().one()

        total_revenue = self._num(row["total_revenue"])
        total_volume = self._num(row["total_volume"])
        avg_closing_price = (total_revenue / total_volume) if total_volume > 0 else 0.0

        return {
            "totalRevenueLkr": round(total_revenue, 2),
            "averageClosingPriceLkrPerKg": round(avg_closing_price, 2),
            "auctionsHeld": int(self._num(row["auctions_held"])),
            "totalBids": int(self._num(row["total_bids"])),
            "averageTimeToSellDays": round(self._num(row["average_time_to_sell_days"]), 2),
        }

    def _auction_performance(self, limit: int = 10) -> list[dict[str, float | int | str]]:
        rows = self.db.execute(
            text(
                """
                WITH bid_counts AS (
                    SELECT auction_id, COUNT(*) AS bid_count
                    FROM bids
                    GROUP BY auction_id
                )
                SELECT TOP (:limit)
                    COALESCE(NULLIF(a.auction_name, ''), CAST(a.auction_id AS VARCHAR(36))) AS auction,
                    CAST(COALESCE(a.base_price, 0) AS FLOAT) AS base_price,
                    CAST(COALESCE(a.sold_price, 0) AS FLOAT) AS closing_price,
                    CAST(COALESCE(a.quantity, 0) AS FLOAT) AS volume,
                    COALESCE(bc.bid_count, 0) AS bid_count
                FROM auctions a
                LEFT JOIN bid_counts bc ON bc.auction_id = a.auction_id
                WHERE a.status = 'History'
                  AND a.buyer IS NOT NULL
                  AND a.sold_price > 0
                ORDER BY a.start_time DESC
                """
            ),
            {"limit": max(limit, 1)},
        ).mappings().all()

        return [
            {
                "auction": str(r["auction"]),
                "basePrice": round(self._num(r["base_price"]), 2),
                "closingPrice": round(self._num(r["closing_price"]), 2),
                "volume": round(self._num(r["volume"]), 2),
                "bidCount": int(self._num(r["bid_count"])),
            }
            for r in rows
        ]

    def _selling_trends(self, months: int) -> list[dict[str, float | str]]:
        rows = self.db.execute(
            text(
                """
                SELECT
                    YEAR(start_time) AS year_num,
                    MONTH(start_time) AS month_num,
                    COALESCE(SUM(CAST(sold_price AS FLOAT)), 0) AS revenue,
                    COALESCE(SUM(CAST(quantity AS FLOAT)), 0) AS volume,
                    COALESCE(
                        SUM(CAST(sold_price AS FLOAT)) / NULLIF(SUM(CAST(quantity AS FLOAT)), 0),
                        0
                    ) AS avg_price
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
                GROUP BY YEAR(start_time), MONTH(start_time)
                ORDER BY year_num ASC, month_num ASC
                """
            ),
            {"months": max(months, 1)},
        ).mappings().all()

        trends: list[dict[str, float | str]] = []
        for r in rows:
            y = int(r["year_num"])
            m = int(r["month_num"])
            trends.append(
                {
                    "month": datetime(y, m, 1).strftime("%b %y"),
                    "revenue": round(self._num(r["revenue"]), 2),
                    "volume": round(self._num(r["volume"]), 2),
                    "avgPrice": round(self._num(r["avg_price"]), 2),
                }
            )
        return trends

    def _seller_performance(self, limit: int = 5) -> list[dict[str, float | int | str]]:
        # - avg_margin: Average margin % = AVG((sold_price - base_price) / base_price * 100)
        rows = self.db.execute(
            text(
                """
                SELECT TOP (:limit)
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(company_name)), ''),
                        NULLIF(LTRIM(RTRIM(estate_name)), ''),
                        'Unknown Seller'
                    ) AS seller,
                    COALESCE(SUM(CAST(sold_price AS FLOAT)), 0) AS total_sales,
                    COALESCE(
                        AVG(
                            CASE
                                WHEN sold_price > 0 AND base_price > 0
                                THEN ((CAST(sold_price AS FLOAT) - CAST(base_price AS FLOAT)) / CAST(base_price AS FLOAT)) * 100.0
                            END
                        ),
                        0
                    ) AS avg_margin,
                    COUNT(*) AS auctions_won
                FROM auctions
                WHERE status = 'History'
                  AND buyer IS NOT NULL
                  AND sold_price > 0
                GROUP BY
                    COALESCE(
                        NULLIF(LTRIM(RTRIM(company_name)), ''),
                        NULLIF(LTRIM(RTRIM(estate_name)), ''),
                        'Unknown Seller'
                    )
                ORDER BY total_sales DESC
                """
            ),
            {"limit": max(limit, 1)},
        ).mappings().all()

        return [
            {
                "seller": str(r["seller"]),
                "totalSales": round(self._num(r["total_sales"]), 2),
                "avgMargin": round(self._num(r["avg_margin"]), 2),
                "auctionsWon": int(self._num(r["auctions_won"])),
            }
            for r in rows
        ]

    def _bid_volume_analysis(self, limit: int = 10) -> list[dict[str, float | int | str]]:
        rows = self.db.execute(
            text(
                """
                WITH bid_counts AS (
                    SELECT auction_id, COUNT(*) AS total_bids
                    FROM bids
                    GROUP BY auction_id
                ),
                bid_increments AS (
                    SELECT
                        b.auction_id,
                        CAST(b.bid_amount AS FLOAT) -
                        LAG(CAST(b.bid_amount AS FLOAT)) OVER (
                            PARTITION BY b.auction_id
                            ORDER BY b.bid_time, b.bid_id
                        ) AS increment
                    FROM bids b
                ),
                increment_agg AS (
                    SELECT
                        auction_id,
                        COALESCE(AVG(CASE WHEN increment > 0 THEN increment END), 0) AS avg_bid_increment
                    FROM bid_increments
                    GROUP BY auction_id
                )
                SELECT TOP (:limit)
                    COALESCE(NULLIF(a.auction_name, ''), CAST(a.auction_id AS VARCHAR(36))) AS auction,
                    COALESCE(bc.total_bids, 0) AS total_bids,
                    COALESCE(ia.avg_bid_increment, 0) AS avg_bid_increment,
                    CASE
                        WHEN a.status = 'History' AND a.buyer IS NOT NULL AND a.sold_price > 0 THEN 1
                        ELSE 0
                    END AS winning_bids
                FROM auctions a
                LEFT JOIN bid_counts bc ON bc.auction_id = a.auction_id
                LEFT JOIN increment_agg ia ON ia.auction_id = a.auction_id
                WHERE a.status = 'History'
                ORDER BY COALESCE(bc.total_bids, 0) DESC, a.start_time DESC
                """
            ),
            {"limit": max(limit, 1)},
        ).mappings().all()

        return [
            {
                "auction": str(r["auction"]),
                "totalBids": int(self._num(r["total_bids"])),
                "avgBidIncrement": round(self._num(r["avg_bid_increment"]), 2),
                "winningBids": int(self._num(r["winning_bids"])),
            }
            for r in rows
        ]

    def create_snapshot(self, chart_months: int, refresh_interval_ms: int) -> dict:
        summary = self._summary()
        auction_performance = self._auction_performance()
        selling_trends = self._selling_trends(chart_months)
        seller_performance = self._seller_performance()
        bid_volume_analysis = self._bid_volume_analysis()

        now_utc = datetime.now(timezone.utc)

        self.db.execute(
            text(
                """
                INSERT INTO analytics_sales_snapshots (
                    snapshot_at,
                    summary_json,
                    auction_performance_json,
                    grade_wise_prices_json,
                    selling_trends_json,
                    seller_performance_json,
                    bid_volume_analysis_json
                )
                VALUES (
                    :snapshot_at,
                    :summary_json,
                    :auction_performance_json,
                    :grade_wise_prices_json,
                    :selling_trends_json,
                    :seller_performance_json,
                    :bid_volume_analysis_json
                )
                """
            ),
            {
                "snapshot_at": now_utc,
                "summary_json": json.dumps(summary),
                "auction_performance_json": json.dumps(auction_performance),
                "grade_wise_prices_json": json.dumps([]),
                "selling_trends_json": json.dumps(selling_trends),
                "seller_performance_json": json.dumps(seller_performance),
                "bid_volume_analysis_json": json.dumps(bid_volume_analysis),
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
                    auction_performance_json,
                    grade_wise_prices_json,
                    selling_trends_json,
                    seller_performance_json,
                    bid_volume_analysis_json
                FROM analytics_sales_snapshots
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
            "auctionPerformance": json.loads(row["auction_performance_json"]),
            "sellingTrends": json.loads(row["selling_trends_json"]),
            "sellerPerformance": json.loads(row["seller_performance_json"]),
            "bidVolumeAnalysis": json.loads(row["bid_volume_analysis_json"]),
        }

    def prune_old_snapshots(self, retention_days: int) -> None:
        self.db.execute(
            text(
                """
                DELETE FROM analytics_sales_snapshots
                WHERE snapshot_at < DATEADD(day, -:retention_days, SYSUTCDATETIME())
                """
            ),
            {"retention_days": retention_days},
        )
        self.db.commit()