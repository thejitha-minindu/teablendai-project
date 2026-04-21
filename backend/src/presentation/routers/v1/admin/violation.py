from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from src.infrastructure.database.connection import get_db
from src.application.use_cases.admin.violation_service import (
    get_all_violations,
    create_violation
)

router = APIRouter()


# ✅ ADMIN - GET ALL VIOLATIONS
@router.get("/violations")
def fetch_violations(db: Session = Depends(get_db)):
    return get_all_violations(db)


# ✅ USER - CREATE VIOLATION
@router.post("/violations")
def add_violation(data: dict = Body(...), db: Session = Depends(get_db)):
    return create_violation(db, data)