"""Regression coverage for HTTP responsiveness while database work stalls."""
import asyncio
import threading
from datetime import datetime, timezone, timedelta
from types import SimpleNamespace
from uuid import uuid4
from unittest.mock import Mock, AsyncMock, MagicMock

import httpx
import pytest
from fastapi import FastAPI

from src.application.use_cases.buyer.auction_manager import AuctionManager
from src.application.use_cases.buyer.outbox_publisher import OutboxPublisher, PendingEvent
from src.domain.events.auction_event import AuctionEvent
from src.domain.constants.auction_constants import AuctionEventType
from src.presentation.routers.v1.health import router as health_router
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.models.order import Order, WinsAuction
from src.domain.models.auction_status import AuctionStatus


@pytest.mark.asyncio
@pytest.mark.parametrize("component", ["auction", "outbox"])
async def test_health_responds_while_database_worker_is_blocked(monkeypatch, component):
    entered = threading.Event()
    release = threading.Event()
    main_thread = threading.get_ident()
    worker_threads = []

    def stalled_database():
        worker_threads.append(threading.get_ident())
        entered.set()
        if not release.wait(timeout=3):
            raise AssertionError("Database work blocked the event loop")
        return []

    if component == "auction":
        instance = AuctionManager()
        monkeypatch.setattr(instance, "_process_auctions_sync", stalled_database)
        operation = instance.process_auctions()
    else:
        instance = OutboxPublisher(Mock())
        monkeypatch.setattr(instance, "_load_pending", stalled_database)
        operation = instance._publish_pending()

    task = asyncio.create_task(operation)
    try:
        async def wait_for_worker():
            while not entered.is_set():
                await asyncio.sleep(0.001)

        await asyncio.wait_for(wait_for_worker(), timeout=1)
        assert len(worker_threads) == 1
        assert worker_threads[0] != main_thread
        app = FastAPI()
        app.include_router(health_router, prefix="/api/v1")
        async with httpx.AsyncClient(transport=httpx.ASGITransport(app=app), base_url="http://test") as client:
            response = await asyncio.wait_for(client.get("/api/v1/health"), timeout=0.5)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}
        assert not task.done(), "The database should still be stalled during the health check"
    finally:
        release.set()
        await task


@pytest.mark.asyncio
async def test_auction_broadcast_runs_on_http_event_loop(monkeypatch):
    import src.application.use_cases.buyer.auction_manager as module

    main_thread = threading.get_ident()
    main_loop = asyncio.get_running_loop()
    event = AuctionEvent(event_id="evt-1", auction_id="auc-1", event_type=AuctionEventType.AUCTION_WON,
                         occurred_at=datetime.now(timezone.utc), data={"winner_id": "buyer-1", "final_price": 150})

    def database_work():
        assert threading.get_ident() != main_thread
        return [event]

    delivered = []

    class EventService:
        def __init__(self, manager):
            pass

        async def publish_event(self, value):
            assert threading.get_ident() == main_thread
            assert asyncio.get_running_loop() is main_loop
            delivered.append(value)

    instance = AuctionManager()
    monkeypatch.setattr(instance, "_process_auctions_sync", database_work)
    monkeypatch.setattr(module, "LiveAuctionEventService", EventService)
    await instance.process_auctions()
    assert delivered == [event]


@pytest.mark.asyncio
async def test_outbox_keeps_sockets_on_loop_and_acknowledges_in_worker(monkeypatch):
    main_thread = threading.get_ident()
    calls = []

    class Manager:
        async def broadcast(self, room_id, message):
            assert threading.get_ident() == main_thread
            calls.append((room_id, message))

    publisher = OutboxPublisher(Mock(), Manager())

    def load():
        assert threading.get_ident() != main_thread
        return [PendingEvent("evt-1", "auc-1", '{"amount":150}')]

    recorded = []

    def record(deliveries):
        assert threading.get_ident() != main_thread
        recorded.extend(deliveries)

    monkeypatch.setattr(publisher, "_load_pending", load)
    monkeypatch.setattr(publisher, "_record_deliveries", record)
    await publisher._publish_pending()
    assert calls == [("auc-1", {"amount": 150})]
    assert recorded == [("evt-1", None)]


@pytest.mark.asyncio
async def test_outbox_stop_wakes_poll_sleep_and_start_is_idempotent(monkeypatch):
    publisher = OutboxPublisher(Mock(), poll_interval=60)
    polled = asyncio.Event()

    async def publish():
        polled.set()

    monkeypatch.setattr(publisher, "_publish_pending", publish)
    await publisher.start()
    task = publisher._task
    await publisher.start()
    assert publisher._task is task
    await asyncio.wait_for(polled.wait(), timeout=1)
    await asyncio.wait_for(publisher.stop(), timeout=0.5)
    assert task.done()
    assert publisher._task is None


@pytest.mark.asyncio
async def test_auction_session_is_created_rolled_back_and_closed_in_worker(monkeypatch):
    import src.application.use_cases.buyer.auction_manager as module

    main_thread = threading.get_ident()
    calls = []

    class Session:
        def __init__(self):
            self.owner = threading.get_ident()
            assert self.owner != main_thread
            calls.append("created")

        def query(self, model):
            assert threading.get_ident() == self.owner
            raise RuntimeError("Simulated SQL timeout")

        def rollback(self):
            assert threading.get_ident() == self.owner
            calls.append("rollback")

        def close(self):
            assert threading.get_ident() == self.owner
            calls.append("closed")

    monkeypatch.setattr(module, "SessionLocal", Session)
    await AuctionManager().process_auctions()
    assert calls == ["created", "rollback", "closed"]


def query_result(*, rows=None, first=None):
    query = Mock()
    query.filter.return_value = query
    query.order_by.return_value = query
    query.all.return_value = rows or []
    query.first.return_value = first
    return query


def test_expired_auction_still_marks_winner_and_returns_event():
    now = datetime.now(timezone.utc)
    auction = SimpleNamespace(auction_id=uuid4(), buyer=None, sold_price=None,
                              start_time=now-timedelta(minutes=2), duration=1)
    bid = SimpleNamespace(buyer_id=uuid4(), bid_amount=2500, bid_time=now-timedelta(seconds=20))
    query = query_result(rows=[auction])
    query.first.side_effect = [bid, SimpleNamespace(user_name="Test buyer")]
    db = Mock()
    db.query.return_value = query
    events = []
    AuctionManager()._process_live_auctions(db, now, events)
    assert auction.buyer == bid.buyer_id
    assert auction.sold_price == 2500
    db.commit.assert_called_once()
    assert len(events) == 1
    assert events[0].event_type == AuctionEventType.AUCTION_WON
    assert events[0].data["winner_name"] == "Test buyer"


def test_grace_period_closure_creates_order_and_winner_link():
    now = datetime.now(timezone.utc)
    auction = SimpleNamespace(auction_id=uuid4(), buyer=uuid4(), seller_id=uuid4(),
                              sold_price=2500, status=AuctionStatus.LIVE.value)
    queries = {Auction: query_result(rows=[auction]),
               Bid: query_result(first=SimpleNamespace(bid_time=now-timedelta(seconds=60))),
               Order: query_result(first=None)}
    db = Mock()
    db.query.side_effect = lambda model: queries[model]
    events = []
    AuctionManager()._process_won_auctions(db, now, events)
    assert auction.status == AuctionStatus.HISTORY.value
    created_order, created_link = [call.args[0] for call in db.add.call_args_list]
    assert isinstance(created_order, Order)
    assert isinstance(created_link, WinsAuction)
    assert created_link.order_id == created_order.order_id
    assert created_order.auction_id == auction.auction_id
    db.commit.assert_called_once()
    assert [event.event_type for event in events] == [AuctionEventType.AUCTION_ENDED]


@pytest.mark.asyncio
async def test_production_startup_does_not_wait_for_schema_changes_or_ai_warmup(monkeypatch):
    import src.application.main as module

    monkeypatch.setattr(module, "settings", SimpleNamespace(
        RUNTIME_SCHEMA_COMPATIBILITY_ENABLED=False, MCP_WARMUP_ON_STARTUP=False,
        ANALYTICS_SCHEDULER_ENABLED=False, INIT_DB_ON_STARTUP=False))
    schema = Mock()
    outbox_schema = Mock()
    mcp = AsyncMock()
    session = MagicMock()
    monkeypatch.setattr(module, "ensure_runtime_schema_compatibility", schema)
    monkeypatch.setattr(module, "ensure_outbox_table_exists", outbox_schema)
    monkeypatch.setattr(module, "get_mcp_client", mcp)
    monkeypatch.setattr(module, "SessionLocal", session)
    monkeypatch.setattr(module, "sync_auction_statuses", Mock())
    monkeypatch.setattr(module, "auction_manager", SimpleNamespace(start_background_task=AsyncMock(), stop=Mock()))
    monkeypatch.setattr(module, "init_outbox_publisher", Mock())
    monkeypatch.setattr(module, "start_outbox_publisher", AsyncMock())
    monkeypatch.setattr(module, "stop_outbox_publisher", AsyncMock())
    app = SimpleNamespace(state=SimpleNamespace())
    async with module.lifespan(app):
        assert app.state.mcp_client is None
    schema.assert_not_called()
    outbox_schema.assert_not_called()
    mcp.assert_not_called()
    session.return_value.__exit__.assert_called_once()
