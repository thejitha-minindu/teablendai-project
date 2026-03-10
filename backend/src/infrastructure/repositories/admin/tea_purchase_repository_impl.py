from sqlalchemy.orm import Session
from src.domain.repositories.admin.tea_purchase_repository import TeaPurchaseRepository
from src.infrastructure.database.models.admin_tables_orm import TeaPurchaseORM
import logging

logger = logging.getLogger("csv_upload")

class TeaPurchaseRepositoryImpl(TeaPurchaseRepository):

    def __init__(self, db: Session):
        self.db = db

    def bulk_insert(self, purchases):
        if not purchases:
            logger.warning("[bulk_insert] No purchases to insert.")
            return
        orm_objects = [
            TeaPurchaseORM(
                SourceType=p.source_type,
                Standard=p.standard,
                PricePerKg=p.price_per_kg,
                QuantityKg=p.quantity_kg,
                PurchaseDate=p.purchase_date
            )
            for p in purchases
        ]
        logger.info(f"[bulk_insert] Inserting {len(orm_objects)} purchases into DB...")
        try:
            self.db.bulk_save_objects(orm_objects)
            self.db.commit()
            logger.info("[bulk_insert] Commit successful.")
        except Exception as e:
            logger.error(f"[bulk_insert] Error during commit: {e}")
            self.db.rollback()

    def add_bulk(self, purchases):
        return self.bulk_insert(purchases)