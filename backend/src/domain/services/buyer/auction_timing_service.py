from datetime import datetime, timedelta, timezone
from typing import Optional
from src.domain.models.auction import Auction
from src.domain.constants.auction_constants import AuctionTimingConstants
import logging

logger = logging.getLogger(__name__)

class AuctionTimingService:
    # Service for calculating auction timing, remaining time, and grace periods 
    @staticmethod
    def calculate_auction_end_time(auction: Auction) -> datetime:
        """Calculate when an auction ends using the stored duration in minutes."""
        return auction.start_time + timedelta(minutes=int(round(float(auction.duration))))
    
    # Calculate the remaining time for an auction
    @staticmethod
    def get_remaining_time(auction: Auction, current_time: Optional[datetime] = None) -> timedelta:
        try:
            if current_time is None:
                current_time = datetime.now(timezone.utc)
            
            end_time = AuctionTimingService.calculate_auction_end_time(auction)
            remaining = end_time - current_time
            return max(remaining, timedelta(0))
        except Exception as e:
            logger.error(f"Error calculating remaining time: {e}")
            raise
    
    # Check if auction has expired based on current time and end time
    @staticmethod
    def is_auction_expired(auction: Auction, current_time: Optional[datetime] = None) -> bool:
        try:
            if current_time is None:
                current_time = datetime.now(timezone.utc)
            
            end_time = AuctionTimingService.calculate_auction_end_time(auction)
            return current_time > end_time
        except Exception as e:
            logger.error(f"Error checking if auction expired: {e}")
            raise
    
    # @staticmethod
    # def should_extend_auction(time_remaining: timedelta) -> bool:
    #     """Check if auction should extend due to late bid"""
    #     return time_remaining <= AuctionTimingConstants.BID_EXTENSION_THRESHOLD
    
    # Calculate new end time if auction is extended due to late bid
    @staticmethod
    def calculate_grace_period_end(last_bid_time: datetime) -> datetime:
        """Calculate when grace period expires after winning bid"""
        try:
            return last_bid_time + AuctionTimingConstants.GRACE_PERIOD
        except (AttributeError, TypeError) as e:
            logger.error(f"Error calculating grace period end: {e}")
            raise
    
    # Check if grace period has expired based on last bid time and current time
    @staticmethod
    def is_grace_period_expired(last_bid_time: datetime, current_time: Optional[datetime] = None) -> bool:
        """Check if grace period has expired"""
        try:
            if current_time is None:
                current_time = datetime.now(timezone.utc)
            
            grace_end = AuctionTimingService.calculate_grace_period_end(last_bid_time)
            return current_time >= grace_end
        except Exception as e:
            logger.error(f"Error checking if grace period expired: {e}")
            raise
