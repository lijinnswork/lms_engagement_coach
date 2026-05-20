from sqlalchemy.orm import Session
from .base_watcher import BaseWatcher, WatcherResult
from datetime import datetime, timezone

class EngagementWatcher(BaseWatcher):
    agent_name: str = "engagement"

    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        user = await self._get_user(user_id, db)
        lms_data = await self._get_lms_data(user_id, db)

        if not lms_data:
            return WatcherResult(False, 6, self.agent_name, {}, "No LMS data found", "", {})

        # Analyze the most recent LMS data point
        recent_data = lms_data[0].data
        if not recent_data or "progress_details" not in recent_data:
            return WatcherResult(False, 6, self.agent_name, {}, "Invalid LMS data format", "", {})

        progress = recent_data["progress_details"]
        last_active_str = progress.get("last_active_at")
        
        days_since_last_login = 0
        if last_active_str:
            try:
                last_active = datetime.fromisoformat(last_active_str)
                days_since_last_login = (datetime.now(timezone.utc) - last_active).days
            except ValueError:
                pass
                
        engagement_score = progress.get("engagement_score", 1.0)
        completed = progress.get("completed_components", 0)
        total = progress.get("total_components", 1)
        completion_ratio = completed / total if total > 0 else 0

        # Triggers
        if days_since_last_login >= 4:
            return WatcherResult(
                should_speak=True,
                priority=6,
                agent_name=self.agent_name,
                observation={"days_since_last_login": days_since_last_login, "course_id": recent_data.get("course_id")},
                reasoning=f"Student was active but has gone quiet for {days_since_last_login} days",
                suggested_action="check_in",
                context_for_message={"days_inactive": days_since_last_login, "course_id": recent_data.get("course_id")}
            )
        elif engagement_score < 0.5:
            return WatcherResult(
                should_speak=True,
                priority=6,
                agent_name=self.agent_name,
                observation={"engagement_score": engagement_score},
                reasoning=f"Activity dropped significantly. Engagement score is {engagement_score}",
                suggested_action="check_in",
                context_for_message={"engagement_score": engagement_score, "completion_ratio": completion_ratio}
            )

        return WatcherResult(
            should_speak=False,
            priority=6,
            agent_name=self.agent_name,
            observation={"days_since_last_login": days_since_last_login},
            reasoning="Student activity is normal",
            suggested_action="",
            context_for_message={}
        )
