import uuid
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text = Column(String(200), nullable=False)
    type = Column(String(50), nullable=False) # info, new_course, deadline, achievement, update
    action_url = Column(String(500), nullable=True)
    action_text = Column(String(100), nullable=True)
    source = Column(String(20), nullable=False, default="manual") # manual or auto
    target_audience = Column(String(100), nullable=False, default="all") # all or enrolled:{course_id}
    start_date = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow)
    end_date = Column(DateTime(timezone=True), nullable=False)
    is_active = Column(Boolean, default=True)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class AnnouncementDismissal(Base):
    __tablename__ = "announcement_dismissals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    announcement_id = Column(UUID(as_uuid=True), ForeignKey("announcements.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    dismissed_at = Column(DateTime(timezone=True), default=datetime.utcnow)
