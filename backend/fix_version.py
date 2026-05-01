from src.database import create_database_connection
from sqlalchemy import text

engine = create_database_connection()
with engine.connect() as conn:
    # Update to a known valid revision
    conn.execute(text("UPDATE alembic_version SET version_num = '01041068504a'"))
    conn.commit()
    print('Updated alembic_version to 01041068504a')