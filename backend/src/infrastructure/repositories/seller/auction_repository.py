from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
import uuid
import logging
from src.domain.models.auction import Auction as AuctionModel
from src.domain.models.auction_status import AuctionStatus
from src.infrastructure.services.auction_reference_id_generator import build_auction_reference_id
logger = logging.getLogger(__name__)
from src.application.schemas.seller.auction import Auction, AuctionCreate
from src.domain.repositories.seller.auction_repository import AuctionRepositoryInterface
from sqlalchemy.orm import joinedload

class AuctionRepository(AuctionRepositoryInterface):
    DEV_SELLER_ID = "12345678-1234-5678-1234-567812345678"
    DEV_SELLER_EMAIL = "dev.seller@teablendai.local"
    DEV_SELLER_USERNAME = "dev_seller"
    _custom_id_column_checked = False

    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def _is_uuid(value: str) -> bool:
        try:
            uuid.UUID(str(value))
            return True
        except (ValueError, TypeError):
            return False

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

    def _ensure_custom_auction_id_column(self) -> None:
        """Ensure auctions table has custom_auction_id column for existing DBs."""
        if AuctionRepository._custom_id_column_checked:
            return

        self.db.execute(
            text(
                """
                IF COL_LENGTH('auctions', 'custom_auction_id') IS NULL
                BEGIN
                    ALTER TABLE auctions
                    ADD custom_auction_id VARCHAR(256) NULL
                END
                """
            )
        )

        self.db.execute(
            text(
                """
                IF NOT EXISTS (
                    SELECT 1
                    FROM sys.indexes
                    WHERE name = 'IX_auctions_custom_auction_id'
                      AND object_id = OBJECT_ID('auctions')
                )
                BEGIN
                    CREATE UNIQUE NONCLUSTERED INDEX IX_auctions_custom_auction_id
                    ON auctions(custom_auction_id)
                    WHERE custom_auction_id IS NOT NULL
                END
                """
            )
        )

        self.db.commit()
        AuctionRepository._custom_id_column_checked = True

    def _generate_unique_custom_auction_id(
        self,
        seller_name: str,
        grade: str,
        origin: str,
        max_attempts: int = 30,
    ) -> str:
        """Generate a unique custom auction ID in requested format."""
        for _ in range(max_attempts):
            candidate = build_auction_reference_id(
                seller_name=seller_name,
                tea_grade=grade,
                origin=origin,
            )

            exists = (
                self.db.query(AuctionModel.auction_id)
                .filter(AuctionModel.custom_auction_id == candidate)
                .first()
            )
            if not exists:
                return candidate

        raise RuntimeError("Unable to generate unique custom auction ID")

    def create_auction(self, auction_data: AuctionCreate) -> Auction:
        self._ensure_custom_auction_id_column()

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

        seller_name_for_custom_id = (
            (auction_data.seller_brand or "").strip()
            or company_name
            or estate_name
            or "Seller"
        )
        custom_auction_id = self._generate_unique_custom_auction_id(
            seller_name=seller_name_for_custom_id,
            grade=auction_data.grade,
            origin=auction_data.origin,
        )
        logger.info("Generated custom auction ID %s for auction %s", custom_auction_id, new_id)
        
        db_auction = AuctionModel(
            auction_id=new_id,
            custom_auction_id=custom_auction_id,
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
            status=AuctionStatus.SCHEDULE.value
        )
        
        self.db.add(db_auction)
        self.db.commit()
        self.db.refresh(db_auction)
        return db_auction
    
    def get_auction(self, auction_id: str):
        identifier = str(auction_id).strip()
        if self._is_uuid(identifier):
            return (
                self.db.query(AuctionModel)
                .filter(AuctionModel.auction_id == identifier)
                .first()
            )
        return (
            self.db.query(AuctionModel)
            .filter(AuctionModel.custom_auction_id == identifier)
            .first()
        )

    def list_auctions(self):
        return self.db.query(AuctionModel).all()

    def get_all(self):
        return self.list_auctions()

    def get_by_status(self, status: str, seller_id: Optional[uuid.UUID] = None) -> List[AuctionModel]:
        query = self.db.query(AuctionModel).filter(AuctionModel.status == status)
        
        # If a seller_id is provided, filter the results!
        if seller_id:
            query = query.filter(AuctionModel.seller_id == seller_id)
            
        return query.all()
    
    def get_by_id(self, auction_id: str) -> AuctionModel: # Note: return AuctionModel, not Auction schema
        auction = self.db.query(AuctionModel)\
            .options(joinedload(AuctionModel.bids))\
            .filter(AuctionModel.auction_id == auction_id)\
            .first()
            
        if auction:
            # Dynamically attach highest bid info before returning
            if auction.bids:
                highest_bid = max(auction.bids, key=lambda b: b.bid_amount)
                auction.highest_bid = highest_bid.bid_amount
                auction.highest_bidder = str(highest_bid.buyer_id)
            else:
                auction.highest_bid = None
                auction.highest_bidder = None
                
        return auction

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
