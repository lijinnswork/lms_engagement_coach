from sqlalchemy.orm import Session
from datetime import datetime, timezone
from .base_watcher import WatcherResult
from app.db.models import CoachConversation, CoachMessage, MessageSender, MessageType, AgentLog, User, AgentName

class DeliveryService:
    async def deliver(self, user_id: str, message_text: str, watcher_result: WatcherResult, db: Session) -> CoachMessage:
        conversation = await self._get_or_create_conversation(user_id, db)

        message_type_enum = self._map_action_to_type(watcher_result.suggested_action)
        # Assuming model supports passing enum values by attribute or name
        agent_name_enum = getattr(AgentName, watcher_result.agent_name, AgentName.engagement)

        coach_msg = CoachMessage(
            conversation_id=conversation.id,
            sender=MessageSender.coach,
            content=message_text,
            message_type=message_type_enum,
            is_proactive=True,
            triggered_by_agent=agent_name_enum,
            created_at=datetime.now(timezone.utc)
        )
        db.add(coach_msg)

        conversation.last_message_at = datetime.now(timezone.utc)

        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.coach_interactions_week = getattr(user, "coach_interactions_week", 0) + 1

        db.flush() # ensure coach_msg gets an ID

        log = AgentLog(
            user_id=user_id,
            agent_name=agent_name_enum,
            observation={"message_preview": message_text[:100]},
            decision="speak",
            reasoning=f"Delivered message from {watcher_result.agent_name}",
            action_taken="message_sent",
            priority=watcher_result.priority,
            message_id=coach_msg.id,
            created_at=datetime.now(timezone.utc)
        )
        db.add(log)

        db.commit()
        return coach_msg

    async def _get_or_create_conversation(self, user_id, db):
        conversation = db.query(CoachConversation).filter(CoachConversation.user_id == user_id).first()
        if not conversation:
            conversation = CoachConversation(user_id=user_id)
            db.add(conversation)
            db.flush()
        return conversation

    def _map_action_to_type(self, action: str):
        mapping = {
            "check_in": MessageType.check_in,
            "celebrate": MessageType.celebration,
            "offer_breathe": MessageType.wellbeing_offer,
            "adjust_goal": MessageType.goal_suggestion,
            "reflect_curiosity": MessageType.reflection_prompt,
            "nudge": MessageType.check_in,
        }
        return mapping.get(action, MessageType.check_in)
