from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from src.application.schemas.buyer.bid import Bid
from src.application.use_cases.buyer.bid_service import BidService
from src.application.use_cases.buyer.bid_realtime_service import BidRealtimeService
from src.infrastructure.database.base import get_db
from src.infrastructure.sockets.buyer.connection_manager import auction_ws_manager
from src.application.dependencies import get_current_buyer
from src.domain.models.user import User
import asyncio
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/bids", tags=["bids"])

def get_bid_service(db: Session = Depends(get_db)):
    return BidService(db)

def get_bid_realtime_service() -> BidRealtimeService:
    return BidRealtimeService(auction_ws_manager)

@router.post("", response_model=Bid)
async def create_bid(
    bid: Bid,
    service: BidService = Depends(get_bid_service),
    realtime_service: BidRealtimeService = Depends(get_bid_realtime_service),
    current_user: User = Depends(get_current_buyer),
):
    try:
        bid.buyer_id = str(current_user.user_id)
        
        result = service.place_bid(
            auction_id=str(bid.auction_id),
            buyer_id=str(current_user.user_id),
            bid_amount=bid.bid_amount
        )
        
        # Broadcast to all connected clients
        asyncio.create_task(
            realtime_service.broadcast_bid_created(result)
        )
        
        logger.info(f"Bid placed: ${result['bid'].bid_amount}")
        
        return result["bid"]
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error placing bid: {e}")
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

@router.get("/auction/{auction_id}", response_model=List[Bid])
def get_bids_by_auction(
    auction_id: str,
    service: BidService = Depends(get_bid_service),
    current_user: User = Depends(get_current_buyer),
):
    """List all bids for an auction"""
    return service.list_bids_by_auction(auction_id=auction_id)

@router.get("/auction/{auction_id}/user/{user_id}", response_model=List[Bid])
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
    current_user: User = Depends(get_current_buyer),
):
    """Get the highest bid for an auction"""
    bid = service.get_highest_bid_for_auction(auction_id=auction_id)
    if not bid:
        raise HTTPException(status_code=404, detail="No bids found for this auction")
    return bid