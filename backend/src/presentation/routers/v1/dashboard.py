from fastapi import APIRouter
import sys
import os

# Add database module to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', '..'))
from database.connection import create_db_connection

from api.models.dashboard import DashboardResponse
from api.services.dashboard_service import DashboardService

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

def get_dashboard_service() -> DashboardService:
    """Create dashboard service instance"""
    engine = create_db_connection()
    return DashboardService(engine)

@router.get("", response_model=DashboardResponse)
async def get_dashboard_data():
    """Get complete dashboard data with statistics and charts"""
    dashboard_service = get_dashboard_service()
    return dashboard_service.get_complete_dashboard_data()

@router.get("/stats")
async def get_stats():
    """Get overall statistics"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'stats': dashboard_service.get_dashboard_stats()
    }

@router.get("/customers")
async def get_top_customers(limit: int = 10):
    """Get top customers by purchase amount"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'customers': dashboard_service.get_top_customers(limit)
    }

@router.get("/blends")
async def get_top_blends(limit: int = 10):
    """Get top tea blends by sales"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'blends': dashboard_service.get_top_blends(limit)
    }

@router.get("/sales")
async def get_monthly_sales(months: int = 12):
    """Get monthly sales data"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'sales': dashboard_service.get_monthly_sales(months)
    }

@router.get("/purchases")
async def get_monthly_purchases(months: int = 12):
    """Get monthly purchase data"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'purchases': dashboard_service.get_monthly_purchases(months)
    }

@router.get("/trends")
async def get_conversation_trends(days: int = 30):
    """Get conversation and message trends"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'trends': dashboard_service.get_conversation_trends(days)
    }

@router.get("/activity")
async def get_recent_activity(limit: int = 10):
    """Get recent activity"""
    dashboard_service = get_dashboard_service()
    return {
        'success': True,
        'activity': dashboard_service.get_recent_activity(limit)
    }
