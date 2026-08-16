from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from src.application.schemas.buyer.order import Order, WinsAuction
from src.application.use_cases.buyer.order_service import OrderService, WinsAuctionService
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_buyer, get_current_user
from src.domain.models.user import User
from src.domain.models.order import Order as OrderModel
from src.domain.models.auction import Auction

router = APIRouter(prefix="/orders", tags=["orders"])

def get_order_service(db: Session = Depends(get_db)):
    return OrderService(db)

def get_wins_auction_service(db: Session = Depends(get_db)):
    return WinsAuctionService(db)

def _build_buyer_order(order: OrderModel, db: Session) -> dict:
    """Build an order response dict with seller + auction details for buyer view."""
    auction = order.auction
    buyer = db.query(User).filter(User.user_id == order.user_id).first()
    seller = db.query(User).filter(User.user_id == order.seller_id).first() if order.seller_id else None

    buyer_name = " ".join(filter(None, [buyer.first_name, buyer.last_name])) if buyer else ""
    seller_name = " ".join(filter(None, [seller.first_name, seller.last_name])) if seller else ""

    return {
        "order_id": str(order.order_id).lower(),
        "display_order_id": order.display_order_id,
        "buyer_id": str(order.user_id).lower(),
        "buyer_name": buyer_name,
        "buyer_email": buyer.email if buyer else None,
        "seller_id": str(order.seller_id).lower() if order.seller_id else None,
        "seller_name": seller_name,
        "auction_id": str(order.auction_id).lower(),
        "auction_name": auction.auction_name if auction else None,
        "estate_name": auction.estate_name if auction else None,
        "grade": auction.grade if auction else None,
        "quantity": auction.quantity if auction else None,
        "total_amount": order.total_amount,
        "sold_price": auction.sold_price if auction else None,
        "order_date": order.order_date.isoformat() if order.order_date else None,
        "order_status": order.order_status or "pending",
        "payment_status": order.payment_status or "pending",
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "updated_at": order.updated_at.isoformat() if order.updated_at else None,
    }


# Create a new order
@router.post("", response_model=Order)
def create_order(
    order: Order,
    service: OrderService = Depends(get_order_service),
    current_user: User = Depends(get_current_buyer),
):
    order.user_id = str(current_user.user_id)
    return service.create_order(order)

# List detailed orders for buyer
@router.get("/detailed", response_model=List[dict])
def list_buyer_orders_detailed(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_buyer),
):
    buyer_id = str(current_user.user_id)
    query = db.query(OrderModel).filter(OrderModel.user_id == buyer_id)

    if status:
        query = query.filter(OrderModel.order_status == status.lower())

    orders = query.order_by(OrderModel.order_date.desc()).all()
    return [_build_buyer_order(o, db) for o in orders]

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

# Get the order for a specific auction (seller uses this to navigate to messages)
@router.get("/auction/{auction_id}", response_model=Order)
def get_order_by_auction(
    auction_id: str,
    service: OrderService = Depends(get_order_service),
    current_user: User = Depends(get_current_user),
):
    order = service.get_order_by_auction(auction_id)
    if not order:
        raise HTTPException(status_code=404, detail="No order found for this auction")
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