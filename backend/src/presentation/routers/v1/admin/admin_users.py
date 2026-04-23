from fastapi import APIRouter, Depends, HTTPException, status as http_status
from sqlalchemy.orm import Session

from src.infrastructure.database.connection import get_db
from src.domain.models.user import User
from src.application.schemas.user import User as UserSchema, UserApprovalAction
from src.application.dependencies import get_current_user


router = APIRouter(prefix="", tags=["Admin Users"])


@router.get("/users")
def get_users(
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get users, optionally filtered by status.
    Query parameters:
    - status: PENDING, APPROVED, or REJECTED
    
    Returns list of users matching the filter.
    """
    # TODO: Add admin role check here
    query = db.query(User)
    
    if status:
        if status not in ["PENDING", "APPROVED", "REJECTED"]:
            raise HTTPException(
                status_code=http_status.HTTP_400_BAD_REQUEST,
                detail="Invalid status. Must be PENDING, APPROVED, or REJECTED"
            )
        query = query.filter(User.status == status)
    
    users = query.all()
    return [UserSchema.model_validate(user) for user in users]


@router.patch("/users/{user_id}/approve")
def approve_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Approve a user account.
    Changes status from PENDING/REJECTED to APPROVED.
    """
    # TODO: Add admin role check here
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.status = "APPROVED"
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User approved successfully",
        "user": UserSchema.model_validate(user)
    }


@router.patch("/users/{user_id}/reject")
def reject_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reject a user account.
    Changes status to REJECTED.
    """
    # TODO: Add admin role check here
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.status = "REJECTED"
    db.commit()
    db.refresh(user)
    
    return {
        "message": "User rejected successfully",
        "user": UserSchema.model_validate(user)
    }
