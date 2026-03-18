creating connection with datbase

1. Setup models with correct lengths (sqlalchemy) "String(64)"
2. Setup ENV for SQL Server:
   - `MSSQL_SERVER`, `MSSQL_DATABASE`
   - Local Windows auth: `DB_TRUSTED_CONNECTION=true`
   - Azure SQL auth: `MSSQL_PORT=1433`, `MSSQL_USERNAME`, `MSSQL_PASSWORD`, `DB_TRUSTED_CONNECTION=false`, `MSSQL_ENCRYPT=yes`, `MSSQL_TRUST_SERVER_CERTIFICATE=no`
   - Optional override: `DATABASE_URL=mssql+pyodbc://<username>:<password>@<server>,1433/<database>?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=yes&TrustServerCertificate=no`
3. run ' alembic revision --autogenerate -m "create bids table" '
4. run ' alembic upgrade head '
