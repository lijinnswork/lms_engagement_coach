import uuid
import datetime
from typing import Optional, List

from sqlalchemy import String, Text, ForeignKey, Integer, Boolean, JSON, Index, Date, Time, DateTime
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

class Reminder(Base, TimestampMixin):
    __tablename__ = "reminders"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    reminder_type: Mapped[str] = mapped_column(String(50), nullable=False)  # study_session, goal_deadline, assignment_deadline
    date: Mapped[datetime.date] = mapped_column(Date, nullable=False, index=True)
    time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    course_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    goal_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    repeat: Mapped[str] = mapped_column(String(50), default="none")  # none, daily, weekly, custom
    repeat_interval_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    remind_at: Mapped[dict] = mapped_column(JSON, default=list)  # List of strings ("at_time", "30_min_before", etc)
    created_by: Mapped[str] = mapped_column(String(50), default="student")  # student, coach, system
    source_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)  # Open edX assignment ID
    status: Mapped[str] = mapped_column(String(50), default="active")  # active, completed, cancelled, snoozed
    completed_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    notifications: Mapped[List["ScheduledNotification"]] = relationship("ScheduledNotification", back_populates="reminder", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_reminders_user_date", "user_id", "date"),
    )

class ReminderSuggestion(Base):
    __tablename__ = "reminder_suggestions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    suggested_title: Mapped[str] = mapped_column(String(255), nullable=False)
    suggested_type: Mapped[str] = mapped_column(String(50), nullable=False)
    suggested_date: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    suggested_time: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    suggested_course_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending")  # pending, accepted, edited_accepted, dismissed
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=datetime.datetime.utcnow)
    resolved_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

class ScheduledNotification(Base):
    __tablename__ = "scheduled_notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reminder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("reminders.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    channel: Mapped[str] = mapped_column(String(50), nullable=False)  # in_app, push, email
    scheduled_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    sent: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    sent_at: Mapped[Optional[datetime.datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    snooze_count: Mapped[int] = mapped_column(Integer, default=0)

    reminder: Mapped["Reminder"] = relationship("Reminder", back_populates="notifications")

class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True)
    subscription_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime.datetime] = mapped_column(DateTime(timezone=True), default=datetime.datetime.utcnow)
