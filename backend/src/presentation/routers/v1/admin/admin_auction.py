from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.infrastructure.database.connection import get_db
from src.infrastructure.repositories.admin.auction_repository import AuctionRepository
from src.application.use_cases.admin.get_all_auctions import GetAllAuctionsUseCase
from src.application.schemas.admin.auction_schema import AuctionResponse
from src.application.dependencies import get_current_admin, get_system_log_service
from src.domain.models.auction import Auction
from src.domain.models.bid import Bid
from src.domain.models.user import WatchList
from src.domain.models.order import Order, WinsAuction


router = APIRouter(prefix="", tags=["Admin Auctions"])

@router.get("/auctions", response_model=list[AuctionResponse])
def get_all_auctions(db: Session = Depends(get_db)):

    repo = AuctionRepository(db)
    usecase = GetAllAuctionsUseCase(repo)

    auctions = usecase.execute()

    return auctions


@router.delete("/auctions/{auction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_auction(
    auction_id: str,
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin),
    log_service = Depends(get_system_log_service)
):
    import uuid
    is_uuid = False
    try:
        uuid.UUID(auction_id)
        is_uuid = True
    except ValueError:
        pass

    if is_uuid:
        auction = db.query(Auction).filter(Auction.auction_id == auction_id).first()
    else:
        auction = db.query(Auction).filter(Auction.custom_auction_id == auction_id).first()

    if not auction:
        raise HTTPException(status_code=404, detail="Auction not found")

    status_lower = (auction.status or "").lower()
    if status_lower != "scheduled":
        raise HTTPException(
            status_code=400,
            detail=f"Only scheduled auctions can be deleted. Current status: {auction.status}"
        )

    actual_id = auction.auction_id

    # Cascade deletes to avoid foreign key violations in SQL Server
    db.query(WatchList).filter(WatchList.auction_id == actual_id).delete(synchronize_session=False)
    db.query(Bid).filter(Bid.auction_id == actual_id).delete(synchronize_session=False)
    db.query(WinsAuction).filter(WinsAuction.auction_id == actual_id).delete(synchronize_session=False)
    db.query(Order).filter(Order.auction_id == actual_id).delete(synchronize_session=False)

    db.delete(auction)
    db.commit()

    admin_identifier = admin.username or admin.email or "Admin"
    log_service.log(
        activity_type="Auction Deleted",
        details=f"Admin deleted {status_lower} auction '{auction.auction_name}' (ID: {actual_id})",
        status="success",
        user_name=admin_identifier
    )

    return None