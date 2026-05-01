from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from src.infrastructure.database.connection import get_db
from src.application.use_cases.admin.admin_profile_service import (
    get_admin_profile,
    update_admin_profile
)

router = APIRouter()

# ✅ GET
@router.get("/{admin_id}")
def fetch_admin(admin_id: str, db: Session = Depends(get_db)):
    return get_admin_profile(db, admin_id)


# ✅ PUT (NEW)
@router.put("/{admin_id}")
def update_admin(
    admin_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    return update_admin_profile(db, admin_id, data)