from datetime import datetime, timedelta, timezone
from typing import Optional
from src.domain.models.auction import Auction
from src.domain.constants.auction_constants import AuctionTimingConstants
import logging

logger = logging.getLogger(__name__)

class AuctionTimingService:
    """Manages auction timing calculations"""
    
    @staticmethod
    def calculate_auction_end_time(auction: Auction) -> datetime:
        """Calculate when an auction ends (start_time + duration)"""
        return auction.start_time + timedelta(hours=auction.duration)
    
    @staticmethod
    def get_remaining_time(auction: Auction, current_time: Optional[datetime] = None) -> timedelta:
        """Get time remaining until auction ends"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        end_time = AuctionTimingService.calculate_auction_end_time(auction)
        remaining = end_time - current_time
        return max(remaining, timedelta(0))
    
    @staticmethod
    def is_auction_expired(auction: Auction, current_time: Optional[datetime] = None) -> bool:
        """Check if auction has passed its end time"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        end_time = AuctionTimingService.calculate_auction_end_time(auction)
        return current_time > end_time
    
    @staticmethod
    def should_extend_auction(time_remaining: timedelta) -> bool:
        """Check if auction should extend due to late bid"""
        return time_remaining <= AuctionTimingConstants.BID_EXTENSION_THRESHOLD
    
    @staticmethod
    def calculate_grace_period_end(last_bid_time: datetime) -> datetime:
        """Calculate when grace period expires after winning bid"""
        return last_bid_time + AuctionTimingConstants.GRACE_PERIOD
    
    @staticmethod
    def is_grace_period_expired(last_bid_time: datetime, current_time: Optional[datetime] = None) -> bool:
        """Check if grace period has expired"""
        if current_time is None:
            current_time = datetime.now(timezone.utc)
        
        grace_end = AuctionTimingService.calculate_grace_period_end(last_bid_time)
        return current_time >= grace_end
