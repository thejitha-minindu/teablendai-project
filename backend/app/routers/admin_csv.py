from fastapi import APIRouter, UploadFile, File, Form, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.csv_service import insert_row
from app.services.csv_reader import read_csv_file
import json


router = APIRouter()

@router.post("/upload-csv")
async def upload_csv(
    table: str = Form(...),
    mapping: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    try:
        # convert mapping string to dict
        mapping_dict = json.loads(mapping)

        # read csv using robust helper (handles UploadFile)
        df = read_csv_file(file)

        # rename columns according to mapping
        df = df.rename(columns={v: k for k, v in mapping_dict.items()})

        # convert to records
        records = df.to_dict(orient="records")

        # insert into DB
        for row in records:
            insert_row(table, row, db)

        db.commit()

        return {"message": "Data inserted successfully", "count": len(records)}

    except Exception as e:
        db.rollback()
        return {"error": str(e)}
    