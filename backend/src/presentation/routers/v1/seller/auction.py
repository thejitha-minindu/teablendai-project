from fastapi import APIRouter, HTTPException, Depends, status, Header
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from src.application.schemas.seller.auction import Auction, AuctionCreate, AuctionResponse
from src.application.use_cases.seller.auction_service import AuctionService
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_user, get_optional_current_user
from src.domain.models.user import User
from uuid import UUID

logger = logging.getLogger(__name__)

router = APIRouter()
router.router = router

def get_auction_service(db: Session = Depends(get_db)):
    return AuctionService(db)

@router.post("/auctions", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED)
def create_auction(
    auction: AuctionCreate,  
    service: AuctionService = Depends(get_auction_service),
    current_user: Optional[User] = Depends(get_optional_current_user),
    x_user_id: Optional[str] = Header(None)
):
    """
    Create a new auction.
    """
    try:
        # Determine user_id from JWT (preferred) or header
        user_id = None
        validated_user = None
        
        if current_user:
            user_id = str(current_user.user_id)
            validated_user = current_user
            logger.info(f"[API] Creating auction via JWT for user {user_id}")
        elif x_user_id:
            user_id = x_user_id
            logger.info(f"[API] Creating auction via X-User-ID for user {user_id}")
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required. Provide JWT token or X-User-ID header."
            )
        
        # If we have a validated user object, use it for role check; if only X-User-ID, skip role validation
        # (MCP server is trusted)
        if validated_user and validated_user.default_role.lower() not in ["seller", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only sellers and admins can create auctions"
            )
        
        # Populate seller info from authenticated user
        if validated_user:
            # Use user's name and origin as defaults for seller profile
            auction.seller_id = user_id
            auction.seller_brand = auction.seller_brand or f"{validated_user.first_name} {validated_user.last_name}"
            auction.company_name = auction.company_name or f"{validated_user.first_name}'s Tea Estate"
            auction.estate_name = auction.estate_name or auction.origin
        else:
            # For X-User-ID header calls (MCP), require seller info in request
            if not auction.seller_brand:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="seller_brand is required when using X-User-ID header"
                )
            auction.seller_id = user_id
        
        logger.info(
            f"[API] Auction request: {auction.grade} {auction.quantity}kg from {auction.origin} "
            f"by user {user_id} ({auction.seller_brand})"
        )
        
        return service.create_auction(auction)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Failed to create auction: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create auction: {str(e)}"
        )

@router.get("/auctions", response_model=List[Auction])
def read_auctions(service: AuctionService = Depends(get_auction_service)):
    return service.list_auctions()

@router.get("/auctions/{auction_id}", response_model=AuctionResponse)
def read_auction(auction_id: str, service: AuctionService = Depends(get_auction_service)):
    auction = service.get_auction(auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return auction

@router.get("/auctions/status/scheduled", response_model=List[AuctionResponse])
def get_scheduled_auctions(seller_id: Optional[UUID] = None, service: AuctionService = Depends(get_auction_service)):
    return service.get_scheduled_auctions(seller_id)

@router.get("/auctions/status/live", response_model=List[AuctionResponse])
def get_live_auctions(seller_id: Optional[UUID] = None, service: AuctionService = Depends(get_auction_service)):
    return service.get_live_auctions(seller_id)

@router.get("/auctions/status/history", response_model=List[AuctionResponse])
def get_history_auctions(seller_id: Optional[UUID] = None, service: AuctionService = Depends(get_auction_service)):
    return service.get_history_auctions(seller_id)

@router.delete("/auctions/{auction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auction(
    auction_id: str,
    service: AuctionService = Depends(get_auction_service),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Delete an auction.
    
    Requires seller authentication. Ownership validation is handled by service.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to delete auctions"
        )
    
    if current_user.default_role.lower() not in ["seller", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can delete auctions"
        )
    
    success = service.delete_auction(auction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Auction not found")
    return None

@router.put("/auctions/{auction_id}", response_model=AuctionResponse)
def update_auction(
    auction_id: str, 
    auction_update: AuctionCreate,
    service: AuctionService = Depends(get_auction_service),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Update an existing auction.
    
    Requires seller authentication. Ownership validation is handled by service.
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to update auctions"
        )
    
    if current_user.default_role.lower() not in ["seller", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only sellers can update auctions"
        )
    
    updated_auction = service.update_auction(auction_id, auction_update)
    if not updated_auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return updated_auction