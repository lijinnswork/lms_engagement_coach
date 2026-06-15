import logging
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from .base_watcher import BaseWatcher, WatcherResult
from app.db.models.user import User
from app.db.models.lms_data_cache import LMSDataCache
from app.db.models.nudge import PendingNudge, NudgeRangeConfig, NudgeRangeHistory, NudgeGlobalSettings
from app.db.models.goals import Goal
from app.services.gemini_client import gemini_client
from app.services.email_service import send_email

logger = logging.getLogger(__name__)

# Helpers for inactivity and pace calculations
def get_course_last_active(course: dict) -> str:
    keys = ["last_activity_time", "last_active_at"]
    for k in keys:
        val = course.get(k)
        if val:
            return val
    # Check nested fields
    for parent in ["progress", "progress_details"]:
        sub = course.get(parent)
        if isinstance(sub, dict):
            for k in keys:
                val = sub.get(k)
                if val:
                    return val
    return None

def calculate_course_pace(data: dict, db: Session, user_id: uuid.UUID):
    now = datetime.utcnow()
    enrollment_str = data.get("enrollment_date")
    if enrollment_str:
        try:
            enroll_dt = datetime.fromisoformat(enrollment_str.replace("Z", "+00:00")).replace(tzinfo=None)
            days_since_enrollment = (now - enroll_dt).days
        except:
            days_since_enrollment = 30
    else:
        days_since_enrollment = 30
        
    days_since_enrollment = max(days_since_enrollment, 1)
    
    progress_data = data.get("progress", {})
    if isinstance(progress_data, dict):
        items_completed = progress_data.get("completed_items", 0)
        total_items = progress_data.get("total_items", 0)
    else:
        items_completed = data.get("items_completed", 0)
        total_items = data.get("total_items", 0)
        
    items_remaining = total_items - items_completed
    
    items_per_day = items_completed / days_since_enrollment
    items_per_week = items_per_day * 7
    
    predicted_completion_date = None
    if items_per_day > 0 and items_remaining > 0:
        days_to_complete = items_remaining / items_per_day
        predicted_dt = now + timedelta(days=days_to_complete)
        predicted_completion_date = predicted_dt.date().isoformat()
        
    goal = db.query(Goal).filter(
        Goal.user_id == user_id,
        Goal.course_id == data.get("course_id"),
        Goal.status != "completed"
    ).first()
    
    goal_date = None
    required_items_per_week = None
    on_track = False
    
    if goal and goal.target_date:
        goal_dt = goal.target_date
        if isinstance(goal_dt, datetime):
            goal_dt = goal_dt.date()
        elif isinstance(goal_dt, str):
            goal_dt = datetime.fromisoformat(goal_dt.replace("Z", "+00:00")).date()
            
        goal_date = goal_dt.isoformat()
        
        days_until_goal = (goal_dt - now.date()).days
        days_until_goal = max(days_until_goal, 1)
        
        required_items_per_week = (items_remaining / days_until_goal) * 7
        
        if predicted_completion_date:
            pred_dt = datetime.fromisoformat(predicted_completion_date).date()
            if pred_dt <= goal_dt + timedelta(days=14):
                on_track = True
                
    return {
        "items_per_week": round(items_per_week, 1),
        "predicted_completion_date": predicted_completion_date,
        "goal_date": goal_date,
        "required_items_per_week": round(required_items_per_week, 1) if required_items_per_week else None,
        "on_track": on_track
    }

async def trigger_email_for_nudge(nudge: PendingNudge, user: User, db: Session) -> bool:
    global_settings = db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()
    if not global_settings or not global_settings.email_nudges_enabled:
        return False
        
    # Check student email setting preference
    if global_settings.respect_student_email_setting:
        if not user.notification_preferences.get("email_enabled", True):
            return False

    # Check time window: 8 AM to 10 PM local/server time
    now_hour = datetime.now().hour
    if not (8 <= now_hour < 22):
        return False

    # Check stuck repeat constraint (only one stuck email per course per 7 days)
    if nudge.nudge_type == "range_stuck":
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_email = db.query(PendingNudge).filter(
            PendingNudge.user_id == user.id,
            PendingNudge.course_id == nudge.course_id,
            PendingNudge.nudge_type == "range_stuck",
            PendingNudge.email_sent == True,
            PendingNudge.email_sent_at > seven_days_ago
        ).first()
        if recent_email:
            return False

    # Construct HTML Body
    first_name = (user.full_name or 'Learner').split(' ')[0]
    redirect_url = f"http://localhost:3030/course/{nudge.course_id}"
    
    subject = "A nudge from your coach"
    body = f"""Hi {first_name},

{nudge.message}

[Open {nudge.course_name}] ({redirect_url})

To turn off email nudges, update your Settings.
-- Your Coach"""

    try:
        success = await send_email(user.email, subject, body)
        if success:
            nudge.email_sent = True
            nudge.email_sent_at = datetime.now(timezone.utc)
            db.commit()
            return True
    except Exception as e:
        logger.error(f"Failed to send email nudge: {e}")
        
    return False

class ProgressRangeWatcher(BaseWatcher):
    agent_name: str = "progress_range_watcher"

    async def observe(self, user_id: str, db: Session) -> WatcherResult:
        logger.info(f"ProgressRangeWatcher running observation for user {user_id}")
        user = db.query(User).filter(User.id == uuid.UUID(str(user_id))).first()
        if not user:
            return WatcherResult(False, 5, self.agent_name, {}, "User not found", "", {})

        # Ensure defaults exist
        from app.routers.nudges import seed_default_ranges_and_settings
        seed_default_ranges_and_settings(db)

        global_settings = db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()
        if not global_settings:
            return WatcherResult(False, 5, self.agent_name, {}, "Global settings not found", "", {})

        # Get LMS course cache records for this user
        caches = db.query(LMSDataCache).filter(LMSDataCache.user_id == user.id).all()
        
        nudges_created_count = 0
        
        # Load all enabled range configs
        ranges = db.query(NudgeRangeConfig).filter(NudgeRangeConfig.is_enabled == True).all()

        for cache in caches:
            course_id = cache.course_id
            data = cache.data or {}
            
            course_name = data.get("course_name") or data.get("course_details", {}).get("course_name") or "Course"
            progress_pct = data.get("progress_percent") or data.get("progress", {}).get("progress_percent") or 0.0

            # Find matching range
            current_range = None
            for r in ranges:
                if r.from_pct <= progress_pct <= r.to_pct:
                    current_range = r
                    break

            # Helper for duplicate and max active nudges checking
            def can_create_nudge(nudge_type: str) -> bool:
                # Check duplicate
                dup = db.query(PendingNudge).filter(
                    PendingNudge.user_id == user.id,
                    PendingNudge.course_id == course_id,
                    PendingNudge.nudge_type == nudge_type,
                    PendingNudge.is_dismissed == False
                ).first()
                if dup:
                    return False
                
                # Check max active nudges
                active_count = db.query(func.count(PendingNudge.id)).filter(
                    PendingNudge.user_id == user.id,
                    PendingNudge.is_dismissed == False
                ).scalar() or 0
                if active_count >= global_settings.max_active_nudges:
                    return False
                    
                return True

            # ---------------------------------------------
            # 1. RANGE ENTRY & RANGE STUCK TRIGGERS
            # ---------------------------------------------
            if current_range:
                # Query range history for this user + course + range
                history = db.query(NudgeRangeHistory).filter(
                    NudgeRangeHistory.user_id == user.id,
                    NudgeRangeHistory.course_id == course_id,
                    NudgeRangeHistory.range_config_id == current_range.id
                ).first()

                if not history:
                    # TRIGGER A: Entry nudge
                    if can_create_nudge("range_entry"):
                        prompt = f"""Generate a warm, brief nudge (1-2 sentences maximum) for a student at this stage in their course.

Course: {course_name}
Current progress: {progress_pct}%
Stage: {current_range.range_name} ({current_range.from_pct}% to {current_range.to_pct}%)
Tone required: {current_range.tone}
Trigger type: range_entry

"""
                        if current_range.message_template:
                            prompt += f"Use this as a base, adapting lightly: {current_range.message_template}\n"
                        else:
                            prompt += "Generate freely in the requested tone\n"

                        prompt += """
Rules:
- Maximum 2 sentences
- Reference the course name specifically
- No guilt, no pressure, no "you need to" or "you should"
- Celebratory tone: feel genuinely proud, specific
- Motivational tone: warm friend, not a coach with a whistle
- Stuck tone: gentle curiosity, no disappointment
"""
                        nudge_message = gemini_client.generate_coach_message(prompt)
                        
                        nudge = PendingNudge(
                            user_id=user.id,
                            course_id=course_id,
                            course_name=course_name,
                            nudge_type="range_entry",
                            message=nudge_message,
                            range_config_id=current_range.id
                        )
                        db.add(nudge)
                        
                        history = NudgeRangeHistory(
                            user_id=user.id,
                            course_id=course_id,
                            range_config_id=current_range.id,
                            stuck_nudge_count=0
                        )
                        db.add(history)
                        db.commit()
                        db.refresh(nudge)
                        
                        nudges_created_count += 1
                        await trigger_email_for_nudge(nudge, user, db)

                else:
                    # TRIGGER B: Stuck nudge
                    now = datetime.now(timezone.utc)
                    is_stuck_time = False
                    if history.last_stuck_nudge_at is None:
                        time_elapsed = now - history.entry_nudge_sent_at.replace(tzinfo=timezone.utc)
                        if time_elapsed.days >= current_range.stuck_trigger_days:
                            is_stuck_time = True
                    else:
                        time_elapsed = now - history.last_stuck_nudge_at.replace(tzinfo=timezone.utc)
                        if time_elapsed.days >= current_range.stuck_trigger_days:
                            is_stuck_time = True

                    if history.stuck_nudge_count < current_range.max_repeats and is_stuck_time:
                        if can_create_nudge("range_stuck"):
                            prompt = f"""Generate a warm, brief nudge (1-2 sentences maximum) for a student at this stage in their course.

Course: {course_name}
Current progress: {progress_pct}%
Stage: {current_range.range_name} ({current_range.from_pct}% to {current_range.to_pct}%)
Tone required: stuck (gentle curiosity, no disappointment)
Trigger type: range_stuck

"""
                            if current_range.message_template:
                                prompt += f"Use this as a base, adapting lightly: {current_range.message_template}\n"
                            else:
                                prompt += "Generate freely in the requested tone\n"

                            prompt += """
Rules:
- Maximum 2 sentences
- Reference the course name specifically
- No guilt, no pressure, no "you need to" or "you should"
- Celebratory tone: feel genuinely proud, specific
- Motivational tone: warm friend, not a coach with a whistle
- Stuck tone: gentle curiosity, no disappointment
"""
                            nudge_message = gemini_client.generate_coach_message(prompt)
                            
                            nudge = PendingNudge(
                                user_id=user.id,
                                course_id=course_id,
                                course_name=course_name,
                                nudge_type="range_stuck",
                                message=nudge_message,
                                range_config_id=current_range.id
                            )
                            db.add(nudge)
                            
                            history.stuck_nudge_count += 1
                            history.last_stuck_nudge_at = datetime.now(timezone.utc)
                            
                            db.commit()
                            db.refresh(nudge)
                            
                            nudges_created_count += 1
                            await trigger_email_for_nudge(nudge, user, db)

            # ---------------------------------------------
            # 2. INACTIVITY TRIGGER
            # ---------------------------------------------
            last_active_str = get_course_last_active(data)
            if last_active_str:
                try:
                    clean_str = last_active_str.replace("Z", "+00:00")
                    last_active_dt = datetime.fromisoformat(clean_str)
                    if last_active_dt.tzinfo is None:
                        last_active_dt = last_active_dt.replace(tzinfo=timezone.utc)
                    
                    days_inactive = (datetime.now(timezone.utc) - last_active_dt).days
                    if days_inactive >= global_settings.inactivity_threshold_days:
                        if can_create_nudge("inactivity"):
                            prompt = f"""Generate a warm, brief nudge (1-2 sentences maximum) for a student who has been inactive in their course.

Course: {course_name}
Days inactive: {days_inactive}
Tone required: gentle curiosity, no disappointment, no pressure
Trigger type: inactivity

Rules:
- Maximum 2 sentences
- Reference the course name specifically
- No guilt, no pressure, no "you need to" or "you should"
"""
                            nudge_message = gemini_client.generate_coach_message(prompt)
                            
                            nudge = PendingNudge(
                                user_id=user.id,
                                course_id=course_id,
                                course_name=course_name,
                                nudge_type="inactivity",
                                message=nudge_message
                            )
                            db.add(nudge)
                            db.commit()
                            db.refresh(nudge)
                            
                            nudges_created_count += 1
                            await trigger_email_for_nudge(nudge, user, db)
                except Exception as e:
                    logger.error(f"Error evaluating inactivity for user {user.id} course {course_id}: {e}")

            # ---------------------------------------------
            # 3. GOAL BEHIND PACE TRIGGER
            # ---------------------------------------------
            try:
                pace_info = calculate_course_pace(data, db, user.id)
                if pace_info.get("goal_date") and not pace_info.get("on_track", True):
                    if can_create_nudge("goal_behind"):
                        prompt = f"""Generate a warm, brief nudge (1-2 sentences maximum) for a student whose study goal is falling behind schedule.

Course: {course_name}
Current progress: {progress_pct}%
Tone required: warm friend, supportive, offering to adjust the pace, no pressure
Trigger type: goal_behind

Rules:
- Maximum 2 sentences
- Reference the course name specifically
- No guilt, no pressure, no "you need to" or "you should"
"""
                        nudge_message = gemini_client.generate_coach_message(prompt)
                        
                        nudge = PendingNudge(
                            user_id=user.id,
                            course_id=course_id,
                            course_name=course_name,
                            nudge_type="goal_behind",
                            message=nudge_message
                        )
                        db.add(nudge)
                        db.commit()
                        db.refresh(nudge)
                        
                        nudges_created_count += 1
                        await trigger_email_for_nudge(nudge, user, db)
            except Exception as e:
                logger.error(f"Error evaluating pace for user {user.id} course {course_id}: {e}")

        return WatcherResult(
            should_speak=False,
            priority=5,
            agent_name=self.agent_name,
            observation={"nudges_created": nudges_created_count},
            reasoning=f"Evaluated ranges, inactivity, and goals. Created {nudges_created_count} nudges.",
            suggested_action=""
        )
