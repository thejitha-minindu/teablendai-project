from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from src.application.schemas.buyer.auction import Auction, AuctionData
from src.application.use_cases.buyer.auction_service import AuctionService
from src.infrastructure.database.base import get_db

router = APIRouter(prefix="/auctions", tags=["auctions"])

def get_auction_service(db: Session = Depends(get_db)):
    return AuctionService(db)

# Create a new auction
@router.post("", response_model=AuctionData)
def create_auction(auction: Auction, service: AuctionService = Depends(get_auction_service)):
    return service.create_auction(auction)

# List auctions with optional filters
@router.get("", response_model=List[AuctionData])
def list_auctions(user_id: Optional[str] = None, as_buyer: bool = False, status: Optional[str] = None, service: AuctionService = Depends(get_auction_service)):
    return service.list_auctions(user_id=user_id, as_buyer=as_buyer, status=status)

# Get auction by ID
@router.get("/{auction_id}", response_model=AuctionData)
def read_auction(auction_id: str, service: AuctionService = Depends(get_auction_service)):
    auction = service.get_auction(auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction

# Get auction history for user
@router.get("/user/{user_id}/history", response_model=List[AuctionData])
def get_auctions_history(user_id: str, as_buyer: bool = False, service: AuctionService = Depends(get_auction_service)):
    return service.list_auctions_history(user_id=user_id, as_buyer=as_buyer)

# Get auctions where user is buyer with history status
@router.get("/user/{user_id}/orders", response_model=List[AuctionData])
def get_auctions_orders(user_id: str, service: AuctionService = Depends(get_auction_service)):
    return service.list_auctions_order(user_id=user_id)

# Get auctions in user's watchlist
@router.get("/user/{user_id}/watchlist", response_model=List[AuctionData])
def get_auctions_watchlist(user_id: str, service: AuctionService = Depends(get_auction_service)):
    return service.list_auctions_watchlist(user_id=user_id)

# Get home preview auctions for user
@router.get("/user/{user_id}/preview", response_model=List[AuctionData])
def get_home_preview(user_id: str, service: AuctionService = Depends(get_auction_service)):
    return service.get_home_preview_auctions(user_id=user_id)

# Add to watchlist
@router.post("/user/{user_id}/watchlist/auctions/{auction_id}")
def add_to_watchlist(user_id: str, auction_id: str, service: AuctionService = Depends(get_auction_service)):
    service.add_to_watchlist(user_id, auction_id)
    return {"message": "Auction added to watchlist"}

# Remove from watchlist
@router.delete("/user/{user_id}/watchlist/auctions/{auction_id}")
def remove_from_watchlist(user_id: str, auction_id: str, service: AuctionService = Depends(get_auction_service)):
    service.remove_from_watchlist(user_id, auction_id)
    return {"message": "Auction removed from watchlist"}