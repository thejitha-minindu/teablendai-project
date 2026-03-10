import csv
import logging
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError, DataError
from src.infrastructure.database.base import Base

from src.infrastructure.database.models.admin_tables_orm import (
    TeaPurchaseORM, TeaBlendSaleORM, BlendCompositionORM, CustomerORM, BlendPurchaseMappingORM
)

logger = logging.getLogger("csv_upload")

TABLE_ORM_MAP = {
    "TeaPurchase": TeaPurchaseORM,
    "TeaBlendSale": TeaBlendSaleORM,
    "BlendComposition": BlendCompositionORM,
    "Customer": CustomerORM,
    "BlendPurchaseMapping": BlendPurchaseMappingORM,
}

TABLE_REQUIRED_FIELDS = {
    "TeaPurchase": ["PurchaseDate"],
    "TeaBlendSale": ["SaleDate"],
}

class AdminCSVUploadService:
    def __init__(self, db: Session):
        self.db = db

    def _parse_date_value(self, value):
        if value is None:
            return None
        if isinstance(value, date):
            return value
        if isinstance(value, datetime):
            return value.date()
        if not isinstance(value, str):
            raise ValueError(f"Invalid date value type: {type(value).__name__}")

        candidate = value.strip()
        if not candidate:
            return None

        formats = ("%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y/%m/%d")
        for fmt in formats:
            try:
                return datetime.strptime(candidate, fmt).date()
            except ValueError:
                continue

        raise ValueError(
            f"Invalid date format '{value}'. Expected one of: YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, YYYY/MM/DD"
        )

    def process_csv(self, file, table, mapping):
        orm_class = TABLE_ORM_MAP.get(table)

        if orm_class is None:
            logger.error(f"Unknown table: {table}")
            return {"error": f"Unknown table: {table}"}

        valid_columns = {column.name for column in orm_class.__table__.columns}
        cleaned_mapping = {}
        invalid_fields = []

        for orm_field, csv_column in mapping.items():
            if orm_field not in valid_columns:
                invalid_fields.append(orm_field)
                continue

            if isinstance(csv_column, str) and csv_column.strip():
                cleaned_mapping[orm_field] = csv_column.strip()

        if invalid_fields:
            error_msg = f"Invalid fields for {table}: {', '.join(invalid_fields)}"
            logger.error(error_msg)
            return {"error": error_msg}

        raw_bytes = file.file.read()
        try:
            decoded_text = raw_bytes.decode("utf-8-sig")
        except UnicodeDecodeError:
            try:
                decoded_text = raw_bytes.decode("latin-1")
            except UnicodeDecodeError as e:
                logger.error(f"CSV decode error: {e}")
                return {"error": "Unable to decode CSV file. Please upload a UTF-8 encoded CSV."}

        decoded = decoded_text.splitlines()
        reader = csv.DictReader(decoded)
        required_fields = TABLE_REQUIRED_FIELDS.get(table, [])
        missing_required_mappings = [
            field for field in required_fields if not cleaned_mapping.get(field)
        ]

        if missing_required_mappings:
            error_msg = (
                "Missing required CSV mappings for fields: "
                + ", ".join(missing_required_mappings)
            )
            logger.error(error_msg)
            return {
                "table": table,
                "total_rows": 0,
                "successful_rows": 0,
                "failed_rows": 0,
                "errors": [{"mapping_error": error_msg}],
                "fatal_error": error_msg,
            }

        objects = []
        total = 0
        success = 0
        errors = []

        for index, row in enumerate(reader, start=1):
            total += 1
            try:
                # Map CSV columns to ORM fields
                orm_kwargs = {}
                for orm_field, csv_column in cleaned_mapping.items():
                    value = row.get(csv_column)
                    # Type conversion for known fields
                    if value is not None:
                        if isinstance(value, str):
                            value = value.strip()
                            if value == "":
                                value = None
                    if value is not None:
                        if orm_field.lower().endswith("id"):
                            value = int(value)
                        elif "date" in orm_field.lower():
                            value = self._parse_date_value(value)
                        elif "price" in orm_field.lower() or "quantity" in orm_field.lower() or "ratio" in orm_field.lower():
                            value = float(value)
                    orm_kwargs[orm_field] = value

                missing_required_values = [
                    field for field in required_fields if orm_kwargs.get(field) is None
                ]
                if missing_required_values:
                    raise ValueError(
                        "Missing required values for fields: "
                        + ", ".join(missing_required_values)
                    )

                obj = orm_class(**orm_kwargs)
                objects.append(obj)
                success += 1
            except Exception as e:
                logger.error(f"Row {index} error: {e}")
                errors.append({"row": index, "error": str(e), "data": row})

        if objects:
            try:
                self.db.bulk_save_objects(objects)
                self.db.commit()
                logger.info(f"Inserted {len(objects)} rows into {table}.")
            except (IntegrityError, DataError) as e:
                logger.error(f"DB data error during commit: {e}")
                self.db.rollback()
                errors.append({"db_error": str(e)})
                return {
                    "table": table,
                    "total_rows": total,
                    "successful_rows": 0,
                    "failed_rows": total,
                    "errors": errors,
                    "fatal_error": "Database rejected one or more rows. Check IDs, duplicates, and numeric/date formats.",
                }
            except Exception as e:
                logger.error(f"DB commit error: {e}")
                self.db.rollback()
                errors.append({"db_error": str(e)})
                return {
                    "table": table,
                    "total_rows": total,
                    "successful_rows": 0,
                    "failed_rows": total,
                    "errors": errors,
                    "fatal_error": "Database commit failed. No rows were inserted.",
                }

        return {
            "table": table,
            "total_rows": total,
            "successful_rows": success,
            "failed_rows": total - success,
            "errors": errors,
        }
