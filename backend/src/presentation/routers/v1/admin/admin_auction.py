from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.infrastructure.database.connection import get_db
from src.infrastructure.repositories.admin.auction_repository import AuctionRepository
from src.application.use_cases.admin.get_all_auctions import GetAllAuctionsUseCase
from src.application.schemas.admin.auction_schema import AuctionResponse


router = APIRouter(prefix="", tags=["Admin Auctions"])

@router.get("/auctions", response_model=list[AuctionResponse])
def get_all_auctions(db: Session = Depends(get_db)):

    repo = AuctionRepository(db)
    usecase = GetAllAuctionsUseCase(repo)

    auctions = usecase.execute()

    return auctions