from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from src.application.schemas.auction import Auction
from src.application.use_cases.auction_service import AuctionService
from src.database import get_db

router = APIRouter()

def get_auction_service(db: Session = Depends(get_db)):
    return AuctionService(db)

@router.post("/auctions", response_model=Auction)
def create_auction(auction: Auction, service: AuctionService = Depends(get_auction_service)):
    return service.create_auction(auction)

@router.get("/auctions", response_model=List[Auction])
def read_auctions(service: AuctionService = Depends(get_auction_service)):
    return service.list_auctions()

@router.get("/auctions/{auction_id}", response_model=Auction)
def read_auction(auction_id: str, service: AuctionService = Depends(get_auction_service)):
    auction = service.get_auction(auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction