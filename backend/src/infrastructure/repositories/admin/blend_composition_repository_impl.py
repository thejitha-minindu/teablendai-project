from sqlalchemy.orm import Session
from src.domain.repositories.admin.blend_composition_repository import BlendCompositionRepository
from src.infrastructure.database.models.admin_tables_orm import BlendCompositionORM
import logging

logger = logging.getLogger("blend_composition")

class BlendCompositionRepositoryImpl(BlendCompositionRepository):

    def __init__(self, db: Session):
        self.db = db

    def add(self, composition):
        orm_object = BlendCompositionORM(
            BlendID=composition.blend_id,
            Standard=composition.standard,
            Ratio=composition.ratio
        )

        try:
            self.db.add(orm_object)
            self.db.commit()
            self.db.refresh(orm_object)
            logger.info("[add] Composition inserted.")
        except Exception as e:
            logger.error(f"[add] Error inserting composition: {e}")
            self.db.rollback()

    def add_bulk(self, compositions):
        if not compositions:
            logger.warning("[add_bulk] No compositions to insert.")
            return

        orm_objects = [
            BlendCompositionORM(
                BlendID=c.blend_id,
                Standard=c.standard,
                Ratio=c.ratio
            )
            for c in compositions
        ]

        try:
            self.db.bulk_save_objects(orm_objects)
            self.db.commit()
            logger.info(f"[add_bulk] Inserted {len(orm_objects)} compositions.")
        except Exception as e:
            logger.error(f"[add_bulk] Error: {e}")
            self.db.rollback()