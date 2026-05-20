from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import json
import uuid
import os

from app.database import get_db
from app.db.models.user import User
from app.db.models.user_session import UserSession
from app.db.models.goals import Goal
from app.db.models.coach import CoachMessage
from app.db.models.reminders import Reminder
from app.db.models.lms_data_cache import LMSDataCache
from app.api.deps import get_current_user, oauth2_scheme
from app.services.auth_service import verify_password, get_password_hash
from pydantic import BaseModel
from fastapi.responses import Response

router = APIRouter(prefix="/account", tags=["account"])

class ProfileUpdate(BaseModel):
    full_name: str = None
    avatar_url: str = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

@router.get("/profile")
def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "role": current_user.role,
        "openedx_user_id": current_user.openedx_user_id,
        "lms_username": current_user.lms_username,
        "created_at": current_user.created_at,
        "last_login": current_user.last_login
    }

@router.patch("/profile")
def update_profile(data: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.full_name is not None:
        if len(data.full_name.strip()) < 2:
            raise HTTPException(status_code=400, detail="Name too short")
        current_user.full_name = data.full_name
    if data.avatar_url is not None:
        current_user.avatar_url = data.avatar_url
    db.commit()
    db.refresh(current_user)
    return {"message": "Profile updated successfully"}

@router.post("/avatar")
async def upload_avatar(file: UploadFile = File(...), current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Simulating upload to local storage or S3
    if file.size > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large")
        
    upload_dir = "uploads/avatars"
    os.makedirs(upload_dir, exist_ok=True)
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{file_ext}"
    filepath = os.path.join(upload_dir, filename)
    
    with open(filepath, "wb") as buffer:
        buffer.write(await file.read())
        
    avatar_url = f"/api/uploads/avatars/{filename}" # Assuming serving static files
    current_user.avatar_url = avatar_url
    db.commit()
    return {"avatar_url": avatar_url}

@router.delete("/avatar")
def delete_avatar(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.avatar_url = None
    db.commit()
    return {"message": "Avatar removed"}

@router.post("/password")
def change_password(data: PasswordUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
        
    current_user.password_hash = get_password_hash(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}

@router.get("/sessions")
def get_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False
    ).order_by(UserSession.last_active.desc()).all()
    
    # We don't have token in this context easily to mark 'is_current', but the frontend can figure it out or we can match the last_active being very recent.
    # Actually, we can get token from Depends(oauth2_scheme) and decode session_id
    return sessions

@router.post("/sessions/revoke-others")
def revoke_other_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    from jose import jwt
    from app.config import settings
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    current_session_id = payload.get("session_id")
    
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_revoked == False
    ).all()
    
    for session in sessions:
        if str(session.id) != current_session_id:
            session.is_revoked = True
            
    db.commit()
    return {"message": "Other sessions revoked"}

class ConnectLmsRequest(BaseModel):
    lms_username: str

@router.get("/openedx/status")
def openedx_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.lms_username:
        cache = db.query(LMSDataCache).filter(LMSDataCache.user_id == current_user.id).first()
        last_synced = cache.created_at if cache else None
        return {
            "connected": True,
            "username": current_user.lms_username,
            "last_synced": last_synced.isoformat() if last_synced else None
        }
    return {"connected": False, "username": None, "last_synced": None}

@router.post("/openedx/connect")
async def openedx_connect(
    request: ConnectLmsRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not request.lms_username:
        raise HTTPException(status_code=400, detail="LMS username is required")
        
    current_user.lms_username = request.lms_username
    current_user.openedx_user_id = request.lms_username
    db.commit()

    try:
        from app.services.openedx_client import openedx_client
        await openedx_client.sync_user_lms_data(db, current_user)
    except Exception as e:
        return {"message": "Connected, but initial sync failed", "warning": str(e)}

    return {"message": "Successfully connected and synced to Open edX"}

@router.post("/openedx/sync")
async def openedx_sync(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not current_user.lms_username:
        raise HTTPException(status_code=400, detail="Not connected to Open edX")
    
    try:
        from app.services.openedx_client import openedx_client
        await openedx_client.sync_user_lms_data(db, current_user)
        return {"message": "Sync complete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@router.post("/openedx/disconnect")
def openedx_disconnect(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.openedx_user_id = None
    current_user.lms_username = None
    db.commit()
    return {"message": "Disconnected from Open edX"}

@router.get("/data-summary")
def data_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals_count = db.query(Goal).filter(Goal.user_id == current_user.id).count()
    messages_count = db.query(CoachMessage).filter(
        CoachMessage.conversation.has(user_id=current_user.id)
    ).count()
    reminders_count = db.query(Reminder).filter(Reminder.user_id == current_user.id).count()
    
    courses_count = db.query(LMSDataCache).filter(LMSDataCache.user_id == current_user.id).count()
        
    return {
        "courses": courses_count,
        "goals": goals_count,
        "messages": messages_count,
        "reminders": reminders_count
    }

@router.get("/export")
def export_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    reminders = db.query(Reminder).filter(Reminder.user_id == current_user.id).all()
    
    export_data = {
        "profile": {
            "name": current_user.full_name,
            "email": current_user.email,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "goals": [{"id": str(g.id), "title": g.title, "status": g.status} for g in goals],
        "reminders": [{"id": str(r.id), "title": r.title} for r in reminders]
    }
    
    return Response(
        content=json.dumps(export_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=learner-data-{datetime.now().strftime('%Y-%m-%d')}.json"}
    )

@router.delete("/")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Cascade delete is handled by DB relationships if configured correctly
    # Otherwise, manual deletion of related records may be needed.
    # Assuming SQLAlchemy handles CASCADE due to ondelete="CASCADE" in models
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}
