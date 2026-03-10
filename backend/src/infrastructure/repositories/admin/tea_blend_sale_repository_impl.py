from sqlalchemy.orm import Session
from src.domain.repositories.admin.tea_blend_sale_repository import TeaBlendSaleRepository
from src.infrastructure.database.models.admin_tables_orm import TeaBlendSaleORM
import logging

logger = logging.getLogger("blend_sale")

class TeaBlendSaleRepositoryImpl(TeaBlendSaleRepository):

    def __init__(self, db: Session):
        self.db = db

    def add(self, sale):
        orm_object = TeaBlendSaleORM(
            CustomerID=sale.customer_id,
            BlendName=sale.blend_name,
            PricePerKg=sale.price_per_kg,
            QuantityKg=sale.quantity_kg,
            SaleDate=sale.sale_date
        )

        try:
            self.db.add(orm_object)
            self.db.commit()
            self.db.refresh(orm_object)
            logger.info("[add] Sale inserted successfully.")
            return orm_object
        except Exception as e:
            logger.error(f"[add] Error inserting sale: {e}")
            self.db.rollback()

    def add_bulk(self, sales):
        if not sales:
            logger.warning("[add_bulk] No sales to insert.")
            return

        orm_objects = [
            TeaBlendSaleORM(
                CustomerID=s.customer_id,
                BlendName=s.blend_name,
                PricePerKg=s.price_per_kg,
                QuantityKg=s.quantity_kg,
                SaleDate=s.sale_date
            )
            for s in sales
        ]

        try:
            self.db.bulk_save_objects(orm_objects)
            self.db.commit()
            logger.info(f"[add_bulk] Inserted {len(orm_objects)} sales.")
        except Exception as e:
            logger.error(f"[add_bulk] Error inserting sales: {e}")
            self.db.rollback()

