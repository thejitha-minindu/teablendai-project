from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.infrastructure.database.connection import get_db
from src.infrastructure.repositories.admin.admin_repository import AdminRepository
from src.application.use_cases.admin.get_dashboard_stats import GetDashboardStatsUseCase

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])


@router.get("/dashboard-stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    repo = AdminRepository(db)
    usecase = GetDashboardStatsUseCase(repo)

    return usecase.execute()