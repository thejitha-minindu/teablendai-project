from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.application.dependencies import get_current_user
from src.application.schemas.profile import ChangePasswordRequest, UserProfileResponse, UserProfileUpdate
from src.application.use_cases.profile_service import ProfileService
from src.database import get_db
from src.domain.models.user import User

router = APIRouter()


@router.get("/profile/me", response_model=UserProfileResponse)
@router.get("/users/me", response_model=UserProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProfileService(db)
    return service.get_profile(current_user)


@router.put("/profile/me", response_model=UserProfileResponse)
@router.put("/users/me", response_model=UserProfileResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProfileService(db)
    return service.update_profile(payload, current_user)


@router.put("/profile/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProfileService(db)
    service.change_password(payload, current_user)
    return {"message": "Password updated successfully"}
