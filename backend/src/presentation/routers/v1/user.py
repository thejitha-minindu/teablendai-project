from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from src.database import get_db
from src.application.dependencies import get_current_user
from src.application.schemas.user import UserProfileResponse, UserProfileUpdate
from src.domain.models.user import User, FinancialDetails

router = APIRouter()

def _build_user_profile_response(user: User) -> UserProfileResponse:
    watch_list_ids = [str(entry.auction_id) for entry in user.watch_list] if user.watch_list else []
    return UserProfileResponse(
        user_id=str(user.user_id),
        email=user.email,
        phone_num=user.phone_num,
        user_name=user.user_name,
        first_name=user.first_name,
        last_name=user.last_name,
        default_role=user.default_role,
        profile_image_url=user.profile_image_url,
        financial_details=user.financial_details,
        watch_list=watch_list_ids,
    )

@router.get("/users/me", response_model=UserProfileResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return _build_user_profile_response(current_user)

@router.put("/users/me", response_model=UserProfileResponse)
def update_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    if "email" in update_data:
        existing = (
            db.query(User)
            .filter(User.email == update_data["email"], User.user_id != current_user.user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already registered",
            )
        current_user.email = update_data["email"]

    if "user_name" in update_data:
        existing = (
            db.query(User)
            .filter(User.user_name == update_data["user_name"], User.user_id != current_user.user_id)
            .first()
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username is already taken",
            )
        current_user.user_name = update_data["user_name"]

    for field in ("phone_num", "first_name", "last_name", "profile_image_url"):
        if field in update_data:
            setattr(current_user, field, update_data[field])

    if "financial_details" in update_data:
        details_update = payload.financial_details.model_dump(exclude_unset=True)
        if not details_update:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Financial details payload is empty",
            )

        if current_user.financial_details is None:
            required_fields = {"bank_name", "account_num", "branch_name", "account_holder_name"}
            missing = required_fields - set(details_update.keys())
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Missing financial details fields: {', '.join(sorted(missing))}",
                )
            financial_details = FinancialDetails(user_id=current_user.user_id, **details_update)
            db.add(financial_details)
            current_user.financial_details = financial_details
        else:
            for field, value in details_update.items():
                setattr(current_user.financial_details, field, value)

    db.commit()
    db.refresh(current_user)
    return _build_user_profile_response(current_user)
