from datetime import datetime, timezone
from uuid import uuid4

from src.application.schemas.buyer.live_auction_socket import BidData, LiveWsEvent
from src.domain.services.buyer.connection_manager import IConnectionManager


class BidRealtimeService:
    def __init__(self, manager: IConnectionManager):
        self.manager = manager

    async def broadcast_bid_created(self, bid) -> None:
        auction_id = str(bid.auction_id)
        event = LiveWsEvent(
            event_id=uuid4(),
            event_type="BID_CREATED",
            auction_id=bid.auction_id,
            occurred_at=datetime.now(timezone.utc),
            data=BidData(
                bid_id=bid.bid_id,
                auction_id=bid.auction_id,
                bid_amount=bid.bid_amount,
                bid_time=bid.bid_time,
                buyer_id=bid.buyer_id,
            ),
        )

        await self.manager.broadcast(
            room_id=auction_id,
            message=event.model_dump(mode="json"),
        )
