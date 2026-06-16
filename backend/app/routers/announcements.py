from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.db.models.announcement import Announcement, AnnouncementDismissal
from app.db.models.user import User
from app.api.deps import get_current_user
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

router = APIRouter(prefix="/announcements", tags=["announcements"])

class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    text: str
    type: str
    action_url: Optional[str]
    action_text: Optional[str]
    source: str
    target_audience: str
    start_date: datetime
    end_date: datetime
    is_active: bool

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AnnouncementResponse])
async def get_active_announcements(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.utcnow()
    # Find IDs of announcements already dismissed by the current user
    dismissed_ids = [d.announcement_id for d in db.query(AnnouncementDismissal).filter(AnnouncementDismissal.user_id == current_user.id).all()]
    
    announcements = db.query(Announcement).filter(
        Announcement.is_active == True,
        Announcement.start_date <= now,
        Announcement.end_date >= now,
        ~Announcement.id.in_(dismissed_ids) if dismissed_ids else True
    ).all()
    return announcements

@router.post("/{announcement_id}/dismiss")
async def dismiss_announcement(announcement_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Save dismissal to database so they do not reappear
    dismissal = AnnouncementDismissal(announcement_id=announcement_id, user_id=current_user.id)
    db.add(dismissal)
    db.commit()
    return {"status": "success", "message": "Announcement dismissed"}

@router.get("/admin", response_model=List[AnnouncementResponse])
async def admin_get_announcements(db: Session = Depends(get_db)):
    return db.query(Announcement).order_by(Announcement.created_at.desc()).all()

class AnnouncementCreate(BaseModel):
    text: str
    type: str
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    start_date: datetime
    end_date: datetime

@router.post("/admin", response_model=AnnouncementResponse)
async def admin_create_announcement(data: AnnouncementCreate, db: Session = Depends(get_db)):
    announcement = Announcement(
        text=data.text,
        type=data.type,
        action_url=data.action_url,
        action_text=data.action_text,
        start_date=data.start_date,
        end_date=data.end_date,
        source="manual"
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement

@router.patch("/admin/{announcement_id}", response_model=AnnouncementResponse)
async def admin_update_announcement(announcement_id: uuid.UUID, data: AnnouncementCreate, db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Not found")
    
    announcement.text = data.text
    announcement.type = data.type
    announcement.action_url = data.action_url
    announcement.action_text = data.action_text
    announcement.start_date = data.start_date
    announcement.end_date = data.end_date
    
    db.commit()
    db.refresh(announcement)
    return announcement

@router.delete("/admin/{announcement_id}")
async def admin_delete_announcement(announcement_id: uuid.UUID, db: Session = Depends(get_db)):
    announcement = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(announcement)
    db.commit()
    return {"status": "success"}
