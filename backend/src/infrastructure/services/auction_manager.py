import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.infrastructure.database.base import SessionLocal
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.models.order import Order, OrderStatus

logger = logging.getLogger(__name__)

GRACE_PERIOD_SECONDS = 30
WAIT_BEFORE_WIN = 10


class AuctionManager:
    def __init__(self):
        self.running = False
        
    async def start_background_task(self):

        # This method should be called once when the application starts
        self.running = True
        logger.info("Auction manager background task started (0.5s intervals)")
        
        while self.running:
            try:
                await self.process_auctions()
                await asyncio.sleep(0.5)
            except Exception as e:
                logger.error(f"Error in auction manager: {e}", exc_info=True)
                await asyncio.sleep(0.5)
    
    async def process_auctions(self):

        db = SessionLocal()
        try:
            current_time = datetime.utcnow()
            
            scheduled_auctions = db.query(Auction).filter(
                Auction.status == "Scheduled"
            ).all()
            
            for auction in scheduled_auctions:
                if current_time >= auction.start_time:
                    auction.status = "Live"
                    db.commit()
                    logger.info(f"Auction activated: {auction.auction_id}")
            
            live_auctions = db.query(Auction).filter(
                Auction.status == "Live",
                Auction.buyer.is_(None)
            ).all()
            
            for auction in live_auctions:
                # Calculate end_time dynamically from start_time + duration (duration is in hours)
                auction_end_time = auction.start_time + timedelta(hours=auction.duration)
                
                if current_time >= auction_end_time:

                    # Get highest bid
                    highest_bid = db.query(Bid).filter(
                        Bid.auction_id == auction.auction_id
                    ).order_by(Bid.bid_amount.desc()).first()
                    
                    if highest_bid:
                        time_since_last_bid = (current_time - highest_bid.bid_time).total_seconds()
                        
                        if time_since_last_bid >= WAIT_BEFORE_WIN:
                            await self._mark_winner(auction, highest_bid, db)
            
            won_auctions = db.query(Auction).filter(
                Auction.status == "Live",
                Auction.buyer.isnot(None)
            ).all()
            
            for auction in won_auctions:

                # Get last bid time
                last_bid = db.query(Bid).filter(
                    Bid.auction_id == auction.auction_id
                ).order_by(Bid.bid_time.desc()).first()
                
                if last_bid:
                    grace_end_time = last_bid.bid_time + timedelta(seconds=40)
                    
                    if current_time >= grace_end_time:
                        # Grace period expired = fully closed
                        await self._close_auction(auction, db)
        
        except Exception as e:
            logger.error(f"Error processing auctions: {e}", exc_info=True)
        finally:
            db.close()
    
    async def _mark_winner(self, auction: Auction, highest_bid: Bid, db: Session):

        # Set buyer and sold price
        try:
            auction.buyer = highest_bid.buyer_id
            auction.sold_price = highest_bid.bid_amount
            
            db.commit()
            
            logger.info(f"   WINNER MARKED: {auction.auction_id}")
            logger.info(f"   Winner: {highest_bid.buyer_id}")
            logger.info(f"   Amount: {highest_bid.bid_amount}")
            logger.info(f"   Grace period: 30 seconds")
        
        except Exception as e:
            logger.error(f"Error marking winner for {auction.auction_id}: {e}")
            db.rollback()
    
    async def _close_auction(self, auction: Auction, db: Session):
        try:
            auction.status = "Closed"
            existing_order = db.query(Order).filter(
                Order.auction_id == auction.auction_id
            ).first()
            
            if not existing_order and auction.buyer:
                order = Order(
                    user_id=auction.buyer,
                    auction_id=auction.auction_id,
                    total_amount=auction.sold_price,
                    order_date=datetime.utcnow(),
                    status=OrderStatus.completed
                )
                db.add(order)
            
            db.commit()
            
            logger.info(f"   AUCTION CLOSED: {auction.auction_id}")
            logger.info(f"   Order confirmed for {auction.buyer}")
        
        except Exception as e:
            logger.error(f"Error closing auction {auction.auction_id}: {e}")
            db.rollback()
    
    def stop(self):
        self.running = False
        logger.info("Auction manager stopped")

auction_manager = AuctionManager()
