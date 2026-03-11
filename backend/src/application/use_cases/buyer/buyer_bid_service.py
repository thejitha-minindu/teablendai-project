"""
Buyer Bid Service
Handles bid placement with auction timer extension logic
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from uuid import uuid4
import logging
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.infrastructure.repositories.bid_repository import BidRepository

logger = logging.getLogger(__name__)

EXTENSION_THRESHOLD = 10  # If remaining <= 10s, extend
EXTENSION_TIME = 10  # Extend by 10 seconds


class BuyerBidService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = BidRepository(db)
    
    def place_bid(self, auction_id: str, buyer_id: str, bid_amount: float):
        """
        Place a bid with auction timer extension logic
        
        1. First bid → start auction (end_time = now + duration)
        2. Subsequent bids:
           - If remaining <= 10s → extend by 10s
           - Otherwise → normal bid
        3. Update last_bid_time
        4. Increment bid_count
        """
        current_time = datetime.utcnow()
        
        # Get auction
        auction = self.db.query(Auction).filter(
            Auction.auction_id == auction_id
        ).first()
        
        if not auction:
            raise ValueError(f"Auction {auction_id} not found")
        
        # Validation
        if auction.status == "Closed":
            raise ValueError("❌ Auction has ended (Closed)")
        
        if auction.status == "Won":
            raise ValueError("❌ Auction is won, no more bids accepted")
        
        # ---- FIRST BID? START AUCTION ----
        extension_happened = False
        
        if auction.status == "Scheduled":
            auction.status = "Live"
            auction.end_time = current_time + timedelta(seconds=auction.duration)
            logger.info(f"✅ Auction LIVE: {auction_id}")
            logger.info(f"   End time: {auction.end_time}")
        
        # ---- CHECK IF PAST END TIME ----
        if current_time > auction.end_time:
            raise ValueError("❌ Auction end_time has passed - no more bids accepted")
        
        # ---- EXTENSION LOGIC ----
        if auction.end_time:
            time_remaining = (auction.end_time - current_time).total_seconds()
            
            if time_remaining <= EXTENSION_THRESHOLD:
                # Extend by EXTENSION_TIME seconds
                old_end_time = auction.end_time
                auction.end_time = current_time + timedelta(seconds=EXTENSION_TIME)
                
                logger.info(f"⏱️  EXTENDED: {old_end_time} → {auction.end_time}")
                extension_happened = True
        
        # ---- ACCEPT THE BID ----
        new_bid = Bid(
            bid_id=uuid4(),
            auction_id=auction_id,
            buyer_id=buyer_id,
            bid_amount=bid_amount,
            bid_time=current_time
        )
        
        auction.last_bid_time = current_time
        auction.bid_count += 1
        
        self.db.add(new_bid)
        self.db.commit()
        
        logger.info(f"✅ Bid #{auction.bid_count} accepted")
        logger.info(f"   Amount: ${bid_amount}")
        logger.info(f"   Remaining: {(auction.end_time - current_time).total_seconds():.1f}s")
        
        return {
            "bid": new_bid,
            "auction": auction,
            "remaining_seconds": (auction.end_time - current_time).total_seconds(),
            "extended": extension_happened,
            "bid_count": auction.bid_count
        }
    
    def get_auction_state(self, auction_id: str):
        """Get current auction state for timer sync"""
        auction = self.db.query(Auction).filter(
            Auction.auction_id == auction_id
        ).first()
        
        if not auction:
            raise ValueError(f"Auction {auction_id} not found")
        
        current_time = datetime.utcnow()
        remaining_seconds = 0
        
        if auction.status == "Live" and auction.end_time:
            remaining = (auction.end_time - current_time).total_seconds()
            remaining_seconds = max(0, remaining)
        elif auction.status == "Won" and auction.final_end_time:
            remaining = (auction.final_end_time - current_time).total_seconds()
            remaining_seconds = max(0, remaining)
        
        # Get highest bid
        highest_bid = self.db.query(Bid).filter(
            Bid.auction_id == auction_id
        ).order_by(Bid.bid_amount.desc()).first()
        
        return {
            "auction_id": str(auction.auction_id),
            "status": auction.status,
            "remaining_seconds": remaining_seconds,
            "bid_count": auction.bid_count,
            "highest_bid": highest_bid.bid_amount if highest_bid else auction.base_price,
            "highest_bidder": str(highest_bid.buyer_id) if highest_bid else None,
            "winning_time": auction.winning_time.isoformat() if auction.winning_time else None,
            "final_price": auction.sold_price,
            "winner": auction.buyer
        }
