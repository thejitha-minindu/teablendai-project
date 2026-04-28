from src.infrastructure.database.connection import engine
from sqlalchemy import text


def get_pending_users():
    query = text(
        """
        SELECT
            user_id,
            first_name,
            last_name,
            email,
            default_role,
            verification_status,
            seller_verification_status,
            seller_name,
            seller_registration_no
        FROM dbo.users
        WHERE LOWER(ISNULL(verification_status, '')) = 'pending'
           OR LOWER(ISNULL(seller_verification_status, '')) = 'pending'
        """
    )

    users = []
    with engine.connect() as conn:
        result = conn.execute(query)
        rows = result.fetchall()

        for row in rows:
            account_status = (row[5] or "").upper()
            seller_status = (row[6] or "").upper()
            pending_type = "seller_upgrade" if account_status != "PENDING" and seller_status == "PENDING" else "account"
            users.append({
                "user_id": str(row[0]),
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "role": row[4],
                "status": row[5],
                "seller_status": row[6],
                "seller_name": row[7],
                "seller_registration_no": row[8],
                "pending_type": pending_type,
            })

    return users


def approve_user(user_id: str):
    query = text(
        """
        SELECT verification_status, seller_verification_status
        FROM dbo.users
        WHERE user_id = :user_id
        """
    )

    with engine.connect() as conn:
        row = conn.execute(query, {"user_id": user_id}).fetchone()

    if not row:
        return

    account_status = (row[0] or "").upper()
    seller_status = (row[1] or "").upper()

    if account_status == "APPROVED" and seller_status == "PENDING":
        seller_query = text(
            """
            UPDATE dbo.users
            SET seller_verification_status = 'APPROVED',
                default_role = 'seller',
                seller_approved_at = GETUTCDATE(),
                seller_rejection_reason = NULL
            WHERE user_id = :user_id
            """
        )
        with engine.begin() as conn:
            conn.execute(seller_query, {"user_id": user_id})
        return

    query = text(
        """
        UPDATE dbo.users
        SET verification_status = 'APPROVED',
            status = 'APPROVED',
            seller_verification_status = CASE
                WHEN LOWER(ISNULL(default_role, '')) = 'seller' THEN 'APPROVED'
                ELSE seller_verification_status
            END,
            seller_approved_at = CASE
                WHEN LOWER(ISNULL(default_role, '')) = 'seller' THEN GETUTCDATE()
                ELSE seller_approved_at
            END
        WHERE user_id = :user_id
        """
    )

    with engine.begin() as conn:
        conn.execute(query, {"user_id": user_id})


def reject_user(user_id: str):
    query = text(
        """
        SELECT verification_status, seller_verification_status
        FROM dbo.users
        WHERE user_id = :user_id
        """
    )

    with engine.connect() as conn:
        row = conn.execute(query, {"user_id": user_id}).fetchone()

    if not row:
        return

    account_status = (row[0] or "").upper()
    seller_status = (row[1] or "").upper()

    if account_status == "APPROVED" and seller_status == "PENDING":
        seller_query = text(
            """
            UPDATE dbo.users
            SET seller_verification_status = 'REJECTED',
                seller_rejection_reason = 'Seller upgrade request was rejected by admin'
            WHERE user_id = :user_id
            """
        )
        with engine.begin() as conn:
            conn.execute(seller_query, {"user_id": user_id})
        return

    query = text(
        """
        UPDATE dbo.users
        SET verification_status = 'REJECTED',
            status = 'REJECTED',
            seller_verification_status = CASE
                WHEN LOWER(ISNULL(default_role, '')) = 'seller' THEN 'REJECTED'
                ELSE seller_verification_status
            END,
            seller_rejection_reason = CASE
                WHEN LOWER(ISNULL(default_role, '')) = 'seller' THEN 'Seller account request was rejected by admin'
                ELSE seller_rejection_reason
            END
        WHERE user_id = :user_id
        """
    )

    with engine.begin() as conn:
        conn.execute(query, {"user_id": user_id})
