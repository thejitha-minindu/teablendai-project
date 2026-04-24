from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from google.oauth2 import id_token
from google.auth.transport import requests
import secrets
import logging

logger = logging.getLogger(__name__)

from src.infrastructure.database.base import get_db
from src.domain.models.user import User
from src.application.schemas.user import Token, UserCreate, GoogleToken, RoleSwitchRequest
from src.application.security import verify_password, get_password_hash, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from src.application.dependencies import get_current_user
from src.infrastructure.services.auth_service import AuthService
from src.infrastructure.services.email_service import EmailService
from datetime import timedelta
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter()

GOOGLE_CLIENT_ID = "66190572875-bnen1rjau39fma3pd86c1d6udqm22dri.apps.googleusercontent.com"

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if the email is already registered
    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email is already registered"
        )
    
    # 2. Check if the username is already taken
    existing_username = db.query(User).filter(User.user_name == user_data.user_name).first()
    if existing_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Username is already taken"
        )

    # 3. Hash the password
    hashed_pwd = get_password_hash(user_data.password)
    
    # 4. Create the new database user
    # We use model_dump() to get the data, but explicitly exclude the raw password
    db_user = User(
        **user_data.model_dump(exclude={"password"}), 
        hashed_password=hashed_pwd,
        verification_status="pending"
    )
    
    # 5. Save to database
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message": "User registered successfully", "user_id": str(db_user.user_id)}

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(
            status_code=401,
            detail="This email is not registered. Please sign up first"
        )

    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=401,
            detail="Incorrect password. Please try again."
        )
    
    access_token = create_access_token(
        data={
            "sub": user.email,
            "role": user.default_role,
            "roles": ["buyer", "seller"],
            "id": str(user.user_id),
            "status": (user.verification_status or "PENDING").upper(),
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/google", response_model=Token)
def google_auth(request: GoogleToken, db: Session = Depends(get_db)):
    try:
        logger.info("Google auth: verifying token with client_id=%s", GOOGLE_CLIENT_ID)
        logger.info("Google auth: token (first 50 chars): %s...", request.token[:50] if request.token else "EMPTY")
        
        id_info = id_token.verify_oauth2_token(
            request.token, requests.Request(), GOOGLE_CLIENT_ID
        )
        
        logger.info("Google auth: token verified successfully, id_info=%s", id_info)
        email = id_info.get("email")
        
        if not email:
            raise HTTPException(status_code=401, detail="Google token did not contain email")
        
        user = db.query(User).filter(User.email == email).first()
        
        # If user doesn't exist, register them automatically
        if not user:
            random_password = secrets.token_urlsafe(32)
            user = User(
                email=email,
                first_name=id_info.get("given_name", "Unknown"),
                last_name=id_info.get("family_name", "Unknown"),
                user_name=email.split("@")[0],
                phone_num="N/A",
                default_role="buyer",
                hashed_password=get_password_hash(random_password),
                profile_image_url=id_info.get("picture"),
                verification_status="pending"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            logger.info("Google auth: new user created for %s", email)
        else:
            logger.info("Google auth: existing user found for %s", email)

        access_token = create_access_token(
            data={
                "sub": user.email,
                "role": user.default_role,
                "roles": ["buyer", "seller"],
                "id": str(user.user_id),
                "status": (user.verification_status or "PENDING").upper(),
            },
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        return {"access_token": access_token, "token_type": "bearer"}
    except ValueError as e:
        logger.error("Google auth ValueError: %s", str(e))
        raise HTTPException(status_code=401, detail=f"Invalid Google token: {str(e)}")
    except Exception as e:
        logger.error("Google auth unexpected error: %s: %s", type(e).__name__, str(e))
        raise HTTPException(status_code=401, detail=f"Google authentication failed: {str(e)}")


@router.post("/switch-role", response_model=Token)
def switch_role(
    request: RoleSwitchRequest,
    current_user: User = Depends(get_current_user),
):
    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "role": request.role,
            "roles": ["buyer", "seller"],
            "id": str(current_user.user_id),
            "status": (current_user.verification_status or "PENDING").upper(),
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


@router.post("/refresh", response_model=Token)
def refresh_token(current_user: User = Depends(get_current_user)):
    access_token = create_access_token(
        data={
            "sub": current_user.email,
            "role": current_user.default_role,
            "roles": ["buyer", "seller"],
            "id": str(current_user.user_id),
            "status": (current_user.verification_status or "PENDING").upper(),
        },
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": access_token, "token_type": "bearer"}


# ===================== PASSWORD RESET ENDPOINTS =====================

class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password endpoint."""
    email: str = Field(..., description="User email address")


class VerifyOTPRequest(BaseModel):
    """Request schema for OTP verification."""
    email: str = Field(..., description="User email address")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""
    email: str = Field(..., description="User email address")
    otp_code: str = Field(..., min_length=6, max_length=6, description="6-digit OTP code")
    new_password: str = Field(..., min_length=8, description="New password (minimum 8 characters)")
    confirm_password: str = Field(..., min_length=8, description="Password confirmation")


@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Request password reset OTP. Email must be registered.
    
    Returns:
        - status: "success" if email found and OTP sent
        - message: Confirmation message
    """
    normalized_request_email = request.email.strip()
    logger.info(f"Forgot password request for email: {normalized_request_email}")
    
    user = AuthService.get_user_by_email(db, normalized_request_email)
    
    if not user:
        logger.warning(f"User not found for email: {request.email}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No account found with this email address"
        )
    
    logger.info(f"Found user: {user.user_id} with email: {user.email}")
    
    try:
        password_reset = AuthService.create_password_reset_request(db, str(user.user_id))
        logger.info(f"Created password reset request for user {user.user_id}, OTP: {password_reset.otp_code}")
        
        logger.info(f"Sending OTP email to: {user.email} (user: {user.first_name or 'Unknown'})")
        sent = EmailService.send_otp_email(
            user.email,
            password_reset.otp_code,
            user.first_name or "User"
        )
        
        if not sent:
            logger.error(f"Failed to send OTP email to {user.email}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send OTP. Please check email configuration and try again."
            )
        
        logger.info(f"OTP email sent successfully to {user.email}")
        return {
            "status": "success",
            "message": "OTP sent to your email. Valid for 5 minutes.",
            "email": user.email
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in forgot-password: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP. Please try again."
        )


@router.post("/verify-otp")
def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    """
    Verify OTP code for password reset.
    
    Returns:
        - status: "success" if OTP is valid
        - password_reset_id: ID to use in password reset endpoint
    """
    user = AuthService.get_user_by_email(db, request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    password_reset = AuthService.verify_otp(
        db,
        str(user.user_id),
        request.otp_code
    )
    
    if not password_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP. Please request a new one."
        )
    
    return {
        "status": "success",
        "message": "OTP verified successfully",
        "password_reset_id": str(password_reset.id)
    }


@router.get("/debug/smtp")
def debug_smtp():
    """
    Debug endpoint to check SMTP settings.
    """
    from src.config import get_settings
    settings = get_settings()
    return {
        "SMTP_HOST": settings.SMTP_HOST,
        "SMTP_PORT": settings.SMTP_PORT,
        "SMTP_USER": settings.SMTP_USER,
        "SMTP_FROM_EMAIL": settings.SMTP_FROM_EMAIL,
    }


class TestEmailRequest(BaseModel):
    """Request schema for testing email sending."""
    email: str = Field(..., description="Email address to send test OTP to")


@router.post("/test-email")
def test_email(request: TestEmailRequest):
    """
    Debug endpoint to test email sending to any address.
    """
    logger.info(f"Test email request for: {request.email}")
    
    # Generate a test OTP
    test_otp = "123456"  # Fixed for testing
    
    sent = EmailService.send_otp_email(
        request.email,
        test_otp,
        "Test User"
    )
    
    if sent:
        logger.info(f"Test email sent successfully to {request.email}")
        return {"status": "success", "message": f"Test OTP sent to {request.email}"}
    else:
        logger.error(f"Failed to send test email to {request.email}")
        return {"status": "error", "message": f"Failed to send test email to {request.email}"}


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """
    Reset password with verified OTP.
    
    Returns:
        - status: "success" if password reset successfully
    """
    # Validate password match
    if request.new_password != request.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Passwords do not match"
        )
    
    # Validate password strength
    if len(request.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )
    
    user = AuthService.get_user_by_email(db, request.email)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify OTP one more time
    password_reset = AuthService.verify_otp(
        db,
        str(user.user_id),
        request.otp_code
    )
    
    if not password_reset:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP. Please request a new password reset."
        )
    
    # Reset password
    success = AuthService.reset_password(
        db,
        str(user.user_id),
        request.new_password,
        str(password_reset.id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reset password. Please try again."
        )
    
    # Send confirmation email
    try:
        EmailService.send_password_reset_confirmation_email(
            user.email,
            user.first_name or "User"
        )
    except Exception as e:
        # Log the error but don't fail the request
        logger.warning(f"Failed to send confirmation email: {str(e)}")
    
    return {
        "status": "success",
        "message": "Password reset successfully. You can now log in with your new password."
    }
