from src.infrastructure.database.connection import get_connection
from src.infrastructure.database.models.admin import Admin

def get_admin_by_id(admin_id: int):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT admin_id, username, email, first_name, last_name,
        role, joined_date, last_login, status
        FROM admins WHERE admin_id = %s
    """, (admin_id,))

    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "admin_id": row[0],
            "username": row[1],
            "email": row[2],
            "firstName": row[3],
            "lastName": row[4],
            "role": row[5],
            "joined": str(row[6]),
            "lastLogin": str(row[7]),
            "status": row[8]
        }

    return None