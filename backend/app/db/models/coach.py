import enum
import uuid
from typing import Optional
from datetime import datetime

from sqlalchemy import Enum as SQLAlchemyEnum, Text, ForeignKey, DateTime, Index, Boolean
from sqlalchemy.types import Uuid as UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base, TimestampMixin
from .agent import AgentName

class MessageSender(str, enum.Enum):
    coach   = "coach"
    student = "student"

class MessageType(str, enum.Enum):
    greeting          = "greeting"
    check_in          = "check_in"
    celebration       = "celebration"
    goal_suggestion   = "goal_suggestion"
    wellbeing_offer   = "wellbeing_offer"
    reflection_prompt = "reflection_prompt"
    response          = "response"
    reply             = "reply"

class StudentResponse(str, enum.Enum):
    positive          = "positive"
    neutral           = "neutral"
    dismissed         = "dismissed"
    overwhelmed_button = "overwhelmed_button"

class CoachConversation(Base):
    __tablename__ = "coach_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    last_message_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    summary: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    __table_args__ = (
        Index("ix_coach_conversations_user_last", "user_id", "last_message_at"),
    )

class CoachMessage(Base, TimestampMixin):
    __tablename__ = "coach_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("coach_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender: Mapped[MessageSender] = mapped_column(SQLAlchemyEnum(MessageSender, name="message_sender"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    message_type: Mapped[MessageType] = mapped_column(SQLAlchemyEnum(MessageType, name="message_type"), nullable=False)
    is_proactive: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    
    # We must explicitly quote "AgentName" or import it to avoid circular imports.
    # In SQLite this is a plain VARCHAR, but in postgres it's an ENUM type. We will configure it as SQLAlchemyEnum.
    # We import AgentName from .agent directly.
    triggered_by_agent: Mapped[Optional[AgentName]] = mapped_column(SQLAlchemyEnum(AgentName, name="agent_name"), nullable=True)
    student_response: Mapped[Optional[StudentResponse]] = mapped_column(SQLAlchemyEnum(StudentResponse, name="student_response"), nullable=True)

    __table_args__ = (
        Index("ix_coach_messages_conversation_created", "conversation_id", "created_at"),
        Index("ix_coach_messages_proactive", "is_proactive", "triggered_by_agent"),
    )
