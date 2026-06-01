import asyncio
import logging
from uuid import uuid4
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager as connection_manager
from src.domain.events.auction_event import AuctionEvent
from src.infrastructure.database.base import SessionLocal
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.models.user import User
from src.domain.models.order import Order, OrderStatus
from src.domain.models.auction_status import AuctionStatus
from src.domain.constants.auction_constants import AuctionTimingConstants, AuctionEventType
from src.domain.services.buyer.auction_timing_service import AuctionTimingService
from src.application.use_cases.buyer.live_auction_event_service import LiveAuctionEventService

logger = logging.getLogger(__name__)

class AuctionManager:
    # Manages background auction state transitions - core business logic for auction lifecycle
    
    def __init__(self):
        self.running = False
        
    async def start_background_task(self):
        # Start background task for auction state management
        self.running = True
        logger.info(f"Auction manager background task started ({AuctionTimingConstants.BACKGROUND_TASK_INTERVAL}s intervals)")
        
        while self.running:
            try:
                await self.process_auctions()
                await asyncio.sleep(AuctionTimingConstants.BACKGROUND_TASK_INTERVAL)
            except Exception as e:
                logger.error(f"Error in auction manager: {e}", exc_info=True)
                await asyncio.sleep(AuctionTimingConstants.BACKGROUND_TASK_INTERVAL)
    
    async def process_auctions(self):
        # Process all auctions for state transitions
        db = SessionLocal()
        try:
            current_time = datetime.now(timezone.utc)
            
            # Process SCHEDULE -> LIVE transition
            await self._process_scheduled_auctions(db, current_time)
            
            # Process LIVE auctions (waiting for winner)
            await self._process_live_auctions(db, current_time)
            
            # Process WON auctions (in grace period)
            await self._process_won_auctions(db, current_time)
            
        except Exception as e:
            logger.error(f"Error processing auctions: {e}", exc_info=True)
        finally:
            db.close()
    
    async def _process_scheduled_auctions(self, db: Session, current_time: datetime):
        # Transition scheduled auctions to live when start time is reached
        scheduled_auctions = db.query(Auction).filter(
            Auction.status == AuctionStatus.SCHEDULE.value
        ).all()
        
        for auction in scheduled_auctions:
            if current_time >= auction.start_time:
                auction.status = AuctionStatus.LIVE.value
                auction.start_time = current_time  # Reset to actual LIVE start time for duration calculation
                db.commit()
                logger.info(f"Auction transitioned to LIVE: {auction.auction_id}")
    
    async def _process_live_auctions(self, db: Session, current_time: datetime):
        # Check if live auctions should transition to WON
        live_auctions = db.query(Auction).filter(
            Auction.status == AuctionStatus.LIVE.value,
            Auction.buyer.is_(None)
        ).all()
                
        for auction in live_auctions:
            logger.debug(f"Processing auction {auction.auction_id}")
            is_expired = AuctionTimingService.is_auction_expired(auction, current_time)
            logger.debug(f"Auction {auction.auction_id} expired: {is_expired}")
            
            if is_expired:
                # Get highest bid
                highest_bid = db.query(Bid).filter(
                    Bid.auction_id == auction.auction_id
                ).order_by(Bid.bid_amount.desc()).first()
                
                logger.debug(f"Highest bid for {auction.auction_id}: {highest_bid.bid_amount if highest_bid else None}")  # ✅ DEBUG
                
                if highest_bid:
                    time_since_last_bid = (current_time - highest_bid.bid_time).total_seconds()
                    wait_threshold = AuctionTimingConstants.WAIT_BEFORE_WIN.total_seconds()
                    logger.debug(f"Time since last bid: {time_since_last_bid}s, Threshold: {wait_threshold}s")  # ✅ DEBUG
                    
                    if time_since_last_bid >= wait_threshold:
                        logger.info(f"Marking winner for auction {auction.auction_id}")  # ✅ KEEP INFO - important event
                        await self._mark_winner(auction, highest_bid, db)
    
    async def _process_won_auctions(self, db: Session, current_time: datetime):
        # Check if won auctions should transition to HISTORY (after grace period)
        won_auctions = db.query(Auction).filter(
            Auction.status == AuctionStatus.LIVE.value,
            Auction.buyer.isnot(None)
        ).all()
        
        event_service = LiveAuctionEventService(connection_manager)
        
        for auction in won_auctions:
            # Get last bid time
            last_bid = db.query(Bid).filter(
                Bid.auction_id == auction.auction_id
            ).order_by(Bid.bid_time.desc()).first()
            
            if last_bid:
                # Wait 40 seconds after last bid
                is_grace_expired = AuctionTimingService.is_grace_period_expired(
                    last_bid.bid_time, 
                    current_time
                )
                
                if is_grace_expired:
                    await self._close_auction(auction, db)
                    
                    event = AuctionEvent(
                        event_id=str(uuid4()),
                        event_type=AuctionEventType.AUCTION_ENDED,
                        auction_id=str(auction.auction_id),
                        occurred_at=datetime.now(timezone.utc),
                        data={
                            "winner_id": str(auction.buyer),
                            "final_price": auction.sold_price,
                        }
                    )
                    try:
                        await event_service.publish_event(event)
                        logger.info(f"AUCTION_ENDED event published: {auction.auction_id}")
                    except Exception as e:
                        logger.error(f"Failed to publish AUCTION_ENDED for {auction.auction_id}: {e}")
    
    async def _mark_winner(self, auction: Auction, highest_bid: Bid, db: Session):
        # Mark auction winner after waiting period expires
        try:
            auction.buyer = highest_bid.buyer_id
            auction.sold_price = highest_bid.bid_amount
            db.commit()
            
            logger.info(f"Auction winner marked: {auction.auction_id}")
            logger.info(f"  Winner: {highest_bid.buyer_id}, Amount: {highest_bid.bid_amount}")
            
            buyer_user = db.query(User).filter(User.user_id == highest_bid.buyer_id).first()
            buyer_name = buyer_user.user_name if buyer_user else None
            
            event_service = LiveAuctionEventService(connection_manager)
            event = AuctionEvent(
                event_id=str(uuid4()),
                event_type=AuctionEventType.AUCTION_WON,
                auction_id=str(auction.auction_id),
                occurred_at=datetime.now(timezone.utc),
                data={
                    "winner_id": str(highest_bid.buyer_id),
                    "winner_name": buyer_name,
                    "final_price": highest_bid.bid_amount,
                }
            )
            await event_service.publish_event(event)
            logger.info(f"AUCTION_WON event published for {auction.auction_id}")
            
        except Exception as e:
            logger.error(f"Error marking winner for {auction.auction_id}: {e}", exc_info=True)
            db.rollback()
    
    async def _close_auction(self, auction: Auction, db: Session):
        # Close auction
        try:
            from src.domain.models.order import WinsAuction
            
            auction.status = AuctionStatus.HISTORY.value
            
            if auction.buyer:
                existing_order = db.query(Order).filter(
                    Order.auction_id == auction.auction_id
                ).first()
                
                if not existing_order:
                    order = Order(
                        order_id=str(uuid4()),
                        user_id=auction.buyer,
                        auction_id=auction.auction_id,
                        total_amount=auction.sold_price,
                        order_date=datetime.now(timezone.utc),
                        status=OrderStatus.completed
                    )
                    db.add(order)
                    db.flush()
                    
                    wins_entry = WinsAuction(
                        auction_id=auction.auction_id,
                        user_id=auction.buyer,
                        order_id=order.order_id
                    )
                    db.add(wins_entry)
                    logger.info(f"Order + WinsAuction created: {auction.auction_id} → {auction.buyer}")
            else:
                logger.info(f"Auction closed with NO WINNER: {auction.auction_id}")
            
            db.commit()
            logger.info(f"Auction closed: {auction.auction_id} → HISTORY")
            
        except Exception as e:
            logger.error(f"Error closing auction {auction.auction_id}: {e}", exc_info=True)
            db.rollback()
            raise
    
    def stop(self):
        # Stop the background task
        self.running = False
        logger.info("Auction manager stopped")

auction_manager = AuctionManager()
