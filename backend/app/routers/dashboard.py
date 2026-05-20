from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
import uuid

from app.database import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.user_session import UserSession
from app.db.models.goals import Goal, GoalStatus, GoalProposedBy
from app.db.models.daily_activity import DailyActivity
from app.services.openedx_client import openedx_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/engagement")
async def get_engagement_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)

    # 1. Consistency: Distinct days logged in over the past 7 days
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.created_at >= seven_days_ago
    ).all()
    
    unique_days = set([s.created_at.date() for s in sessions])
    consistency_score = min(100, int((len(unique_days) / 5) * 100)) # 5 days active = 100%

    # 2. Focus: Average session duration (last_active - created_at)
    total_duration_seconds = 0
    valid_sessions = 0
    for s in sessions:
        if s.last_active and s.last_active > s.created_at:
            duration = (s.last_active - s.created_at).total_seconds()
            if duration < 3600 * 12: # cap reasonable session to 12 hours
                total_duration_seconds += duration
                valid_sessions += 1
                
    avg_session_minutes = (total_duration_seconds / valid_sessions / 60) if valid_sessions > 0 else 0
    focus_score = min(100, int((avg_session_minutes / 60) * 100)) # 60 min avg = 100%
    if valid_sessions == 0:
        focus_score = 50 # Default baseline if no valid duration

    # 3. Pacing: Ratio of completed goals vs active goals in the past 30 days
    thirty_days_ago = now - timedelta(days=30)
    goals = db.query(Goal).filter(
        Goal.user_id == current_user.id,
        Goal.created_at >= thirty_days_ago
    ).all()
    
    completed_goals = sum(1 for g in goals if g.status == GoalStatus.completed or getattr(g, 'done', False))
    total_goals = len(goals)
    pacing_score = int((completed_goals / total_goals) * 100) if total_goals > 0 else 50 # 50 is default

    # 4. Curiosity: Number of custom goals created
    custom_goals = sum(1 for g in goals if getattr(g, 'proposed_by', None) == GoalProposedBy.student or getattr(g, 'source', None) == 'user')
    curiosity_score = min(100, 50 + (custom_goals * 10)) # Baseline 50, +10 for each custom goal

    # 5. Mastery: We will calculate this using openedx_client progress, or default to pacing + 10%
    mastery_score = min(100, pacing_score + 10)
    try:
        username = current_user.openedx_user_id or current_user.email.split('@')[0]
        enrollments = await openedx_client.get_user_enrollments(username)
        if enrollments and len(enrollments) > 0:
            active_courses = [e for e in enrollments if e.get("is_active")]
            if active_courses:
                course_id = active_courses[0].get("course_id")
                if course_id:
                    progress = await openedx_client.get_user_progress(course_id, username)
                    details = progress.get("progress_details", {})
                    total = details.get("total_components", 0)
                    completed = details.get("completed_components", 0)
                    if total > 0:
                        mastery_score = int((completed / total) * 100)
    except Exception as e:
        print(f"Failed to fetch LMS progress: {e}")

    # Make sure all scores are between 10 and 100 to look good on radar
    def clamp(score):
        return max(10, min(100, score))

    metrics = {
        "focus": clamp(focus_score),
        "consistency": clamp(consistency_score),
        "mastery": clamp(mastery_score),
        "curiosity": clamp(curiosity_score),
        "pacing": clamp(pacing_score)
    }
    
    # Generate dynamic summary
    sorted_metrics = sorted(metrics.items(), key=lambda x: x[1], reverse=True)
    top_2 = [m[0].capitalize() for m in sorted_metrics[:2]]
    summary = f"Your {top_2[0].lower()} and {top_2[1].lower()} are peaking this week."
    
    return {
        "metrics": metrics,
        "summary": summary
    }

@router.get("/rhythm")
async def get_learning_rhythm(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now(timezone.utc).date()
    four_weeks_ago = now - timedelta(days=27) # 28 days total
    two_weeks_ago = now - timedelta(days=13) # 14 days total
    
    activities = db.query(DailyActivity).filter(
        DailyActivity.user_id == current_user.id,
        DailyActivity.date >= four_weeks_ago
    ).all()
    
    activity_map = {a.date: a for a in activities}
    
    # 1. Weekly Pattern (last 28 days)
    weekday_counts = {i: 0 for i in range(7)}
    for i in range(28):
        d = now - timedelta(days=i)
        if d in activity_map and activity_map[d].was_active:
            weekday_counts[d.weekday()] += 1
            
    # Weekday array starting with Monday (0) to Sunday (6)
    mon_sun_keys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
    weekly_pattern = {mon_sun_keys[i]: weekday_counts[i] for i in range(7)}
    
    # Generate Insight
    max_count = max(weekday_counts.values()) if weekday_counts else 0
    if max_count == 0:
        insight = "No activity in the last 4 weeks — start anytime"
    elif all(c == max_count for c in weekday_counts.values()):
        insight = "Active consistently throughout the week"
    else:
        # Find all days with max count
        top_days = [i for i, count in weekday_counts.items() if count == max_count]
        
        # Check weekday vs weekend
        weekdays_active = sum(weekday_counts[i] for i in range(5))
        weekends_active = sum(weekday_counts[i] for i in range(5, 7))
        
        if len(top_days) == 2 and top_days[1] - top_days[0] == 1:
            insight = f"Most active on {mon_sun_keys[top_days[0]].capitalize()}days and {mon_sun_keys[top_days[1]].capitalize()}days"
        elif len(top_days) == 2:
            insight = f"Most active on {mon_sun_keys[top_days[0]].capitalize()}days and {mon_sun_keys[top_days[1]].capitalize()}days"
        elif weekends_active > weekdays_active:
            insight = "You study most on weekends"
        elif weekdays_active > 0 and weekends_active == 0:
            insight = "You tend to study on weekdays"
        else:
            names = [mon_sun_keys[d].capitalize() + "days" for d in top_days]
            if len(names) == 1:
                insight = f"Most active on {names[0]}"
            else:
                insight = f"Most active on {names[0]} and {len(names)-1} other days"
                
    weekly_pattern["insight"] = insight
    
    # 2. Recent 14 Days
    recent_14_days = []
    active_count_14 = 0
    for i in range(13, -1, -1):
        d = now - timedelta(days=i)
        was_active = d in activity_map and activity_map[d].was_active
        if was_active:
            active_count_14 += 1
            
        recent_14_days.append({
            "date": d.isoformat(),
            "weekday": mon_sun_keys[d.weekday()].capitalize(),
            "active": was_active
        })
        
    # Generate Summary Tone
    if active_count_14 >= 10:
        msg = f"Active {active_count_14} of the last 14 days — impressive consistency 🌟"
    elif active_count_14 >= 7:
        msg = f"Active {active_count_14} of the last 14 days — that's consistent 👍"
    elif active_count_14 >= 4:
        msg = f"Active {active_count_14} of the last 14 days — a solid rhythm"
    elif active_count_14 >= 2:
        msg = f"Active {active_count_14} of the last 14 days — every day counts"
    elif active_count_14 == 1:
        msg = "Active 1 day in the last 2 weeks — welcome back"
    else:
        msg = "No activity in the last 2 weeks — ready when you are"
        
    summary = {
        "active_count": active_count_14,
        "total_days": 14,
        "message": msg
    }
    
    return {
        "weekly_pattern": weekly_pattern,
        "recent_14_days": recent_14_days,
        "summary": summary
    }
