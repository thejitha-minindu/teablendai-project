from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from src.application.dependencies import get_current_user, get_token_payload
from src.application.schemas.profile import BecomeSellerRequest, ChangePasswordRequest, UserProfileResponse, UserProfileUpdate
from src.application.use_cases.profile_service import ProfileService
from src.database import get_db
from src.domain.models.user import User

router = APIRouter()


@router.get("/profile/me", response_model=UserProfileResponse)
@router.get("/profile", response_model=UserProfileResponse)
@router.get("/users/me", response_model=UserProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token_payload: dict = Depends(get_token_payload),
):
    service = ProfileService(db)
    return service.get_profile(current_user, token_payload.get("role"))


@router.put("/profile/me", response_model=UserProfileResponse)
@router.put("/profile", response_model=UserProfileResponse)
@router.put("/users/me", response_model=UserProfileResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token_payload: dict = Depends(get_token_payload),
):
    service = ProfileService(db)
    return service.update_profile(payload, current_user, token_payload.get("role"))


@router.post("/profile/become-seller", response_model=UserProfileResponse)
@router.post("/become-seller", response_model=UserProfileResponse)
def become_seller(
    payload: BecomeSellerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    token_payload: dict = Depends(get_token_payload),
):
    service = ProfileService(db)
    return service.become_seller(payload, current_user, token_payload.get("role"))


@router.put("/profile/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProfileService(db)
    service.change_password(payload, current_user)
    return {"message": "Password updated successfully"}


@router.post("/profile/upload-image")
def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = ProfileService(db)
    return service.upload_profile_image(file, current_user)
