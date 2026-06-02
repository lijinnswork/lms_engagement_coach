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
                        
        # Check pending assessments due within next 3 days
        from app.db.models.lms_data_cache import LMSDataCache
        
        cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == user_id).all()
        for entry in cache_entries:
            d = entry.data
            course_name = d.get("course_name", d.get("name", "Course"))
            course_id = d.get("course_id")
            assessments = d.get("assessments", [])
            for ass in assessments:
                if not ass.get("graded", False):
                    due_date_str = ass.get("due_date") or ass.get("timestamp")
                    if not due_date_str:
                        continue
                    try:
                        due_dt = datetime.datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                        due_date = due_dt.date()
                        
                        days_left = (due_date - today).days
                        if 0 <= days_left <= 3:
                            title = f"Study for {ass.get('assessment_name')}"
                            existing = db.query(ReminderSuggestion).filter(
                                ReminderSuggestion.user_id == user_id,
                                ReminderSuggestion.suggested_title == title,
                                ReminderSuggestion.status == "pending"
                            ).first()
                            
                            if not existing:
                                # Suggest study session for tomorrow or today
                                suggested_date = today + datetime.timedelta(days=1) if days_left > 1 else today
                                suggestion = ReminderSuggestion(
                                    user_id=user_id,
                                    suggested_title=title,
                                    suggested_type="study_session",
                                    suggested_date=suggested_date,
                                    suggested_time=datetime.time(18, 0),
                                    suggested_course_id=course_id,
                                    reasoning=f"Your assessment '{ass.get('assessment_name')}' in {course_name} is due in {days_left} days. A study session will help you prepare!"
                                )
                                db.add(suggestion)
                                db.commit()
                                
                                return WatcherResult(
                                    agent_name=self.name,
                                    observation={"assessment_name": ass.get('assessment_name'), "course_id": course_id, "days_left": days_left},
                                    should_speak=False,
                                    reasoning=f"Created reminder suggestion for upcoming assessment: {ass.get('assessment_name')}."
                                )
                    except Exception:
                        pass
        
        return WatcherResult(
            agent_name=self.name,
            observation={"status": "No suggestions needed"},
            should_speak=False,
            reasoning="Schedule looks good."
        )
