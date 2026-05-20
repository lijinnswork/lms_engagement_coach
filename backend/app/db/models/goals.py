import enum
import uuid
from typing import Optional
from datetime import datetime, date

from sqlalchemy import Enum as SQLAlchemyEnum, String, Text, Integer, ForeignKey, DateTime, Date, Index, CheckConstraint
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base, TimestampMixin

class GoalStatus(str, enum.Enum):
    proposed  = "proposed"
    active    = "active"
    completed = "completed"
    paused    = "paused"

class GoalProposedBy(str, enum.Enum):
    student = "student"
    coach   = "coach"

class Goal(Base, TimestampMixin):
    __tablename__ = "goals"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    course_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    status: Mapped[GoalStatus] = mapped_column(SQLAlchemyEnum(GoalStatus, name="goal_status"), nullable=False, default=GoalStatus.proposed)
    proposed_by: Mapped[GoalProposedBy] = mapped_column(SQLAlchemyEnum(GoalProposedBy, name="goal_proposed_by"), nullable=False)
    
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    target_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    
    progress_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("progress_percent >= 0 AND progress_percent <= 100", name="check_valid_progress_percent"),
        Index("ix_goals_user_status", "user_id", "status"),
        Index("ix_goals_user_course", "user_id", "course_id"),
    )
