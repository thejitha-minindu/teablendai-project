from datetime import timedelta
from enum import Enum

class AuctionTimingConstants:
    """Centralized auction timing configuration"""
    BID_EXTENSION_THRESHOLD = timedelta(seconds=10)
    GRACE_PERIOD = timedelta(seconds=40)
    WAIT_BEFORE_WIN = timedelta(seconds=10)
    BACKGROUND_TASK_INTERVAL = 0.5

class BidConstraints:
    """Business rules for bid placement"""
    MINIMUM_BID_INCREMENT = 100.0
    MINIMUM_BID_AMOUNT = 0.0

class AuctionEventType(str, Enum):
    BID_CREATED = "BID_CREATED"
    BID_UPDATED = "BID_UPDATED"
    AUCTION_WON = "AUCTION_WON"
    AUCTION_ENDED = "AUCTION_ENDED"
    AUCTION_STARTED = "AUCTION_STARTED"
