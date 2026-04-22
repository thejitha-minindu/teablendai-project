from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.constants.auction_constants import BidConstraints
import logging

logger = logging.getLogger(__name__)

class BidValidationException(Exception):
    """Raised when bid validation fails"""
    pass

class BidValidationService:
    """Validates bids against business rules"""
    
    @staticmethod
    def validate_bid_amount(bid_amount: float, highest_bid: Bid | None, 
                          base_price: float) -> None:
        """Validate that bid amount meets minimum requirements"""
        if bid_amount < BidConstraints.MINIMUM_BID_AMOUNT:
            raise BidValidationException(
                f"Bid amount {bid_amount} is below minimum {BidConstraints.MINIMUM_BID_AMOUNT}"
            )
        
        minimum_next_bid = base_price
        if highest_bid:
            minimum_next_bid = highest_bid.bid_amount + BidConstraints.MINIMUM_BID_INCREMENT
        
        if bid_amount < minimum_next_bid:
            raise BidValidationException(
                f"Bid amount {bid_amount} is below minimum required {minimum_next_bid}"
            )
    
    @staticmethod
    def validate_buyer_is_not_winner(buyer_id: str, current_highest_bidder: str | None) -> None:
        """Prevent same buyer from outbidding themselves (optional business rule)"""
        # This could be a business rule: same buyer can't outbid themselves
        # For now, allowing same buyer to re-bid
        pass
    
    @staticmethod
    def validate_auction_accepts_bids(auction: Auction, is_expired: bool) -> None:
        """Validate auction is in state to accept bids"""
        from src.domain.models.auction_status import AuctionStatus
        
        status = auction.status
        
        if status == AuctionStatus.SCHEDULE.value:
            raise BidValidationException("Auction has not started yet")
        
        if status == AuctionStatus.HISTORY.value:
            raise BidValidationException("Auction has ended")
        
        if is_expired and auction.buyer:
            raise BidValidationException("Auction has been won - no more bids accepted")
