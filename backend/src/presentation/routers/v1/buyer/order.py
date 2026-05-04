from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from src.application.schemas.buyer.order import Order, WinsAuction
from src.application.use_cases.buyer.order_service import OrderService, WinsAuctionService
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_buyer
from src.domain.models.user import User

router = APIRouter(prefix="/orders", tags=["orders"])

def get_order_service(db: Session = Depends(get_db)):
    return OrderService(db)

def get_wins_auction_service(db: Session = Depends(get_db)):
    return WinsAuctionService(db)


# Create a new order
@router.post("", response_model=Order)
def create_order(
    order: Order,
    service: OrderService = Depends(get_order_service),
    current_user: User = Depends(get_current_buyer),
):
    order.user_id = str(current_user.user_id)
    return service.create_order(order)

# Get order details by ID
@router.get("/{order_id}", response_model=Order)
def get_order(
    order_id: str,
    service: OrderService = Depends(get_order_service),
    current_user: User = Depends(get_current_buyer),
):
    order = service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

# List orders with optional filters
@router.get("", response_model=List[Order])
def list_orders(
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    service: OrderService = Depends(get_order_service),
    current_user: User = Depends(get_current_buyer),
):
    resolved_user_id = user_id or str(current_user.user_id)
    return service.list_orders(user_id=resolved_user_id, status=status)

# Get all orders for a specific user
@router.get("/user/{user_id}", response_model=List[Order])
def get_orders_by_user(
    user_id: str,
    service: OrderService = Depends(get_order_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.list_orders_by_user(user_id=str(current_user.user_id))



# WinsAuction endpoints
# Create a new wins auction record
@router.post("/wins", response_model=WinsAuction)
def create_wins_auction(
    wins_auction: WinsAuction,
    service: WinsAuctionService = Depends(get_wins_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    wins_auction.user_id = str(current_user.user_id)
    return service.create_wins_auction(wins_auction)

# Get a specific wins auction record
@router.get("/wins/{auction_id}/user/{user_id}", response_model=WinsAuction)
def get_wins_auction(
    auction_id: str,
    user_id: str,
    service: WinsAuctionService = Depends(get_wins_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    wins_auction = service.get_wins_auction(auction_id=auction_id, user_id=str(current_user.user_id))
    if not wins_auction:
        raise HTTPException(status_code=404, detail="Wins auction not found")
    return wins_auction

# List wins auctions with optional filters
@router.get("/wins", response_model=List[WinsAuction])
def list_wins_auctions(
    user_id: Optional[str] = None,
    auction_id: Optional[str] = None,
    service: WinsAuctionService = Depends(get_wins_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    resolved_user_id = user_id or str(current_user.user_id)
    return service.list_wins_auctions(user_id=resolved_user_id, auction_id=auction_id)

# Get all wins auctions for a specific user
@router.get("/wins/user/{user_id}", response_model=List[WinsAuction])
def get_wins_auctions_by_user(
    user_id: str,
    service: WinsAuctionService = Depends(get_wins_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.list_wins_auctions_by_user(user_id=str(current_user.user_id))

# Get all wins records for a specific auction
@router.get("/wins/auction/{auction_id}", response_model=List[WinsAuction])
def get_wins_auctions_by_auction(
    auction_id: str,
    service: WinsAuctionService = Depends(get_wins_auction_service),
    current_user: User = Depends(get_current_buyer),
):
    return service.list_wins_auctions_by_auction(auction_id=auction_id)