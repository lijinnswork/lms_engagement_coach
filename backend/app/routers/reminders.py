import uuid
import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.reminders import Reminder, ReminderSuggestion, ScheduledNotification
from app.schemas.reminders import ReminderCreate, ReminderUpdate, ReminderResponse, ReminderSuggestionResponse, SnoozeRequest
from app.services.notification_service import schedule_notifications_for_reminder

router = APIRouter(prefix="/api/reminders", tags=["Reminders"])

@router.get("", response_model=Dict[str, List[ReminderResponse]])
def get_reminders(period: str = "all", db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(Reminder).filter(Reminder.user_id == current_user.id)
    
    today = datetime.date.today()
    tomorrow = today + datetime.timedelta(days=1)
    end_of_week = today + datetime.timedelta(days=(6 - today.weekday()))
    
    if period == "today":
        query = query.filter(Reminder.date == today)
    elif period == "tomorrow":
        query = query.filter(Reminder.date == tomorrow)
    elif period == "week":
        query = query.filter(Reminder.date >= today, Reminder.date <= end_of_week)
    
    reminders = query.order_by(Reminder.date, Reminder.time).all()
    
    # Group manually
    grouped = {"today": [], "tomorrow": [], "week": [], "later": [], "completed": []}
    for r in reminders:
        if r.status == "completed":
            grouped["completed"].append(r)
        elif r.date == today:
            grouped["today"].append(r)
        elif r.date == tomorrow:
            grouped["tomorrow"].append(r)
        elif today < r.date <= end_of_week:
            grouped["week"].append(r)
        elif r.date > end_of_week:
            grouped["later"].append(r)
            
    return grouped

@router.post("", response_model=ReminderResponse)
def create_reminder(reminder_in: ReminderCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    new_reminder = Reminder(
        **reminder_in.model_dump(),
        user_id=current_user.id,
        created_by="student",
        status="active"
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    
    schedule_notifications_for_reminder(db, new_reminder)
    db.commit()
    
    return new_reminder

@router.patch("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(reminder_id: uuid.UUID, reminder_in: ReminderUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    update_data = reminder_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(reminder, key, value)
        
    if "status" in update_data and update_data["status"] == "completed":
        reminder.completed_at = datetime.datetime.utcnow()
        
    db.commit()
    db.refresh(reminder)
    
    if any(k in update_data for k in ["date", "time", "remind_at", "status"]):
        schedule_notifications_for_reminder(db, reminder)
        db.commit()
        
    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db.delete(reminder)
    db.commit()
    return {"status": "success"}

@router.post("/{reminder_id}/complete")
def complete_reminder(reminder_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    reminder.status = "completed"
    reminder.completed_at = datetime.datetime.utcnow()
    
    # Check for repeating
    if reminder.repeat != "none":
        next_date = reminder.date
        if reminder.repeat == "daily":
            next_date += datetime.timedelta(days=1)
        elif reminder.repeat == "weekly":
            next_date += datetime.timedelta(days=7)
        elif reminder.repeat == "custom" and reminder.repeat_interval_days:
            next_date += datetime.timedelta(days=reminder.repeat_interval_days)
            
        new_reminder = Reminder(
            user_id=reminder.user_id,
            title=reminder.title,
            reminder_type=reminder.reminder_type,
            date=next_date,
            time=reminder.time,
            course_id=reminder.course_id,
            goal_id=reminder.goal_id,
            notes=reminder.notes,
            repeat=reminder.repeat,
            repeat_interval_days=reminder.repeat_interval_days,
            remind_at=reminder.remind_at,
            created_by=reminder.created_by,
            source_id=reminder.source_id,
            status="active"
        )
        db.add(new_reminder)
        db.commit()
        db.refresh(new_reminder)
        schedule_notifications_for_reminder(db, new_reminder)
        
    # Delete pending notifications for the completed one
    db.query(ScheduledNotification).filter(
        ScheduledNotification.reminder_id == reminder.id,
        ScheduledNotification.sent == False
    ).delete()
    
    db.commit()
    return {"status": "success"}

@router.post("/{reminder_id}/snooze")
def snooze_reminder(reminder_id: uuid.UUID, snooze: SnoozeRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id, Reminder.user_id == current_user.id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    now = datetime.datetime.utcnow()
    snooze_dt = now
    if snooze.duration == "15min":
        snooze_dt = now + datetime.timedelta(minutes=15)
    elif snooze.duration == "30min":
        snooze_dt = now + datetime.timedelta(minutes=30)
    elif snooze.duration == "1hour":
        snooze_dt = now + datetime.timedelta(hours=1)
    elif snooze.duration == "tomorrow":
        snooze_dt = datetime.datetime.combine(now.date() + datetime.timedelta(days=1), reminder.time)
        
    db.add(ScheduledNotification(
        reminder_id=reminder.id,
        user_id=reminder.user_id,
        channel="in_app",
        scheduled_at=snooze_dt,
        snooze_count=1
    ))
    db.commit()
    return {"status": "success", "snoozed_to": snooze_dt}

@router.get("/suggestions", response_model=List[ReminderSuggestionResponse])
def get_suggestions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suggestions = db.query(ReminderSuggestion).filter(
        ReminderSuggestion.user_id == current_user.id,
        ReminderSuggestion.status == "pending"
    ).limit(3).all()
    return suggestions

@router.post("/suggestions/{suggestion_id}/accept", response_model=ReminderResponse)
def accept_suggestion(suggestion_id: uuid.UUID, reminder_in: Optional[ReminderCreate] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suggestion = db.query(ReminderSuggestion).filter(ReminderSuggestion.id == suggestion_id, ReminderSuggestion.user_id == current_user.id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
        
    suggestion.status = "accepted" if not reminder_in else "edited_accepted"
    suggestion.resolved_at = datetime.datetime.utcnow()
    
    if reminder_in:
        reminder_data = reminder_in.model_dump()
    else:
        reminder_data = {
            "title": suggestion.suggested_title,
            "reminder_type": suggestion.suggested_type,
            "date": suggestion.suggested_date,
            "time": suggestion.suggested_time,
            "course_id": suggestion.suggested_course_id,
            "remind_at": ["at_time", "30_min_before"]
        }
        
    new_reminder = Reminder(
        **reminder_data,
        user_id=current_user.id,
        created_by="coach",
        status="active"
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    
    schedule_notifications_for_reminder(db, new_reminder)
    db.commit()
    
    return new_reminder

@router.post("/suggestions/{suggestion_id}/dismiss")
def dismiss_suggestion(suggestion_id: uuid.UUID, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    suggestion = db.query(ReminderSuggestion).filter(ReminderSuggestion.id == suggestion_id, ReminderSuggestion.user_id == current_user.id).first()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
        
    suggestion.status = "dismissed"
    suggestion.resolved_at = datetime.datetime.utcnow()
    db.commit()
    return {"status": "success"}

@router.post("/sync-openedx")
def sync_openedx(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Mocking sync logic
    pass
    return {"status": "success", "synced_count": 0}
