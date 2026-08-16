from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from src.application.use_cases.admin.admin_user_service import *
from src.application.dependencies import get_system_log_service
from src.infrastructure.services.system_log_service import SystemLogService
from src.infrastructure.database.base import get_db
from src.domain.models.user import User

router = APIRouter(prefix="")

@router.get("/pending")
def get_pending():
    users = get_pending_users()
    return {"users": users}


@router.get("/search")
def search_users(query: str):
    if not query or len(query) < 2:
        return {"users": []}
    users = search_users_by_email(query)
    return {"users": users}


@router.put("/approve/{user_id}")
def approve(
    user_id: str,
    db: Session = Depends(get_db),
    log_service: SystemLogService = Depends(get_system_log_service),
):
    approve_user(user_id)
    # Attempt to get user name for logging
    user = db.query(User).filter(User.user_id == user_id).first()
    target_name = user.user_name if user else user_id
    log_service.log_user_verified(admin_name="Admin", target_user_name=target_name)
    return {"message": "User approved"}


@router.patch("/approve-seller/{user_id}")
def approve_seller(
    user_id: str,
    db: Session = Depends(get_db),
    log_service: SystemLogService = Depends(get_system_log_service),
):
    approve_user(user_id)
    user = db.query(User).filter(User.user_id == user_id).first()
    target_name = user.user_name if user else user_id
    log_service.log_user_verified(admin_name="Admin", target_user_name=target_name)
    return {"message": "Seller request approved"}


@router.put("/reject/{user_id}")
def reject(
    user_id: str,
    db: Session = Depends(get_db),
    log_service: SystemLogService = Depends(get_system_log_service),
):
    reject_user(user_id)
    user = db.query(User).filter(User.user_id == user_id).first()
    target_name = user.user_name if user else user_id
    log_service.log_user_deleted(admin_name="Admin", target_user_name=target_name)
    return {"message": "User rejected"}

