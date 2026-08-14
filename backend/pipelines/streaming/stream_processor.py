import logging
import time
from collections import deque
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import random
import uuid

from src.infrastructure.database.warehouse_connection import get_warehouse
from pipelines.streaming.event_models import BidPlacedEvent, AuctionStatusChangedEvent

logger = logging.getLogger("StreamProcessor")


class AuctionStreamProcessor:
    """
    Real-Time Stream Processing Engine for Live Tea Auctions.
    Maintains a 5-minute sliding window of bid events and dynamically computes:
    - Bid velocity (bids per minute)
    - Live price surge rate (%)
    - Active auction count
    - Real-time gross bid volume
    Updates DuckDB mart_realtime_auction_telemetry in real time.
    """

    _instance: Optional["AuctionStreamProcessor"] = None

    def __new__(cls, window_minutes: int = 5):
        if cls._instance is None:
            cls._instance = super(AuctionStreamProcessor, cls).__new__(cls)
            cls._instance.window_duration = timedelta(minutes=window_minutes)
            cls._instance.event_buffer = deque()
            cls._instance.active_auctions = set()
            cls._instance.auction_starting_prices = {}
            cls._instance.auction_latest_bids = {}
        return cls._instance

    def ingest_bid_event(self, event: BidPlacedEvent) -> Dict[str, Any]:
        """Ingest and process a live bid event through the sliding window."""
        now = event.timestamp
        self.event_buffer.append(event)
        self.active_auctions.add(event.auction_id)

        if event.auction_id not in self.auction_starting_prices and event.base_price_lkr > 0:
            self.auction_starting_prices[event.auction_id] = event.base_price_lkr
        self.auction_latest_bids[event.auction_id] = event.bid_amount_lkr

        # Evict expired events outside the sliding window
        cutoff = now - self.window_duration
        while self.event_buffer and self.event_buffer[0].timestamp < cutoff:
            self.event_buffer.popleft()

        metrics = self._compute_window_metrics(now)
        self._flush_telemetry_to_duckdb(metrics)
        return metrics

    def _compute_window_metrics(self, current_time: datetime) -> Dict[str, Any]:
        """Compute rolling 5-minute sliding window aggregations."""
        total_events = len(self.event_buffer)
        window_minutes_float = max(self.window_duration.total_seconds() / 60.0, 1.0)
        bids_per_minute = round(total_events / window_minutes_float, 2)

        total_volume = sum(e.bid_amount_lkr for e in self.event_buffer)

        # Calculate average price appreciation % over starting prices
        appreciation_rates = []
        for auc_id, latest_bid in self.auction_latest_bids.items():
            base_price = self.auction_starting_prices.get(auc_id, 0.0)
            if base_price > 0:
                rate = ((latest_bid - base_price) / base_price) * 100.0
                appreciation_rates.append(rate)

        avg_price_surge = round(sum(appreciation_rates) / len(appreciation_rates), 2) if appreciation_rates else 0.0

        return {
            "window_start_time": current_time - self.window_duration,
            "window_end_time": current_time,
            "bids_per_minute": bids_per_minute,
            "active_live_auctions": len(self.active_auctions),
            "live_price_appreciation_pct": avg_price_surge,
            "total_live_bid_volume_lkr": round(total_volume, 2),
            "last_event_timestamp": current_time
        }

    def _flush_telemetry_to_duckdb(self, metrics: Dict[str, Any]) -> None:
        """Persist latest real-time telemetry snapshot into DuckDB OLAP mart."""
        try:
            wh = get_warehouse()
            conn = wh.get_connection()
            conn.execute("""
                INSERT OR REPLACE INTO mart_realtime_auction_telemetry (
                    window_id, window_start_time, window_end_time, bids_per_minute,
                    active_live_auctions, live_price_appreciation_pct,
                    total_live_bid_volume_lkr, last_event_timestamp, updated_at
                ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            """, [
                metrics["window_start_time"], metrics["window_end_time"],
                metrics["bids_per_minute"], metrics["active_live_auctions"],
                metrics["live_price_appreciation_pct"], metrics["total_live_bid_volume_lkr"],
                metrics["last_event_timestamp"]
            ])
            conn.close()
        except Exception as e:
            logger.error(f"Error flushing stream metrics to DuckDB: {e}")

    def simulate_live_auction_stream(self, num_events: int = 25) -> List[Dict[str, Any]]:
        """
        Simulate an active stream of incoming bids for testing and demonstration.
        """
        grades = ["BOP", "BOPF", "OP", "PEKOE"]
        simulated_auction_ids = [f"live-auc-{i}" for i in range(1, 4)]
        buyer_ids = [f"buyer-{i}" for i in range(1, 6)]

        for auc_id in simulated_auction_ids:
            self.auction_starting_prices[auc_id] = 1200.0

        results = []
        base_time = datetime.utcnow() - timedelta(minutes=4)

        for i in range(num_events):
            auc_id = random.choice(simulated_auction_ids)
            base_p = self.auction_starting_prices[auc_id]
            curr_bid = self.auction_latest_bids.get(auc_id, base_p) + random.uniform(25.0, 75.0)

            event = BidPlacedEvent(
                auction_id=auc_id,
                buyer_id=random.choice(buyer_ids),
                bid_amount_lkr=round(curr_bid, 2),
                base_price_lkr=base_p,
                tea_grade=random.choice(grades),
                timestamp=base_time + timedelta(seconds=i * 10)
            )
            metrics = self.ingest_bid_event(event)
            results.append(metrics)

        logger.info(f"Successfully simulated {num_events} live auction stream events.")
        return results


def get_stream_processor() -> AuctionStreamProcessor:
    """Dependency provider for stream processor."""
    return AuctionStreamProcessor()
