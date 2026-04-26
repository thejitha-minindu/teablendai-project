from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from src.application.schemas.buyer.bid import BidCreateRequest, Bid
from src.application.services.buyer.bid_service import BidService
from src.application.services.buyer.live_auction_event_service import LiveAuctionEventService
from src.infrastructure.database.base import get_db
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager
from src.application.dependencies import get_current_buyer, get_current_user
from src.domain.models.user import User
from src.domain.services.rate_limiter import rate_limiter
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bids", tags=["bids"])

def get_bid_service(db: Session = Depends(get_db)) -> BidService:
    return BidService(db)

def get_event_service() -> LiveAuctionEventService:
    return LiveAuctionEventService(auction_ws_manager)


@router.post("", response_model=Bid)
async def create_bid(
    bid_request: BidCreateRequest,
    service: BidService = Depends(get_bid_service),
    event_service: LiveAuctionEventService = Depends(get_event_service),
    current_user: User = Depends(get_current_buyer),
):
    """Place a new bid with rate limiting"""
    allowed, wait_time = rate_limiter.is_allowed(str(current_user.user_id))
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many bids. Try again in {wait_time:.1f}s",
            headers={"Retry-After": str(int(wait_time) + 1)}
        )
    
    first_name = current_user.first_name or ""
    last_name = current_user.last_name or ""
    real_name = f"{first_name} {last_name}".strip()
    if not real_name:
        real_name = current_user.user_name

    result = service.place_bid(
        auction_id=str(bid_request.auction_id),
        buyer_id=str(current_user.user_id),
        bid_amount=bid_request.bid_amount,
        buyer_name=real_name
    )
    
    bid_data = result["bid"]
    event = result["event"]
    

    await event_service.publish_event(event)
    
    logger.info(f"Bid placed: {bid_data.bid_amount} by {real_name}")
    return bid_data


@router.get("", response_model=List[Bid])
def list_bids(
    user_id: Optional[str] = None,
    auction_id: Optional[str] = None,
    min_amount: Optional[float] = None,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """List bids with optional filters"""
    return service.list_bids(user_id=user_id, auction_id=auction_id, min_amount=min_amount)


@router.get("/{bid_id}", response_model=Bid)
def get_bid(
    bid_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """Get bid details by ID"""
    bid = service.get_bid(bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return bid


@router.get("/auction/{auction_id}/bids", response_model=List[Bid])
def get_bids_by_auction(
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_user),
):
    """List all bids for an auction with buyer names enriched"""
    bids = service.list_bids_by_auction_with_names(auction_id=auction_id)
    return bids


@router.get("/{user_id}/auction/{auction_id}", response_model=List[Bid])
def get_bids_by_user_auction(
    user_id: str,
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """List bids by user for a specific auction"""
    return service.list_bids_by_user_auction(user_id=str(current_user.user_id), auction_id=auction_id)


@router.get("/auction/{auction_id}/highest", response_model=Bid)
def get_highest_bid(
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_user),
):
    """Get the highest bid for an auction"""
    bid = service.get_highest_bid_for_auction(auction_id=auction_id)
    if not bid:
        raise HTTPException(status_code=404, detail="No bids found for this auction")
    return bid