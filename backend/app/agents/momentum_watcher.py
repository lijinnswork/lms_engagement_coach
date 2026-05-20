from sqlalchemy.orm import Session
from .base_watcher import BaseWatcher, WatcherResult

class MomentumWatcher(BaseWatcher):
    agent_name: str = "momentum"

    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        # Mock LMS parsing
        milestone = "First module completed"
        consistency_streak = 7
        modules_completed_this_week = 1
        
        if milestone:
            return WatcherResult(True, 3, self.agent_name, {"milestone": milestone}, f"Student hit milestone: {milestone}", "celebrate", {"milestone_type": milestone, "course_name": "Python Fundamentals", "progress_pct": 50})
        elif consistency_streak >= 7:
            return WatcherResult(True, 3, self.agent_name, {"consistency_streak": consistency_streak}, "First 7-day consistency streak", "celebrate", {"streak_days": consistency_streak})
        
        return WatcherResult(False, 3, self.agent_name, {}, "No momentum triggers", "", {})
