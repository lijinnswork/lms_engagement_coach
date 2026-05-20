from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

from app.db.models.coach import MessageSender, MessageType, StudentResponse
from app.db.models.agent import AgentName

# -- Messages --

class CoachMessageCreate(BaseModel):
    conversation_id: UUID
    content: str
    message_type: MessageType = MessageType.reply
    is_proactive: bool = False
    triggered_by_agent: Optional[AgentName] = None
    student_response: Optional[StudentResponse] = None

class CoachMessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    sender: MessageSender
    content: str
    message_type: MessageType
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedMessagesResponse(BaseModel):
    items: List[CoachMessageResponse]
    total: int
    page: int
    size: int

# -- Conversations --

class CoachConversationCreate(BaseModel):
    user_id: UUID

class CoachConversationResponse(BaseModel):
    id: UUID
    user_id: UUID
    started_at: datetime
    last_message_at: datetime
    summary: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

# -- Coach Notes --

class CoachNotesResponse(BaseModel):
    learning_patterns: List[str]
    wellbeing: List[str]
    goals: List[str]
    courses: List[str]
    last_updated: datetime
