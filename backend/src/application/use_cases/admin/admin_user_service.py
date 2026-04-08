from src.infrastructure.database.connection import engine
from sqlalchemy import text


def get_pending_users():
    query = text(
        """
        SELECT user_id, first_name, last_name, email, default_role, verification_status
        FROM dbo.users
        WHERE verification_status = 'pending'
        """
    )

    users = []
    with engine.connect() as conn:
        result = conn.execute(query)
        rows = result.fetchall()

        for row in rows:
            users.append({
                "user_id": str(row[0]),
                "first_name": row[1],
                "last_name": row[2],
                "email": row[3],
                "role": row[4],
                "status": row[5]
            })

    return users


def approve_user(user_id: str):
    query = text(
        """
        UPDATE dbo.users
        SET verification_status = 'approved'
        WHERE user_id = :user_id
        """
    )

    with engine.begin() as conn:
        conn.execute(query, {"user_id": user_id})


def reject_user(user_id: str):
    query = text(
        """
        UPDATE dbo.users
        SET verification_status = 'rejected'
        WHERE user_id = :user_id
        """
    )

    with engine.begin() as conn:
        conn.execute(query, {"user_id": user_id})