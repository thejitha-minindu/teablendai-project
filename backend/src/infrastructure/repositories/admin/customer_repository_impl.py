from sqlalchemy.orm import Session
from src.domain.repositories.admin.customer_repository import CustomerRepository
from src.infrastructure.database.models.admin_tables_orm import CustomerORM
import logging

logger = logging.getLogger("customer")

class CustomerRepositoryImpl(CustomerRepository):

    def __init__(self, db: Session):
        self.db = db

    def add(self, customer):
        orm_object = CustomerORM(
            Name=customer.name,
            Region=customer.region
        )

        try:
            self.db.add(orm_object)
            self.db.commit()
            self.db.refresh(orm_object)
            logger.info("[add] Customer inserted.")
            return orm_object
        except Exception as e:
            logger.error(f"[add] Error inserting customer: {e}")
            self.db.rollback()

    def add_bulk(self, customers):
        if not customers:
            logger.warning("[add_bulk] No customers to insert.")
            return

        orm_objects = [
            CustomerORM(
                Name=c.name,
                Region=c.region
            )
            for c in customers
        ]

        try:
            self.db.bulk_save_objects(orm_objects)
            self.db.commit()
            logger.info(f"[add_bulk] Inserted {len(orm_objects)} customers.")
        except Exception as e:
            logger.error(f"[add_bulk] Error: {e}")
            self.db.rollback()