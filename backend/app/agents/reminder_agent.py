import datetime
from sqlalchemy.orm import Session
from app.db.models.user import User
from app.db.models.goals import Goal
from app.db.models.reminders import Reminder, ReminderSuggestion
from app.agents.base_watcher import BaseWatcher, WatcherResult

class ReminderSuggestionAgent(BaseWatcher):
    """
    Analyzes Goal pacing and existing Reminders to suggest new study sessions.
    Rules:
    1. Goal pacing: If goal end date is close and progress is low, suggest session.
    2. Missing routine: If no active reminders exist for the week, suggest one.
    """
    
    def __init__(self):
        super().__init__(
            name="reminder_agent",
            description="Analyzes schedule to propose proactive reminders."
        )
        
    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        now = datetime.datetime.utcnow()
        today = now.date()
        
        # Check active goals
        goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.status == "in_progress").all()
        for goal in goals:
            if goal.target_date and goal.progress < 100:
                days_left = (goal.target_date - today).days
                if 0 < days_left <= 7 and goal.progress < 80:
                    # Check if suggestion already exists
                    existing = db.query(ReminderSuggestion).filter(
                        ReminderSuggestion.user_id == user_id,
                        ReminderSuggestion.suggested_title == f"Study Session for: {goal.title}",
                        ReminderSuggestion.status == "pending"
                    ).first()
                    
                    if not existing:
                        suggestion = ReminderSuggestion(
                            user_id=user_id,
                            suggested_title=f"Study Session for: {goal.title}",
                            suggested_type="study_session",
                            suggested_date=today + datetime.timedelta(days=1),
                            suggested_time=datetime.time(18, 0),
                            reasoning=f"Your goal '{goal.title}' is due in {days_left} days. You are at {goal.progress}%. A study session tomorrow evening might help you catch up!"
                        )
                        db.add(suggestion)
                        db.commit()
                        
                        return WatcherResult(
                            agent_name=self.name,
                            observation={"goal_id": goal.id, "days_left": days_left, "progress": goal.progress},
                            should_speak=False, # We don't speak, we just create a suggestion
                            reasoning="Created reminder suggestion for lagging goal."
                        )
        
        return WatcherResult(
            agent_name=self.name,
            observation={"status": "No suggestions needed"},
            should_speak=False,
            reasoning="Schedule looks good."
        )
