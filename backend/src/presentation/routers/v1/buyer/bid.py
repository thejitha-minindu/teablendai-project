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
from src.domain.services.buyer.bid_validation_service import BidValidationException
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bids", tags=["bids"])

def get_bid_service(db: Session = Depends(get_db)):
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
    """Place a new bid with event publishing"""
    try:
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
        
        # Publish event asynchronously
        asyncio.create_task(event_service.publish_bid_created(event))
        
        logger.info(f"Bid placed successfully: {bid_data.bid_amount} by {real_name}")
        
        return bid_data
    
    except BidValidationException as e:
        logger.warning(f"Bid validation failed: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except ValueError as e:
        logger.warning(f"Bid placement error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error placing bid: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error placing bid")

@router.get("", response_model=List[Bid])
def list_bids(
    user_id: Optional[str] = None,
    auction_id: Optional[str] = None,
    min_amount: Optional[float] = None,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """List bids with optional filters"""
    try:
        return service.list_bids(user_id=user_id, auction_id=auction_id, min_amount=min_amount)
    except Exception as e:
        logger.error(f"Error listing bids: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error listing bids")

@router.get("/{bid_id}", response_model=Bid)
def get_bid(
    bid_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """Get bid details by ID"""
    try:
        bid = service.get_bid(bid_id)
        if not bid:
            raise HTTPException(status_code=404, detail="Bid not found")
        return bid
    except Exception as e:
        logger.error(f"Error getting bid {bid_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error getting bid")

@router.get("/auction/{auction_id}/bids", response_model=List[Bid])
def get_bids_by_auction(
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all bids for an auction"""
    try:
        bids = service.list_bids_by_auction(auction_id=auction_id)
        
        for bid in bids:
            user = db.query(User).filter(User.user_id == bid.buyer_id).first()
            if user:
                first_name = user.first_name or ""
                last_name = user.last_name or ""
                real_name = f"{first_name} {last_name}".strip()
                
                bid.buyer_name = real_name if real_name else user.user_name      
        return bids
    except Exception as e:
        logger.error(f"Error getting bids for auction {auction_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error getting auction bids")

@router.get("/{user_id}/auction/{auction_id}", response_model=List[Bid])
def get_bids_by_user_auction(
    user_id: str,
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """List bids by user for a specific auction"""
    try:
        return service.list_bids_by_user_auction(user_id=str(current_user.user_id), auction_id=auction_id)
    except Exception as e:
        logger.error(f"Error getting bids for user {user_id}, auction {auction_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error getting bids")

@router.get("/auction/{auction_id}/highest", response_model=Bid)
def get_highest_bid(
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_user),
):
    """Get the highest bid for an auction"""
    try:
        bid = service.get_highest_bid_for_auction(auction_id=auction_id)
        if not bid:
            raise HTTPException(status_code=404, detail="No bids found for this auction")
        return bid
    except Exception as e:
        logger.error(f"Error getting highest bid for auction {auction_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error getting highest bid")