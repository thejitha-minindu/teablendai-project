from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import List
from src.application.schemas.auction import Auction, AuctionCreate, AuctionResponse
from src.application.use_cases.auction_service import AuctionService
from src.infrastructure.database.base import get_db

router = APIRouter()

def get_auction_service(db: Session = Depends(get_db)):
    return AuctionService(db)

@router.post("/auctions", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED)
def create_auction(
    auction: AuctionCreate,  
    service: AuctionService = Depends(get_auction_service)
):
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

@router.get("/auctions/status/scheduled", response_model=List[AuctionResponse])
def get_scheduled_auctions(service: AuctionService = Depends(get_auction_service)):
    return service.get_scheduled_auctions()

@router.get("/auctions/status/live", response_model=List[AuctionResponse])
def get_live_auctions(service: AuctionService = Depends(get_auction_service)):
    return service.get_live_auctions()

@router.get("/auctions/status/history", response_model=List[AuctionResponse])
def get_history_auctions(service: AuctionService = Depends(get_auction_service)):
    return service.get_history_auctions()

@router.delete("/auctions/{auction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auction(auction_id: str, service: AuctionService = Depends(get_auction_service)):
    success = service.delete_auction(auction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Auction not found")
    return None

@router.put("/auctions/{auction_id}", response_model=AuctionResponse)
def update_auction(
    auction_id: str, 
    auction_update: AuctionCreate, # Reuse Create schema or make a specific Update one
    service: AuctionService = Depends(get_auction_service)
):
    updated_auction = service.update_auction(auction_id, auction_update)
    if not updated_auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return updated_auction