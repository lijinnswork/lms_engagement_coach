import uuid
from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel

class ReminderBase(BaseModel):
    title: str
    reminder_type: str
    date: date
    time: time
    course_id: Optional[str] = None
    notes: Optional[str] = None
    repeat: str = "none"
    repeat_interval_days: Optional[int] = None
    remind_at: List[str] = []

class ReminderCreate(ReminderBase):
    pass

class ReminderUpdate(BaseModel):
    title: Optional[str] = None
    date: Optional[date] = None
    time: Optional[time] = None
    remind_at: Optional[List[str]] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class ReminderResponse(ReminderBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_by: str
    source_id: Optional[str] = None
    status: str
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ReminderSuggestionResponse(BaseModel):
    id: uuid.UUID
    suggested_title: str
    suggested_type: str
    suggested_date: date
    suggested_time: time
    suggested_course_id: Optional[str] = None
    reasoning: str
    status: str

    class Config:
        from_attributes = True

class SnoozeRequest(BaseModel):
    duration: str

class PushSubscriptionCreate(BaseModel):
    subscription_json: dict
