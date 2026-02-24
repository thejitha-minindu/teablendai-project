from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from src.application.schemas.bid import Bid
from src.application.use_cases.bid_service import BidService
from src.database import get_db

router = APIRouter()

def get_bid_service(db: Session = Depends(get_db)):
    return BidService(db)

@router.post("/bid", response_model=Bid)
def create_bid(bid: Bid, service: BidService = Depends(get_bid_service)):
    return service.create_bid(bid)

@router.get("/bid", response_model=List[Bid])
def list_bids(service: BidService = Depends(get_bid_service)):
    return service.list_bids()

@router.get("/bid/{bid_id}", response_model=Bid)
def get_bid(bid_id: str, service: BidService = Depends(get_bid_service)):
    bid = service.get_bid(bid_id)
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    return bid