"""
Auction Manager Service
Handles background tasks for auction auto-closure
"""
import asyncio
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from src.infrastructure.database.base import SessionLocal
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.models.order import Order, OrderStatus

logger = logging.getLogger(__name__)

GRACE_PERIOD_SECONDS = 30  # 30 seconds after winner declared


class AuctionManager:
    def __init__(self):
        self.running = False
        
    async def start_background_task(self):
        """Start the background auction closer task"""
        self.running = True
        logger.info("✅ Auction manager background task started")
        
        while self.running:
            try:
                await self.process_auctions()
                await asyncio.sleep(1)  # Check every 1 second
            except Exception as e:
                logger.error(f"❌ Error in auction manager: {e}", exc_info=True)
                await asyncio.sleep(1)
    
    async def process_auctions(self):
        """
        Process all auctions:
        1. Check Live auctions - if 10s with no bids → status = "Won"
        2. Check Won auctions - if grace period passed → status = "Closed"
        """
        db = SessionLocal()
        try:
            current_time = datetime.utcnow()
            
            # -------- PROCESS LIVE AUCTIONS --------
            live_auctions = db.query(Auction).filter(
                Auction.status == "Live"
            ).all()
            
            for auction in live_auctions:
                if auction.end_time and current_time >= auction.end_time:
                    # end_time reached, check if enough time passed since last bid
                    if auction.last_bid_time:
                        time_since_last_bid = (current_time - auction.last_bid_time).total_seconds()
                        
                        if time_since_last_bid >= 10:
                            # ✅ NO BID FOR 10 SECONDS = WINNER DECLARED!
                            await self._declare_winner(auction, db, current_time)
            
            # -------- PROCESS WON AUCTIONS --------
            won_auctions = db.query(Auction).filter(
                Auction.status == "Won"
            ).all()
            
            for auction in won_auctions:
                if auction.final_end_time and current_time >= auction.final_end_time:
                    # Grace period expired = fully closed
                    await self._close_auction(auction, db)
        
        except Exception as e:
            logger.error(f"Error processing auctions: {e}", exc_info=True)
        finally:
            db.close()
    
    async def _declare_winner(self, auction: Auction, db: Session, current_time: datetime):
        """
        Declare winner when 10 seconds pass with no bids
        Status: Live → Won
        """
        try:
            # Get highest bid
            highest_bid = db.query(Bid).filter(
                Bid.auction_id == auction.auction_id
            ).order_by(Bid.bid_amount.desc()).first()
            
            if highest_bid:
                auction.status = "Won"
                auction.buyer = str(highest_bid.buyer_id)
                auction.sold_price = highest_bid.bid_amount
                auction.winning_time = auction.last_bid_time
                auction.final_end_time = current_time + timedelta(seconds=GRACE_PERIOD_SECONDS)
                
                db.commit()
                
                logger.info(f"🏆 WINNER DECLARED: {auction.auction_id}")
                logger.info(f"   Winner: {highest_bid.buyer_id}")
                logger.info(f"   Amount: ${highest_bid.bid_amount}")
                logger.info(f"   Grace period until: {auction.final_end_time}")
        
        except Exception as e:
            logger.error(f"Error declaring winner for {auction.auction_id}: {e}")
            db.rollback()
    
    async def _close_auction(self, auction: Auction, db: Session):
        """
        Close auction after grace period expires
        Status: Won → Closed
        """
        try:
            auction.status = "Closed"
            
            # Create order if not exists
            existing_order = db.query(Order).filter(
                Order.auction_id == auction.auction_id
            ).first()
            
            if not existing_order:
                order = Order(
                    user_id=auction.buyer,
                    auction_id=auction.auction_id,
                    total_amount=auction.sold_price,
                    order_date=datetime.utcnow(),
                    status=OrderStatus.completed
                )
                db.add(order)
            
            db.commit()
            
            logger.info(f"✅ AUCTION CLOSED: {auction.auction_id}")
            logger.info(f"   Order confirmed for {auction.buyer}")
        
        except Exception as e:
            logger.error(f"Error closing auction {auction.auction_id}: {e}")
            db.rollback()
    
    def stop(self):
        """Stop the background task"""
        self.running = False
        logger.info("Auction manager stopped")


# Global instance
auction_manager = AuctionManager()
