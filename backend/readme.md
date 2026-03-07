creating connection with datbase

1. Setup models with correct lengths (sqlalchemy) "String(64)"
2. Setup ENV for database url "DATABASE_URL=mysql://<username>:<password>@localhost:3306/<database_name>"
3. run ' alembic revision --autogenerate -m "create bids table" '
4. run ' alembic upgrade head '
