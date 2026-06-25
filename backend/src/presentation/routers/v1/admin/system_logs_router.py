import asyncio
import json
import logging
from datetime import date
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from src.database import get_db, _init_session_factory
from src.application.dependencies import get_current_admin, get_system_log_service
from src.infrastructure.services.system_log_service import SystemLogService
from src.application.schemas.system_log import SystemLogListResponse

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/logs", response_model=SystemLogListResponse)
def get_logs(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    activity_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """
    Get paginated system logs with filters.
    """
    from src.infrastructure.repositories.system_log_repository import SystemLogRepository
    repo = SystemLogRepository(db)
    
    filters = {
        "status": status,
        "activity_type": activity_type,
        "date_from": date_from,
        "date_to": date_to,
        "search": search
    }
    
    skip = (page - 1) * limit
    logs = repo.get_all(filters=filters, skip=skip, limit=limit)
    total = repo.count(filters=filters)
    
    items = []
    for log in logs:
        items.append({
            "id": log.display_id,
            "userName": log.user_name,
            "userId": str(log.user_id) if log.user_id else None,
            "activityType": log.activity_type,
            "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
            "status": log.status,
            "ipAddress": log.ip_address,
            "details": log.details
        })
        
    return {
        "items": items,
        "total": total,
        "skip": skip,
        "limit": limit
    }


def get_sse_admin(token: str = Query(...)):
    from src.application.dependencies import _decode_token
    from src.domain.models.admin import Admin
    _init_session_factory()
    # Ensure session factory is available
    from src.database import _SessionLocal as _SESSION_FACTORY
    if _SESSION_FACTORY is None:
        logger.error("Database session factory is not initialized for SSE endpoint")
        raise HTTPException(status_code=500, detail="Database not initialized for SSE")

    db = _SESSION_FACTORY()
    try:
        payload = _decode_token(token)
        email = payload.get("sub")
        role = payload.get("role")
        if role != "admin":
            raise HTTPException(status_code=403, detail="Not an admin")
        admin = db.query(Admin).filter(Admin.email == email).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        if admin.status != "active":
            raise HTTPException(status_code=403, detail="Account is suspended or inactive")
        return admin
    except HTTPException:
        # Re-raise expected HTTP exceptions so FastAPI can handle them normally
        raise
    except Exception as e:
        logger.exception("Unexpected error in get_sse_admin: %s", e)
        # Return a generic 500 to the client but log details server-side
        raise HTTPException(status_code=500, detail="Internal server error while authorizing SSE")
    finally:
        db.close()


async def log_generator():
    from src.infrastructure.repositories.system_log_repository import SystemLogRepository
    _init_session_factory()

    # Ensure session factory is available at runtime
    from src.database import _SessionLocal as _SESSION_FACTORY
    if _SESSION_FACTORY is None:
        logger.error("Session factory not initialized in log_generator")
        return

    # 1. Fetch initial batch
    db = _SESSION_FACTORY()
    try:
        repo = SystemLogRepository(db)
        recent_logs = repo.get_recent(limit=20)
        sent_ids = {log.log_id for log in recent_logs}
    finally:
        db.close()
        
    # Yield initial logs (oldest first to preserve chronological display in streaming UI)
    for log in reversed(recent_logs):
        data = {
            "id": log.display_id,
            "userName": log.user_name,
            "userId": str(log.user_id) if log.user_id else None,
            "activityType": log.activity_type,
            "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
            "status": log.status,
            "ipAddress": log.ip_address,
            "details": log.details
        }
        yield f"data: {json.dumps(data)}\n\n"
        
    # 2. Poll for new entries
    while True:
        await asyncio.sleep(3)
        db = _SESSION_FACTORY()
        try:
            repo = SystemLogRepository(db)
            current_recent = repo.get_recent(limit=20)
            new_logs = []
            for log in current_recent:
                if log.log_id not in sent_ids:
                    new_logs.append(log)
                    sent_ids.add(log.log_id)
            
            # Yield new logs in chronological order
            for log in reversed(new_logs):
                data = {
                    "id": log.display_id,
                    "userName": log.user_name,
                    "userId": str(log.user_id) if log.user_id else None,
                    "activityType": log.activity_type,
                    "timestamp": log.created_at.strftime("%Y-%m-%d %H:%M:%S") if log.created_at else "",
                    "status": log.status,
                    "ipAddress": log.ip_address,
                    "details": log.details
                }
                yield f"data: {json.dumps(data)}\n\n"
                
            # Keep cache size bounded
            if len(sent_ids) > 100:
                sent_ids = {log.log_id for log in current_recent}
        except Exception as e:
            logger.error(f"SSE generator error: {e}")
        finally:
            db.close()


@router.get("/logs/stream")
async def stream_logs(admin = Depends(get_sse_admin)):
    """
    Establish Server-Sent Events (SSE) stream for system logs.
    """
    return StreamingResponse(log_generator(), media_type="text/event-stream")
