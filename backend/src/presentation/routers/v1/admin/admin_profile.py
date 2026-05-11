from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session

from src.infrastructure.database.connection import get_db
from src.application.dependencies import get_current_admin
from src.domain.models.admin import Admin
from src.application.use_cases.admin.admin_profile_service import (
    get_admin_profile,
    update_admin_profile
)

router = APIRouter()

# ✅ GET /me  — resolves admin from JWT token (no UUID needed in URL)
@router.get("/me")
def fetch_admin_me(
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return get_admin_profile(db, str(current_admin.admin_id))


# ✅ PUT /me  — update the currently authenticated admin
@router.put("/me")
def update_admin_me(
    data: dict = Body(...),
    current_admin: Admin = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    return update_admin_profile(db, str(current_admin.admin_id), data)


# ✅ GET /{admin_id}  — kept for direct UUID lookups
@router.get("/{admin_id}")
def fetch_admin(admin_id: str, db: Session = Depends(get_db)):
    return get_admin_profile(db, admin_id)


# ✅ PUT /{admin_id}
@router.put("/{admin_id}")
def update_admin(
    admin_id: str,
    data: dict = Body(...),
    db: Session = Depends(get_db)
):
    return update_admin_profile(db, admin_id, data)