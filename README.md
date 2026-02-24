# teablendai-project
AI-powered analytics and real-time auction platform for the Sri Lankan tea industry.

## Local connection setup (DB + backend + frontend)

1. Create environment file from template:
	- Copy `.env.development.example` to `backend/.env`
2. Fill DB variables in `backend/.env`:
	- `MSSQL_SERVER`
	- `MSSQL_DATABASE`
	- `DB_TRUSTED_CONNECTION=yes` (or set username/password fields)
3. Set frontend API base in `frontend/.env.local`:
	- `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api/v1`
4. Start backend:
	- `cd backend`
	- `venv\Scripts\activate`
	- `uvicorn src.application.main:app --host 0.0.0.0 --port 5000`
5. Start frontend:
	- `cd frontend`
	- `npm install`
	- `npm run dev`

Health checks:
- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost:3000`
