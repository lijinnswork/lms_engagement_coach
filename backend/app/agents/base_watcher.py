from typing import Any, Dict
from sqlalchemy.orm import Session
from app.db.models import User, LMSDataCache, CoachMessage
from sqlalchemy import desc

class WatcherResult:
    def __init__(
        self,
        should_speak: bool = False,
        priority: int = 5,
        agent_name: str = "base",
        observation: Dict[str, Any] = None,
        reasoning: str = "",
        suggested_action: str = "",
        context_for_message: Dict[str, Any] = None
    ):
        self.should_speak = should_speak
        self.priority = priority
        self.agent_name = agent_name
        self.observation = observation or {}
        self.reasoning = reasoning
        self.suggested_action = suggested_action
        self.context_for_message = context_for_message or {}

class BaseWatcher:
    agent_name: str = "base"

    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        raise NotImplementedError

    async def _get_user(self, user_id: str, db: Session):
        return db.query(User).filter(User.id == user_id).first()

    async def _get_lms_data(self, user_id: str, db: Session):
        return db.query(LMSDataCache).filter(LMSDataCache.user_id == user_id).all()

    async def _get_recent_moods(self, user_id: str, db: Session, count: int=5):
        return db.query(MoodCheckIn).filter(MoodCheckIn.user_id == user_id).order_by(desc(MoodCheckIn.created_at)).limit(count).all()

    async def _get_recent_coach_messages(self, user_id: str, db: Session, count: int=5):
        from app.db.models import CoachConversation
        # First we need convo mapping or just join
        return db.query(CoachMessage).join(CoachConversation).filter(
            CoachConversation.user_id == user_id, 
            CoachMessage.is_proactive == True
        ).order_by(desc(CoachMessage.created_at)).limit(count).all()

    async def _get_active_goals(self, user_id: str, db: Session):
        from app.db.models import Goal
        return db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "active").all()
