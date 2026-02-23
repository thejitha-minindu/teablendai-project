from app.database import get_connection

def insert_data(table_name, rows):
    conn = get_connection()
    cursor = conn.cursor()

    for row in rows:
        fields = ", ".join(row.keys())
        placeholders = ", ".join(["?"] * len(row))
        values = list(row.values())

        sql = f"INSERT INTO {table_name} ({fields}) VALUES ({placeholders})"
        cursor.execute(sql, values)

    conn.commit()
    cursor.close()
    conn.close()
