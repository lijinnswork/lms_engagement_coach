import enum
import uuid
from typing import Optional

from sqlalchemy import String, Text, ForeignKey, Index, Enum as SQLAlchemyEnum, JSON
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin

class AgentName(str, enum.Enum):
    engagement         = "engagement"
    wellbeing          = "wellbeing"
    momentum           = "momentum"
    goal               = "goal"
    curiosity          = "curiosity"
    decision_engine    = "decision_engine"
    delivery_service   = "delivery_service"
    engagement_watcher = "engagement_watcher"
    momentum_watcher   = "momentum_watcher"
    wellbeing_watcher  = "wellbeing_watcher"
    goal_watcher       = "goal_watcher"
    curiosity_watcher  = "curiosity_watcher"
    motivation_watcher = "motivation_watcher"

class AgentDecision(str, enum.Enum):
    speak        = "speak"
    stay_silent  = "stay_silent"
    wait         = "wait"
    error        = "error"
    sent         = "sent"

class AgentLog(Base, TimestampMixin):
    __tablename__ = "agent_logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    agent_name: Mapped[AgentName] = mapped_column(SQLAlchemyEnum(AgentName, name="agent_name"), nullable=False)
    observation: Mapped[dict] = mapped_column(JSON, nullable=False)
    decision: Mapped[AgentDecision] = mapped_column(SQLAlchemyEnum(AgentDecision, name="agent_decision"), nullable=False)
    reasoning: Mapped[str] = mapped_column(Text, nullable=False)
    priority: Mapped[Optional[int]] = mapped_column(nullable=True)
    message_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("coach_messages.id", ondelete="CASCADE"), nullable=True)
    action_taken: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)

    __table_args__ = (
        Index("ix_agent_logs_user_agent_created", "user_id", "agent_name", "created_at"),
        Index("ix_agent_logs_decision", "decision", "created_at"),
    )
