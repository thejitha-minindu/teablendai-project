"""Live auction event service - publishes events to WebSocket subscribers."""
from src.domain.services.buyer.connection_manager import IConnectionManager
from src.domain.events.auction_event import AuctionEvent
import asyncio
import logging

logger = logging.getLogger(__name__)

class LiveAuctionEventService:
    """Publishes auction events to connected clients via WebSocket"""
    
    def __init__(self, manager: IConnectionManager):
        self.manager = manager
        self._processor_task = None
    
    async def publish_event(self, event: AuctionEvent) -> None:
        """Direct event broadcast (for non-bid events)"""
        try:
            message = event.model_dump(mode='json')
            await self.manager.broadcast(
                room_id=event.auction_id,
                message=message
            )
            logger.info(f"Event published: {event.event_type} for {event.auction_id}")
        except Exception as e:
            logger.error(f"Publish failed {event.event_type}: {e}")
            raise
    
    async def broadcast_aggregated(self, auction_id: str, message: dict) -> None:
        """Broadcast aggregated bid update to all clients"""
        try:
            await self.manager.broadcast(room_id=auction_id, message=message)
            logger.debug(f"Aggregated broadcast for {auction_id}: {message.get('bid_count')} bids")
        except Exception as e:
            logger.error(f"Broadcast failed for {auction_id}: {e}")
