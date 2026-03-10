from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.csv_service import process_csv

router = APIRouter()

@router.post("/upload-csv")
async def upload_csv(
    table: str = Form(...),
    mapping: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    inserted = process_csv(file, table, mapping, db)

    return {
        "success": True,
        "inserted_rows": inserted
    }