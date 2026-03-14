from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import uuid
from src.domain.models.auction import Auction as AuctionModel
from src.application.schemas.auction import Auction, AuctionCreate
from src.domain.repositories.auction_repository import AuctionRepositoryInterface

class AuctionRepository(AuctionRepositoryInterface):
    DEV_SELLER_ID = "12345678-1234-5678-1234-567812345678"
    DEV_SELLER_EMAIL = "dev.seller@teablendai.local"
    DEV_SELLER_USERNAME = "dev_seller"

    def __init__(self, db: Session):
        self.db = db

    def _resolve_seller_id(self, requested_seller_id: str | None) -> str:
        """
        Resolve a seller_id that satisfies the FK to users.user_id.
        Priority:
        1) Use provided seller_id when it exists.
        2) Reuse existing dev seller (by id/email/username) if present.
        3) Create deterministic dev seller once, then use it.
        """
        normalized_requested_id = requested_seller_id
        if normalized_requested_id:
            try:
                uuid.UUID(str(normalized_requested_id))
            except ValueError:
                normalized_requested_id = None

        if normalized_requested_id:
            existing_requested = self.db.execute(
                text("SELECT TOP 1 user_id FROM users WHERE user_id = :user_id"),
                {"user_id": normalized_requested_id},
            ).scalar()
            if existing_requested:
                return str(existing_requested)

        existing_dev = self.db.execute(
            text(
                """
                SELECT TOP 1 user_id
                FROM users
                WHERE user_id = :user_id OR email = :email OR user_name = :user_name
                ORDER BY CASE WHEN user_id = :user_id THEN 0 ELSE 1 END
                """
            ),
            {
                "user_id": self.DEV_SELLER_ID,
                "email": self.DEV_SELLER_EMAIL,
                "user_name": self.DEV_SELLER_USERNAME,
            },
        ).scalar()
        if existing_dev:
            return str(existing_dev)

        self.db.execute(
            text(
                """
                INSERT INTO users (
                    user_id, email, phone_num, user_name, first_name, last_name, default_role, profile_image_url
                ) VALUES (
                    :user_id, :email, :phone_num, :user_name, :first_name, :last_name, :default_role, NULL
                )
                """
            ),
            {
                "user_id": self.DEV_SELLER_ID,
                "email": self.DEV_SELLER_EMAIL,
                "phone_num": "0000000000",
                "user_name": self.DEV_SELLER_USERNAME,
                "first_name": "Dev",
                "last_name": "Seller",
                "default_role": "seller",
            },
        )
        return self.DEV_SELLER_ID

    def create_auction(self, auction_data: AuctionCreate) -> Auction:
        new_id = str(uuid.uuid4())
        seller_id = self._resolve_seller_id(auction_data.seller_id)
        auction_name = (auction_data.auction_name or "").strip()
        if not auction_name:
            # Keep inserts valid even when legacy clients don't send auction_name.
            auction_name = f"{auction_data.grade} - {auction_data.origin}"
        company_name = (auction_data.company_name or auction_data.seller_brand or "").strip()
        if not company_name:
            company_name = "TeaBlendAI Company"
        estate_name = (auction_data.estate_name or auction_data.seller_brand or auction_data.origin or "").strip()
        if not estate_name:
            estate_name = "Tea Estate"
        
        db_auction = AuctionModel(
            auction_id=new_id,
            auction_name=auction_name,
            seller_id=seller_id,
            seller_brand=auction_data.seller_brand,
            grade=auction_data.grade,
            company_name=company_name,
            estate_name=estate_name,
            quantity=auction_data.quantity,
            origin=auction_data.origin,
            description=auction_data.description,
            base_price=auction_data.base_price,
            start_time=auction_data.start_time,
            duration=auction_data.duration,
            status="Scheduled"
        )
        
        self.db.add(db_auction)
        self.db.commit()
        self.db.refresh(db_auction)
        return db_auction
    
    def get_auction(self, auction_id: str):
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id == auction_id).first()

    def list_auctions(self):
        return self.db.query(AuctionModel).all()

    def get_by_status(self, status: str, seller_id: Optional[uuid.UUID] = None) -> List[AuctionModel]:
        query = self.db.query(AuctionModel).filter(AuctionModel.status == status)
        
        # If a seller_id is provided, filter the results!
        if seller_id:
            query = query.filter(AuctionModel.seller_id == seller_id)
            
        return query.all()
    
    def get_by_id(self, auction_id: str) -> Auction:
        return self.db.query(AuctionModel).filter(AuctionModel.auction_id == auction_id).first()

    def delete(self, auction_id: str) -> bool:
        auction = self.get_by_id(auction_id)
        if auction:
            self.db.delete(auction)
            self.db.commit()
            return True
        return False

    def update(self, auction_id: str, update_data: dict) -> AuctionModel:
        # Fetch the auction
        auction = self.get_by_id(auction_id)
        if not auction:
            return None
        
        # Update fields dynamically
        for key, value in update_data.items():
            if hasattr(auction, key) and value is not None:
                setattr(auction, key, value)
        
        self.db.commit()
        self.db.refresh(auction)
        return auction
