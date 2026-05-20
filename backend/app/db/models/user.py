from typing import Optional, List
from datetime import datetime, time
import uuid

from sqlalchemy import String, Boolean, Integer, DateTime, Time, ForeignKey, CheckConstraint
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin

from sqlalchemy.sql import func

class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)

    __table_args__ = (
        CheckConstraint("name IN ('student', 'instructor', 'admin')", name="check_valid_role_name"),
    )

class UserRole(Base):
    __tablename__ = "user_roles"
    
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    role_id: Mapped[int] = mapped_column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    openedx_user_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    lms_username: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="student")
    coach_interactions_week: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    last_login: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    notification_preference: Mapped[Optional["NotificationPreference"]] = relationship(back_populates="user", uselist=False)

    @property
    def coach_interaction_count_week(self) -> int:
        return self.coach_interactions_week

    @property
    def notification_preferences(self) -> dict:
        if self.notification_preference:
            return {
                "quiet_start": self.notification_preference.quiet_start.strftime("%H:%M") if self.notification_preference.quiet_start else "22:00",
                "quiet_end": self.notification_preference.quiet_end.strftime("%H:%M") if self.notification_preference.quiet_end else "08:00",
                "max_per_week": self.notification_preference.max_per_week,
                "email_enabled": self.notification_preference.email_enabled,
                "in_app_enabled": self.notification_preference.in_app_enabled,
            }
        return {
            "quiet_start": "22:00",
            "quiet_end": "08:00",
            "max_per_week": 3,
            "email_enabled": True,
            "in_app_enabled": True,
        }

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    quiet_start: Mapped[time] = mapped_column(Time, nullable=False, default=time(22, 0))
    quiet_end: Mapped[time] = mapped_column(Time, nullable=False, default=time(8, 0))
    max_per_week: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    email_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    in_app_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    __table_args__ = (
        CheckConstraint("max_per_week >= 1 AND max_per_week <= 7", name="check_valid_max_per_week"),
    )

    user: Mapped["User"] = relationship(back_populates="notification_preference")
