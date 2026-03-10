from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import json
import logging
from src.infrastructure.database.base import get_db
from src.application.use_cases.admin.csv_upload_use_case import CSVUploadUseCase

router = APIRouter(prefix="/csv-upload", tags=["Admin CSV"])
logger = logging.getLogger("csv_upload")

def get_csv_upload_service(db: Session = Depends(get_db)):
    return CSVUploadUseCase(db)

# Upload CSV endpoint
@router.post("")
async def upload_csv(
    file: UploadFile = File(...),
    table: str = Form(...),
    mapping: str = Form(...),
    service: CSVUploadUseCase = Depends(get_csv_upload_service)
):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files allowed")

    try:
        mapping_dict = json.loads(mapping)
        result = service.process_csv(file, table, mapping_dict)
        if result.get("error"):
            raise HTTPException(status_code=400, detail=result)
        if result.get("fatal_error"):
            # Validation-style fatal errors should not surface as internal server errors.
            if result.get("errors") and (
                result["errors"][0].get("mapping_error")
                or result["errors"][0].get("db_error")
            ):
                raise HTTPException(status_code=400, detail=result)
            raise HTTPException(status_code=500, detail=result)
        if result.get("total_rows", 0) > 0 and result.get("successful_rows", 0) == 0 and result.get("errors"):
            raise HTTPException(status_code=400, detail=result)
        return result
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON")
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Unhandled error in /api/v1/admin/csv-upload")
        raise HTTPException(status_code=500, detail=str(e))
