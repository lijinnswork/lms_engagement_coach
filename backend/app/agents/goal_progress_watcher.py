from sqlalchemy.orm import Session
from .base_watcher import BaseWatcher, WatcherResult
from datetime import datetime

class GoalProgressWatcher(BaseWatcher):
    agent_name: str = "goal"

    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        goals = await self._get_active_goals(user_id, db)
        if not goals:
            return WatcherResult(False, 4, self.agent_name, {}, "No active goals found", "", {})
            
        now = datetime.utcnow()
        now_date = now.date()
        
        for goal in goals:
            # Check completed
            if goal.progress_percent >= 100:
                return WatcherResult(
                    should_speak=True, 
                    priority=3, 
                    agent_name=self.agent_name,
                    observation={"completed_goal_id": str(goal.id)}, 
                    reasoning=f"Student finished goal: {goal.title}", 
                    suggested_action="celebrate", 
                    context_for_message={"goal_title": goal.title}
                )
                
            # Compute pace if target date exists
            if goal.target_date:
                # Need created_at to calculate total days. using approved_at if it's proposed_by coach, else created_at
                start_date = (goal.approved_at or goal.created_at).date()
                total_days = (goal.target_date - start_date).days
                
                if total_days > 0:
                    days_elapsed = (now_date - start_date).days
                    # Prevent going over 1 if overdue
                    expected_ratio = min(max(days_elapsed / total_days, 0), 1.0)
                    expected_progress = expected_ratio * 100
                    
                    if goal.progress_percent < expected_progress * 0.5 and expected_progress > 20:
                        return WatcherResult(
                            should_speak=True, 
                            priority=4, 
                            agent_name=self.agent_name,
                            observation={"behind_goal_id": str(goal.id), "expected": expected_progress, "actual": goal.progress_percent},
                            reasoning=f"Goal '{goal.title}' is severely behind pace ({goal.progress_percent}% vs {expected_progress:.0f}% expected).",
                            suggested_action="adjust_goal",
                            context_for_message={"goal_title": goal.title, "goal_progress": goal.progress_percent, "target_date": str(goal.target_date)}
                        )
            
            # Check stale goal (last_updated is old but progress is stuck)
            # We can approximate stale by checking if target date is far away or 0% progress after 14 days
            days_since_start = (now_date - (goal.approved_at or goal.created_at).date()).days
            if days_since_start > 14 and goal.progress_percent == 0:
                return WatcherResult(
                    should_speak=True,
                    priority=4,
                    agent_name=self.agent_name,
                    observation={"stale_goal_id": str(goal.id)},
                    reasoning=f"Goal '{goal.title}' has had 0% progress for {days_since_start} days.",
                    suggested_action="check_in",
                    context_for_message={"goal_title": goal.title, "days_stagnant": days_since_start}
                )

        return WatcherResult(False, 4, self.agent_name, {}, "All active goals are on track", "", {})
