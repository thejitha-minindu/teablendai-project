from fastapi import APIRouter, HTTPException, Depends, status, Header, UploadFile, File
import cloudinary
import cloudinary.uploader
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from src.application.schemas.seller.auction import Auction, AuctionCreate, AuctionResponse
from src.application.use_cases.seller.auction_service import AuctionService
from src.infrastructure.database.base import get_db
from src.application.dependencies import get_current_user, get_optional_current_user, get_optional_token_payload
from src.domain.models.user import User
from src.domain.models.auction_status import AuctionStatus
from uuid import UUID

logger = logging.getLogger(__name__)

router = APIRouter()
router.router = router

def get_auction_service(db: Session = Depends(get_db)):
    return AuctionService(db)

@router.post("/auctions/upload-image", status_code=status.HTTP_200_OK)
def upload_auction_image(
    file: UploadFile = File(...),
    current_user: Optional[User] = Depends(get_optional_current_user),
    token_payload: Optional[dict] = Depends(get_optional_token_payload),
    x_user_id: Optional[str] = Header(None)
):
    if not current_user and not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to upload images."
        )
        
    # Validate file type
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type. Only JPEG, PNG, and WEBP are allowed."
        )
    
    # Validate file size (5MB max)
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size too large. Maximum allowed is 5MB."
        )
        
    try:
        # Cloudinary uses CLOUDINARY_URL in the .env out of the box
        result = cloudinary.uploader.upload(file.file)
        url = result.get("secure_url")
        if not url:
            raise Exception("No secure_url returned from Cloudinary.")
        
        return {"image_url": url}
    except Exception as e:
        logger.error(f"[API] Failed to upload image: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload image: {str(e)}"
        )

@router.post("/auctions", response_model=AuctionResponse, status_code=status.HTTP_201_CREATED)
def create_auction(
    auction: AuctionCreate,  
    service: AuctionService = Depends(get_auction_service),
    current_user: Optional[User] = Depends(get_optional_current_user),
    token_payload: Optional[dict] = Depends(get_optional_token_payload),
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
        if validated_user:
            active_role = token_payload.get("role", "").lower() if token_payload else validated_user.default_role.lower()
            if active_role not in ["seller"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only sellers can create auctions"
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

@router.get("/auctions", response_model=List[AuctionResponse])
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
    current_user: Optional[User] = Depends(get_optional_current_user),
    token_payload: Optional[dict] = Depends(get_optional_token_payload),
    x_user_id: Optional[str] = Header(None),
):
    """
    Delete an auction.
    
    Requires seller authentication. Ownership validation is handled by service.
    """
    resolved_user_id = None
    if current_user:
        resolved_user_id = str(current_user.user_id)
    elif x_user_id:
        resolved_user_id = x_user_id
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to delete auctions. Provide JWT token or X-User-ID header."
        )
    
    if current_user:
        active_role = token_payload.get("role", "").lower() if token_payload else current_user.default_role.lower()
        if active_role not in ["seller", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only sellers can delete auctions"
            )

    auction = service.get_auction(auction_id)
    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    if str(auction.seller_id) != str(resolved_user_id):
        raise HTTPException(status_code=403, detail="Access denied: this auction does not belong to you")

    if str(auction.status).lower() != str(AuctionStatus.SCHEDULE.value).lower():
        raise HTTPException(status_code=403, detail="Only scheduled auctions can be deleted")
    
    success = service.delete_auction(auction_id)
    if not success:
        raise HTTPException(status_code=404, detail="Auction not found")
    return None

@router.put("/auctions/{auction_id}", response_model=AuctionResponse)
def update_auction(
    auction_id: str, 
    auction_update: AuctionCreate,
    service: AuctionService = Depends(get_auction_service),
    current_user: Optional[User] = Depends(get_optional_current_user),
    token_payload: Optional[dict] = Depends(get_optional_token_payload),
    x_user_id: Optional[str] = Header(None),
):
    """
    Update an existing auction.
    
    Requires seller authentication. Ownership validation is handled by service.
    """
    resolved_user_id = None
    if current_user:
        resolved_user_id = str(current_user.user_id)
    elif x_user_id:
        resolved_user_id = x_user_id
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to update auctions. Provide JWT token or X-User-ID header."
        )
    
    if current_user:
        active_role = token_payload.get("role", "").lower() if token_payload else current_user.default_role.lower()
        if active_role not in ["seller", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only sellers can update auctions"
            )

    existing = service.get_auction(auction_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Auction not found")

    if str(existing.seller_id) != str(resolved_user_id):
        raise HTTPException(status_code=403, detail="Access denied: this auction does not belong to you")

    if str(existing.status).lower() != str(AuctionStatus.SCHEDULE.value).lower():
        raise HTTPException(status_code=403, detail="Only scheduled auctions can be updated")
    
    updated_auction = service.update_auction(auction_id, auction_update)
    if not updated_auction:
        raise HTTPException(status_code=404, detail="Auction not found")
    return updated_auction