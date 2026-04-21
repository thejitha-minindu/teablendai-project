# teablendai-project
AI-powered analytics and real-time auction platform for the Sri Lankan tea industry.

## Local connection setup (DB + backend + frontend)

1. Create environment file from template:
	- Copy `.env.development.example` to `backend/.env`
2. Fill DB variables in `backend/.env`:
	- Local SQL Server (Windows auth): `MSSQL_SERVER`, `MSSQL_DATABASE`, `DB_TRUSTED_CONNECTION=yes`
	- Azure SQL (SQL auth): `MSSQL_SERVER`, `MSSQL_PORT=1433`, `MSSQL_DATABASE`, `MSSQL_USERNAME`, `MSSQL_PASSWORD`, `DB_TRUSTED_CONNECTION=false`, `MSSQL_ENCRYPT=yes`, `MSSQL_TRUST_SERVER_CERTIFICATE=no`
	- Optional: set `DATABASE_URL` to a full SQLAlchemy URL (this overrides `MSSQL_*`)
3. Set frontend API base in `frontend/.env`:
	- `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1`
	- `NEXT_PUBLIC_API_WS_URL=ws://localhost:8000/api/v1`
	
4. Start backend:
	- `cd backend`
	- `venv\Scripts\activate`
	- `uvicorn src.application.main:app --host 0.0.0.0 --port 8000`
5. Start frontend:
	- `cd frontend`
	- `npm install`
	- `npm run dev`

Health checks:
- Backend: `http://localhost:8000/health`
- Frontend: `http://localhost:3000`
