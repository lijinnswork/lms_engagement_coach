from sqlalchemy.orm import Session
from sqlalchemy import desc
from .base_watcher import BaseWatcher, WatcherResult
from app.db.models import CoachMessage, CoachConversation
import re

class CuriosityWatcher(BaseWatcher):
    agent_name: str = "curiosity"

    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        # Fetch the last 5 messages sent by the student
        student_msgs = db.query(CoachMessage).join(CoachConversation).filter(
            CoachConversation.user_id == user_id,
            CoachMessage.is_proactive == False,
            CoachMessage.sender == "user"
        ).order_by(desc(CoachMessage.created_at)).limit(5).all()

        if not student_msgs:
            return WatcherResult(False, 5, self.agent_name, {}, "No recent student messages", "", {})

        questions_asked = 0
        analytical_keywords_found = []
        analytical_words = {"why", "how", "what if", "explain", "understand", "curious", "compare", "difference"}

        for msg in student_msgs:
            text = msg.text.lower()
            if "?" in text:
                questions_asked += text.count("?")
            
            for word in analytical_words:
                if re.search(r'\b' + word + r'\b', text):
                    analytical_keywords_found.append(word)

        if questions_asked >= 2 or len(analytical_keywords_found) >= 2:
            return WatcherResult(
                should_speak=True, 
                priority=3, 
                agent_name=self.agent_name, 
                observation={"questions_asked": questions_asked, "keywords": list(set(analytical_keywords_found))}, 
                reasoning=f"Student asked {questions_asked} questions and used analytical words: {', '.join(set(analytical_keywords_found))} recently.", 
                suggested_action="reflect_curiosity", 
                context_for_message={
                    "questions_asked": questions_asked, 
                    "analytical_keywords": list(set(analytical_keywords_found)),
                    "last_message": student_msgs[0].text
                }
            )

        return WatcherResult(False, 5, self.agent_name, {}, "No curiosity triggers detected in recent chat.", "", {})
