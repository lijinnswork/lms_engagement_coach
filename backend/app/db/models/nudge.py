import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import String, ForeignKey, Text, DateTime, Boolean, Integer, UniqueConstraint
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func
from app.db.base import Base, TimestampMixin

class NudgeRangeConfig(Base, TimestampMixin):
    __tablename__ = "nudge_range_configs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    range_name: Mapped[str] = mapped_column(String(255), nullable=False)
    from_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    to_pct: Mapped[int] = mapped_column(Integer, nullable=False)
    tone: Mapped[str] = mapped_column(String(50), nullable=False)
    is_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    message_template: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    stuck_trigger_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    max_repeats: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    display_order: Mapped[int] = mapped_column(Integer, nullable=False)

class PendingNudge(Base):
    __tablename__ = "pending_nudges"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_id: Mapped[str] = mapped_column(String(255), nullable=False)
    course_name: Mapped[str] = mapped_column(String(255), nullable=False)
    nudge_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "range_entry", "range_stuck", "inactivity", "goal_behind"
    message: Mapped[str] = mapped_column(Text, nullable=False)
    range_config_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("nudge_range_configs.id", ondelete="SET NULL"), nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    generated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    is_dismissed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    dismissed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    remind_later_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    action_taken: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # "dismissed", "opened_course", "remind_later"

class NudgeRangeHistory(Base):
    __tablename__ = "nudge_range_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    course_id: Mapped[str] = mapped_column(String(255), nullable=False)
    range_config_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("nudge_range_configs.id", ondelete="CASCADE"), nullable=False)
    entry_nudge_sent_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    stuck_nudge_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_stuck_nudge_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "course_id", "range_config_id", name="uq_user_course_range"),
    )

class NudgeGlobalSettings(Base):
    __tablename__ = "nudge_global_settings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    inactivity_threshold_days: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    goal_behind_threshold_pct: Mapped[int] = mapped_column(Integer, default=50, nullable=False)
    max_active_nudges: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    nudge_expiry_days: Mapped[int] = mapped_column(Integer, default=7, nullable=False)
    email_nudges_enabled: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    respect_student_email_setting: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )
