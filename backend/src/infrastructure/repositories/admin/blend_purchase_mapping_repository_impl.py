from sqlalchemy.orm import Session
from src.domain.repositories.admin.blend_purchase_mapping_repository import BlendPurchaseMappingRepository
from src.infrastructure.database.models.admin_tables_orm import BlendPurchaseMappingORM
import logging

logger = logging.getLogger("blend_mapping")

class BlendPurchaseMappingRepositoryImpl(BlendPurchaseMappingRepository):

    def __init__(self, db: Session):
        self.db = db

    def add(self, mapping):
        orm_object = BlendPurchaseMappingORM(
            SaleID=mapping.sale_id,
            PurchaseID=mapping.purchase_id,
            Standard=mapping.standard,
            QuantityUsedKg=mapping.quantity_used_kg
        )

        try:
            self.db.add(orm_object)
            self.db.commit()
            self.db.refresh(orm_object)
            logger.info("[add] Mapping inserted.")
        except Exception as e:
            logger.error(f"[add] Error inserting mapping: {e}")
            self.db.rollback()

    def add_bulk(self, mappings):
        if not mappings:
            logger.warning("[add_bulk] No mappings to insert.")
            return

        orm_objects = [
            BlendPurchaseMappingORM(
                SaleID=m.sale_id,
                PurchaseID=m.purchase_id,
                Standard=m.standard,
                QuantityUsedKg=m.quantity_used_kg
            )
            for m in mappings
        ]

        try:
            self.db.bulk_save_objects(orm_objects)
            self.db.commit()
            logger.info(f"[add_bulk] Inserted {len(orm_objects)} mappings.")
        except Exception as e:
            logger.error(f"[add_bulk] Error: {e}")
            self.db.rollback()