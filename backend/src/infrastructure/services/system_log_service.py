from uuid import UUID
from typing import Optional
import logging

from sqlalchemy.orm import Session
from src.infrastructure.repositories.system_log_repository import SystemLogRepository

logger = logging.getLogger(__name__)


class SystemLogService:
    """Service for creating system log entries with convenience wrappers."""

    def __init__(self, db: Session):
        self.repo = SystemLogRepository(db)

    def log(
        self,
        activity_type: str,
        details: str,
        status: str = "success",
        user_name: str = "System",
        user_id: Optional[UUID] = None,
        ip_address: Optional[str] = None,
        request=None,
    ):
        """Core log method. All convenience wrappers call this."""
        # Auto-extract IP from FastAPI Request if provided
        if request and not ip_address:
            try:
                ip_address = request.client.host if request.client else None
            except Exception:
                pass

        try:
            return self.repo.create({
                "user_name": user_name,
                "user_id": str(user_id) if user_id else None,
                "activity_type": activity_type,
                "status": status,
                "ip_address": ip_address,
                "details": details,
            })
        except Exception as e:
            # Log errors but don't break the main request flow
            logger.error(f"Failed to write system log: {e}")
            return None

    # ── Convenience Wrappers ──────────────────────────────────────────

    def log_login(self, user_name: str, user_id: UUID = None, status: str = "success", ip: str = None):
        detail = "User logged in successfully" if status == "success" else "Login attempt failed"
        self.log("Login", detail, status=status, user_name=user_name, user_id=user_id, ip_address=ip)

    def log_bid(self, user_name: str, user_id: UUID = None, auction_ref: str = "", status: str = "success"):
        self.log("Bid Placed", f"Placed bid on Auction #{auction_ref}", status=status, user_name=user_name, user_id=user_id)

    def log_document_upload(self, user_name: str, user_id: UUID = None, status: str = "success"):
        self.log("Document Upload", "Uploaded verification documents", status=status, user_name=user_name, user_id=user_id)

    def log_user_verified(self, admin_name: str, target_user_name: str):
        self.log("User Verified", f"Admin verified user: {target_user_name}", status="success", user_name=admin_name)

    def log_user_deleted(self, admin_name: str, target_user_name: str, status: str = "error"):
        self.log("User Deleted", f"Admin rejected/deleted user: {target_user_name}", status=status, user_name=admin_name)

    def log_payment(self, user_name: str, user_id: UUID = None, amount: str = "", status: str = "success"):
        self.log("Payment Processed", f"Processed payment of {amount}", status=status, user_name=user_name, user_id=user_id)

    def log_auction_created(self, seller_name: str, auction_ref: str = ""):
        self.log("Auction Created", f"Created auction #{auction_ref}", status="success", user_name=seller_name)

    def log_auction_cancelled(self, admin_name: str, auction_ref: str = ""):
        self.log("Auction Cancelled", f"Cancelled auction #{auction_ref}", status="warning", user_name=admin_name)

    def log_violation_flagged(self, user_name: str, target_ref: str = ""):
        self.log("Violation Flagged", f"Flagged violation for: {target_ref}", status="warning", user_name=user_name)

    def log_violation_resolved(self, admin_name: str, target_ref: str = ""):
        self.log("Violation Resolved", f"Resolved violation: {target_ref}", status="success", user_name=admin_name)

    def log_profile_updated(self, user_name: str, user_id: UUID = None):
        self.log("Profile Updated", "Updated profile information", status="success", user_name=user_name, user_id=user_id)

    def log_system_settings_changed(self, admin_name: str, detail: str = ""):
        self.log("System Settings Changed", detail or "Modified system configuration", status="warning", user_name=admin_name)
