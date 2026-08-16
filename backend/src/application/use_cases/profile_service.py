from datetime import datetime
import os
from uuid import uuid4
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, status, UploadFile
from sqlalchemy.orm import Session

from src.application.schemas.profile import BecomeSellerRequest, ChangePasswordRequest, SellerProfileDetails, UserProfileResponse, UserProfileUpdate
from src.application.security import get_password_hash, verify_password
from src.domain.models.user import User, FinancialDetails


class ProfileService:
    def __init__(self, db: Session):
        self.db = db

    @staticmethod
    def get_available_roles(user: User) -> list[str]:
        verification_status = (user.verification_status or "PENDING").upper()
        seller_verification_status = (user.seller_verification_status or "").upper()

        roles: list[str] = []
        if verification_status == "APPROVED":
            roles.append("buyer")

        if verification_status == "APPROVED" and (
            (user.default_role or "").lower() == "seller"
            or seller_verification_status == "APPROVED"
        ):
            roles.append("seller")

        if not roles:
            roles.append("seller" if (user.default_role or "").lower() == "seller" else "buyer")

        unique_roles: list[str] = []
        for role in roles:
            if role not in unique_roles:
                unique_roles.append(role)
        return unique_roles

    def build_profile_response(self, user: User, active_role: str | None = None) -> UserProfileResponse:
        available_roles = self.get_available_roles(user)
        resolved_active_role = active_role if active_role in ("buyer", "seller") else available_roles[0]
        watch_list_ids = [str(entry.auction_id) for entry in user.watch_list] if user.watch_list else []
        return UserProfileResponse(
            user_id=str(user.user_id),
            email=user.email,
            phone_num=user.phone_num,
            user_name=user.user_name,
            first_name=user.first_name,
            last_name=user.last_name,
            nic=getattr(user, "nic", None),
            default_role=user.default_role,
            active_role=resolved_active_role,  # type: ignore[arg-type]
            available_roles=available_roles,  # type: ignore[arg-type]
            verification_status=(user.verification_status or "PENDING").upper(),
            seller_verification_status=(
                "APPROVED" if (user.verification_status or "").upper() == "APPROVED" and (user.default_role or "").lower() == "seller"
                else ((user.seller_verification_status or "").upper() or None)
            ),
            seller_requested_at=getattr(user, "seller_requested_at", None),
            seller_approved_at=getattr(user, "seller_approved_at", None),
            seller_rejection_reason=getattr(user, "seller_rejection_reason", None),
            can_become_seller=(
                (user.verification_status or "PENDING").upper() == "APPROVED"
                and (user.seller_verification_status or "").upper() not in {"PENDING", "APPROVED"}
                and (user.default_role or "").lower() != "seller"
            ),
            profile_image_url=user.profile_image_url,
            shipping_address=getattr(user, "shipping_address", None),
            payment_method=getattr(user, "payment_method", None),
            seller_profile=SellerProfileDetails(
                seller_name=getattr(user, "seller_name", None),
                seller_registration_no=getattr(user, "seller_registration_no", None),
                seller_started_year=getattr(user, "seller_started_year", None),
                seller_website=getattr(user, "seller_website", None),
                seller_description=getattr(user, "seller_description", None),
                seller_street_address=getattr(user, "seller_street_address", None),
                seller_province=getattr(user, "seller_province", None),
                seller_city=getattr(user, "seller_city", None),
                seller_postal_code=getattr(user, "seller_postal_code", None),
            ),
            financial_details=user.financial_details,
            watch_list=watch_list_ids,
        )

    def get_profile(self, current_user: User, active_role: str | None = None) -> UserProfileResponse:
        return self.build_profile_response(current_user, active_role)

    def update_profile(
        self,
        payload: UserProfileUpdate,
        current_user: User,
        active_role: str | None = None,
    ) -> UserProfileResponse:
        update_data = payload.model_dump(exclude_unset=True)
        if not update_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No fields provided for update",
            )

        if "email" in update_data:
            existing = (
                self.db.query(User)
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
                self.db.query(User)
                .filter(User.user_name == update_data["user_name"], User.user_id != current_user.user_id)
                .first()
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username is already taken",
                )
            current_user.user_name = update_data["user_name"]

        for field in (
            "phone_num",
            "first_name",
            "last_name",
            "nic",
            "profile_image_url",
            "shipping_address",
            "payment_method",
            "seller_name",
            "seller_registration_no",
            "seller_started_year",
            "seller_website",
            "seller_description",
            "seller_street_address",
            "seller_province",
            "seller_city",
            "seller_postal_code",
        ):
            if field in update_data:
                if hasattr(current_user, field):
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
                self.db.add(financial_details)
                current_user.financial_details = financial_details
            else:
                for field, value in details_update.items():
                    setattr(current_user.financial_details, field, value)

        self.db.commit()
        self.db.refresh(current_user)
        return self.build_profile_response(current_user, active_role)

    def become_seller(
        self,
        payload: BecomeSellerRequest,
        current_user: User,
        active_role: str | None = None,
    ) -> UserProfileResponse:
        account_status = (current_user.verification_status or "PENDING").upper()
        seller_status = (current_user.seller_verification_status or "").upper()

        if account_status != "APPROVED":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account must be approved before requesting seller access.",
            )

        if seller_status == "PENDING":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your seller request is already pending review.",
            )

        if seller_status == "APPROVED" or (current_user.default_role or "").lower() == "seller":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Your account already has seller access.",
            )

        current_user.seller_name = payload.seller_name
        current_user.seller_registration_no = payload.seller_registration_no
        current_user.seller_started_year = payload.seller_started_year
        current_user.seller_website = payload.seller_website
        current_user.seller_description = payload.seller_description
        current_user.seller_street_address = payload.seller_street_address
        current_user.seller_province = payload.seller_province
        current_user.seller_city = payload.seller_city
        current_user.seller_postal_code = payload.seller_postal_code
        current_user.seller_verification_status = "PENDING"
        current_user.seller_rejection_reason = None
        current_user.seller_requested_at = datetime.utcnow()
        current_user.seller_approved_at = None

        self.db.commit()
        self.db.refresh(current_user)
        return self.build_profile_response(current_user, active_role)

    def change_password(self, payload: ChangePasswordRequest, current_user: User) -> None:
        if not verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        if payload.current_password == payload.new_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="New password must be different from current password",
            )

        current_user.hashed_password = get_password_hash(payload.new_password)
        self.db.commit()

    def upload_profile_image(self, file: UploadFile, current_user: User) -> dict:
        if not file.content_type.startswith("image/"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file type. Only images are allowed.",
            )

        try:
            result = cloudinary.uploader.upload(file.file)
            public_url = result.get("secure_url")
            if not public_url:
                raise Exception("No secure_url returned from Cloudinary.")
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload image to Cloudinary: {str(e)}"
            )
        
        current_user.profile_image_url = public_url
        self.db.commit()
        
        return {"profile_image_url": public_url}
