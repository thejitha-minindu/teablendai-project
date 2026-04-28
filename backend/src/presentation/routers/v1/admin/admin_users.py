from fastapi import APIRouter
from src.application.use_cases.admin.admin_user_service import *

router = APIRouter(prefix="")

@router.get("/pending")
def get_pending():
    users = get_pending_users()
    return {"users": users}


@router.put("/approve/{user_id}")
def approve(user_id: str):
    approve_user(user_id)
    return {"message": "User approved"}


@router.patch("/approve-seller/{user_id}")
def approve_seller(user_id: str):
    approve_user(user_id)
    return {"message": "Seller request approved"}


@router.put("/reject/{user_id}")
def reject(user_id: str):
    reject_user(user_id)
    return {"message": "User rejected"}
