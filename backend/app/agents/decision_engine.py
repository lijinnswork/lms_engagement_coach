import logging
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db.models import User, CoachMessage, AgentLog
from sqlalchemy import desc
from .base_watcher import WatcherResult

class DecisionEngine:
    async def decide(self, user_id: str, watcher_results: List[WatcherResult], db: Session) -> Dict[str, Any]:
        candidates = [r for r in watcher_results if r.should_speak]

        if not candidates:
            self._log(user_id, "decision_engine", "stay_silent", "No watchers recommended speaking", db)
            return {"action": "stay_silent", "reason": "All watchers quiet"}

        user = await self._get_user(user_id, db)
        prefs = getattr(user, "notification_preferences", {})
        if prefs is None:
            prefs = {}

        now = datetime.now()
        quiet_start = prefs.get("quiet_hours_start", "22:00")
        quiet_end = prefs.get("quiet_hours_end", "08:00")
        
        if self._is_quiet_hours(now, quiet_start, quiet_end):
            candidates = [c for c in candidates if c.priority == 1]
            if not candidates:
                self._log(user_id, "decision_engine", "stay_silent", "Quiet hours active", db)
                return {"action": "stay_silent", "reason": "Quiet hours"}

        max_per_week = prefs.get("nudge_frequency", 3)
        messages_this_week = getattr(user, "coach_interactions_week", 0)
        
        if messages_this_week >= max_per_week:
            candidates = [c for c in candidates if c.priority == 1]
            if not candidates:
                self._log(user_id, "decision_engine", "stay_silent", f"Weekly limit reached ({messages_this_week}/{max_per_week})", db)
                return {"action": "stay_silent", "reason": "Weekly limit reached"}

        last_proactive = await self._get_last_proactive_message(user_id, db)
        now_naive = now.replace(tzinfo=None)
        
        if last_proactive:
            last_created = last_proactive.created_at.replace(tzinfo=None)
            
            hours_since = (now_naive - last_created).total_seconds() / 3600
            if hours_since < 24:
                candidates = [c for c in candidates if c.priority <= 2]
                if not candidates:
                    self._log(user_id, "decision_engine", "wait", f"Only {hours_since:.0f}h since last message", db)
                    return {"action": "stay_silent", "reason": "Too soon since last message"}

        # Cooldown Matrix Logic
        last_agent = await self._get_last_agent_triggered(user_id, db)
        cooldown_matrix = {
            "engagement": 72,
            "momentum": 24,
            "goal": 24,
            "curiosity": 24
        }
        
        filtered_candidates = []
        for c in candidates:
            if c.agent_name == last_agent and c.priority > 1 and last_proactive:
                last_created = last_proactive.created_at.replace(tzinfo=None)
                hours_since = (now_naive - last_created).total_seconds() / 3600
                cooldown = cooldown_matrix.get(c.agent_name, 24)
                if hours_since < cooldown:
                    self._log(user_id, "decision_engine", "wait", f"Agent {c.agent_name} is in cooldown ({hours_since:.0f}h < {cooldown}h)", db)
                    continue
            filtered_candidates.append(c)

        candidates = filtered_candidates
        if not candidates:
            return {"action": "stay_silent", "reason": "All remaining candidates are in cooldown"}

        candidates.sort(key=lambda r: r.priority)
        chosen = candidates[0]

        self._log(user_id, "decision_engine", "speak", f"Chose {chosen.agent_name} (priority {chosen.priority}): {chosen.reasoning}", db)
        return {"action": "speak", "chosen_result": chosen}

    async def _get_user(self, user_id, db):
        return db.query(User).filter(User.id == user_id).first()

    async def _get_last_proactive_message(self, user_id, db):
        from app.db.models import CoachConversation
        return db.query(CoachMessage).join(CoachConversation).filter(
            CoachConversation.user_id == user_id,
            CoachMessage.is_proactive == True
        ).order_by(desc(CoachMessage.created_at)).first()

    async def _get_last_agent_triggered(self, user_id, db) -> str:
        log = db.query(AgentLog).filter(
            AgentLog.user_id == user_id,
            AgentLog.decision == "speak"
        ).order_by(desc(AgentLog.created_at)).first()
        if not log:
            return None
        return str(log.agent_name.value) if hasattr(log.agent_name, "value") else str(log.agent_name)

    def _is_quiet_hours(self, now, start_str, end_str) -> bool:
        start = datetime.strptime(start_str, "%H:%M").time()
        end = datetime.strptime(end_str, "%H:%M").time()
        current = now.time()
        if start > end:
            return current >= start or current < end
        return start <= current < end


    def _log(self, user_id, agent_name, decision, reasoning, db):
        log = AgentLog(
            user_id=user_id,
            agent_name=agent_name,
            observation={},
            decision=decision,
            reasoning=reasoning,
        )
        db.add(log)
        db.commit()
