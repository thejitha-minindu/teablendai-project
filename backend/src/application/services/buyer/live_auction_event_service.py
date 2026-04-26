"""Live auction event service - publishes events to WebSocket subscribers."""
from src.domain.services.buyer.connection_manager import IConnectionManager
from src.domain.events.auction_event import AuctionEvent
import logging

logger = logging.getLogger(__name__)

class LiveAuctionEventService:
    """Publishes auction events to connected clients via WebSocket"""
    
    def __init__(self, manager: IConnectionManager):
        self.manager = manager
    
    async def publish_event(self, event: AuctionEvent) -> None:
        """Publish an auction event to all subscribers"""
        try:
            message = event.model_dump(mode='json')
            await self.manager.broadcast(
                room_id=event.auction_id,
                message=message
            )
            logger.info(
                f"Event published: {event.event_type} for auction {event.auction_id}"
            )
        except Exception as e:
            logger.error(
                f"Failed to publish event {event.event_type} for auction {event.auction_id}: {e}",
                exc_info=True
            )
            raise
