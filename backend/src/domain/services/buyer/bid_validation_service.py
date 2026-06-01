from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.constants.auction_constants import BidConstraints
import logging

logger = logging.getLogger(__name__)

class BidValidationException(Exception):
    pass

class BidValidationService:
    # Service for validating bid placement rules and constraints 
    @staticmethod
    def validate_bid_amount(bid_amount: float, highest_bid: Bid | None, 
                          base_price: float) -> None:
        try:
            # Validate that bid amount meets minimum requirements
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
        except BidValidationException:
            # validation errors are expected to propagate
            raise
        except Exception as e:
            logger.exception("Unexpected error validating bid amount")
            raise BidValidationException(str(e)) from e
    
    # @staticmethod
    # def validate_buyer_is_not_winner(buyer_id: str, current_highest_bidder: str | None) -> None:
    #     pass
    
    # Validate auction is in state to accept bids
    @staticmethod
    def validate_auction_accepts_bids(auction: Auction, is_expired: bool) -> None:
        from src.domain.models.auction_status import AuctionStatus
        try:
            status = auction.status

            if status == AuctionStatus.SCHEDULE.value:
                raise BidValidationException("Auction has not started yet")

            if status == AuctionStatus.HISTORY.value:
                raise BidValidationException("Auction has ended")

            if is_expired and auction.buyer:
                raise BidValidationException("Auction has been won - no more bids accepted")
        except BidValidationException:
            raise
        except Exception as e:
            logger.exception("Unexpected error validating auction state for bids")
            raise BidValidationException(str(e)) from e
