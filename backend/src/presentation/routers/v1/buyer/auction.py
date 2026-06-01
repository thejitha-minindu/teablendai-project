from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from src.application.schemas.buyer.auction import Auction, AuctionData, AuctionOrderCard, AuctionRemainingTimeResponse
from src.application.use_cases.buyer.auction_service import AuctionService
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_buyer
from src.domain.models.user import User
from src.domain.services.buyer.auction_timing_service import AuctionTimingService

router = APIRouter(prefix="/auctions", tags=["auctions"])
router.router = router

def get_auction_service(db: Session = Depends(get_db)):
    return AuctionService(db)

# List auctions with optional filters
@router.get("", response_model=List[AuctionData])
def list_auctions(
    user_id: Optional[str] = None,
    as_buyer: bool = False,
    status: Optional[str] = None,
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    resolved_user_id = str(current_user.user_id) if as_buyer else user_id
    return service.list_auctions(user_id=resolved_user_id, as_buyer=as_buyer, status=status)

# Get auction by ID
@router.get("/{auction_id}", response_model=AuctionData)
def read_auction(
    auction_id: str,
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.get_auction(auction_id)


@router.get("/{auction_id}/remaining-time", response_model=AuctionRemainingTimeResponse)
def read_remaining_time(
    auction_id: str,
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    auction = service.get_auction(auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    remaining_seconds = int(AuctionTimingService.get_remaining_time(auction).total_seconds())
    is_live = str(auction.status).lower() == "live"

    return AuctionRemainingTimeResponse(
        auction_id=auction.auction_id,
        status=str(auction.status),
        remaining_seconds=remaining_seconds,
        is_live=is_live,
    )

# Get auction history for user
@router.get("/user/{user_id}/history", response_model=List[AuctionData])
def get_auctions_history(
    as_buyer: bool = False,
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.list_auctions_history(user_id=str(current_user.user_id), as_buyer=as_buyer)

# Get auctions in user's orders
@router.get("/user/{user_id}/orders", response_model=List[AuctionOrderCard])
def get_auctions_orders(
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.list_auctions_order(user_id=str(current_user.user_id))

# Get auctions in user's watchlist
@router.get("/user/{user_id}/watchlist", response_model=List[AuctionData])
def get_auctions_watchlist(
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.list_auctions_watchlist(user_id=str(current_user.user_id))

# Get home preview auctions for user
@router.get("/user/{user_id}/preview", response_model=List[AuctionData])
def get_home_preview(
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.get_home_preview_auctions(user_id=str(current_user.user_id))

# Add to watchlist
@router.post("/user/{user_id}/watchlist/auctions/{auction_id}")
def add_to_watchlist(
    auction_id: str,
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    service.add_to_watchlist(str(current_user.user_id), auction_id)
    return {"message": "Auction added to watchlist"}

# Remove from watchlist
@router.delete("/user/{user_id}/watchlist/auctions/{auction_id}")
def remove_from_watchlist(
    auction_id: str,
    service: AuctionService = Depends(get_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    service.remove_from_watchlist(str(current_user.user_id), auction_id)
    return {"message": "Auction removed from watchlist"}