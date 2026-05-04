from datetime import datetime, timezone
from uuid import uuid4
from sqlalchemy.orm import Session
from src.application.schemas.bid import Bid as BidSchema
from src.domain.events.auction_event import AuctionEvent
from src.infrastructure.repositories.bid_repository import BidRepository
from src.infrastructure.repositories.buyer.auction_repository import AuctionRepository
from src.infrastructure.repositories.outbox_repository import OutboxRepository
from src.domain.services.buyer.auction_timing_service import AuctionTimingService
from src.domain.services.buyer.bid_validation_service import BidValidationService
import json
import logging

logger = logging.getLogger(__name__)

class BidPlacementUseCase:
    """Encapsulates the complete bid placement business logic"""
    
    def __init__(self, db: Session):
        self.db = db
        self.bid_repo = BidRepository(db)
        self.auction_repo = AuctionRepository(db)
    
    def execute(self, auction_id: str, buyer_id: str, bid_amount: float, buyer_name: str = None) -> BidSchema:
        current_time = datetime.now(timezone.utc)
        
        try:
            # Lock auction row to prevent concurrent bid race conditions
            auction = self.auction_repo.get_auction_by_id(auction_id, lock_for_update=True)
            if not auction:
                raise ValueError(f"Auction {auction_id} not found")

            # Check if auction time has expired
            is_expired = AuctionTimingService.is_auction_expired(auction, current_time)

            # Validate auction can accept bids
            BidValidationService.validate_auction_accepts_bids(auction, is_expired)

            # Get highest bid for validation
            highest_bid = self.bid_repo.get_highest_bid_for_auction(auction_id)

            # Validate bid amount
            BidValidationService.validate_bid_amount(bid_amount, highest_bid, auction.base_price)

            # Create bid
            bid_id = str(uuid4())
            bid_data = BidSchema(
                bid_id=bid_id,
                auction_id=auction_id,
                buyer_id=buyer_id,
                bid_amount=bid_amount,
                bid_time=current_time
            )

            created_bid = self.bid_repo.create_bid(bid_data)

            # Create event for outbox
            event_id = str(uuid4())
            event = AuctionEvent.bid_created(
                event_id=event_id,
                auction_id=auction_id,
                bid_id=bid_id,
                amount=bid_amount,
                buyer_id=buyer_id,
                bid_time=current_time,
                buyer_name=buyer_name
            )

            # Save to outbox (atomic with bid)
            outbox_repo = OutboxRepository(self.db)
            payload = json.dumps(event.model_dump(mode='json'))
            outbox_repo.save_event(
                event_id=event_id,
                auction_id=auction_id,
                event_type="BID_CREATED",
                payload=payload
            )

            self.db.commit()
            logger.info(f"Bid created: {bid_id} for auction {auction_id}, amount: {bid_amount}")

            return created_bid
        except Exception as e:
            self.db.rollback()
            logger.exception(f"Failed to place bid for auction {auction_id}, buyer {buyer_id}: {e}")
            raise
