from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
import logging

logger = logging.getLogger(__name__)
from app.db.models.goals import Goal
from app.services.gemini_client import gemini_client
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import uuid

router = APIRouter(prefix="/api/courses", tags=["courses"])

def get_mock_course_data(course_id: str):
    now = datetime.utcnow()
    course_name = "Python Fundamentals"
    if "data" in course_id.lower() or "sci" in course_id.lower():
        course_name = "Data Science Basics"
    elif "ux" in course_id.lower():
        course_name = "UX Design Foundations"
        
    return {
        "course_id": course_id,
        "course_name": course_name,
        "enrollment_active": True,
        "total_items": 18,
        "items_completed": 12,
        "progress_percent": 66.7,
        "last_activity_time": (now - timedelta(days=2)).isoformat() + "Z",
        "overall_grade": 82.5,
        "pass_fail_status": "pass",
        "assessments": [
            {
                "assessment_name": "Quiz 1",
                "score": 92.0,
                "max_score": 100.0,
                "graded": True,
                "timestamp": (now - timedelta(days=14)).isoformat() + "Z"
            }
        ],
        "grade_last_updated": (now - timedelta(days=2)).isoformat() + "Z",
        "enrollment_date": (now - timedelta(days=30)).isoformat() + "Z"
    }

async def get_live_courses(current_user: User, db: Session = None):
    if not current_user.lms_username:
        return []
    from app.services.openedx_client import openedx_client
    
    courses = []
    try:
        courses = await openedx_client.get_user_courses_direct(current_user.lms_username)
    except Exception as e:
        logger.error(f"Failed to fetch live courses for {current_user.lms_username}: {e}")
        try:
            from app.database import SessionLocal
            from app.db.models.lms_data_cache import LMSDataCache
            local_db = SessionLocal()
            cache_entries = local_db.query(LMSDataCache).filter(LMSDataCache.user_id == current_user.id).all()
            local_db.close()
            if cache_entries:
                logger.info(f"get_live_courses fallback: Loaded {len(cache_entries)} courses from cache")
                courses = [entry.data for entry in cache_entries]
        except Exception as db_err:
            logger.error(f"Failed to fetch cached courses: {db_err}")

    # Inject cohort stats from system-stats@dashboard.local
    if courses:
        close_db = False
        if db is None:
            from app.database import SessionLocal
            db = SessionLocal()
            close_db = True
        try:
            from app.db.models.lms_data_cache import LMSDataCache
            system_user = db.query(User).filter(User.email == "system-stats@dashboard.local").first()
            if system_user:
                cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == system_user.id).all()
                stats_by_course = {entry.course_id: entry.data for entry in cache_entries}
                for course in courses:
                    course_id = course.get("course_id")
                    if course_id in stats_by_course:
                        stat = stats_by_course[course_id]
                        course["cohort_average_progress"] = stat.get("avg_progress_percent", 0.0)
        except Exception as e:
            logger.error(f"Error injecting cohort stats: {e}")
        finally:
            if close_db:
                db.close()

    return courses

@router.get("")
@router.get("/")
async def get_courses_list(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return await get_live_courses(current_user, db)

@router.get("/upcoming-assignments")
async def get_upcoming_assignments(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from app.db.models.lms_data_cache import LMSDataCache
    import uuid
    
    cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == current_user.id).all()
    
    overdue = []
    today = []
    tomorrow = []
    this_week = []
    
    now = datetime.utcnow()
    today_date = now.date()
    tomorrow_date = today_date + timedelta(days=1)
    end_of_week = today_date + timedelta(days=7)
    
    for entry in cache_entries:
        d = entry.data
        course_name = d.get("course_name", d.get("name", "Course"))
        assessments = d.get("assessments", [])
        for ass in assessments:
            if not ass.get("graded", False):
                due_date_str = ass.get("due_date") or ass.get("timestamp")
                if not due_date_str:
                    continue
                try:
                    due_dt = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                    due_date = due_dt.date()
                    
                    days_left = (due_date - today_date).days
                    
                    item_id = ass.get("id") or str(uuid.uuid4())
                    item_name = ass.get("assessment_name") or "Unnamed Assessment"
                    
                    item = {
                        "id": item_id,
                        "name": item_name,
                        "course_name": course_name,
                        "status": "",
                        "due_date": due_date.isoformat()
                    }
                    
                    if due_date < today_date:
                        item["status"] = "Overdue"
                        overdue.append(item)
                    elif due_date == today_date:
                        item["status"] = "Due Today"
                        today.append(item)
                    elif due_date == tomorrow_date:
                        item["status"] = "Due Tomorrow"
                        tomorrow.append(item)
                    elif today_date < due_date <= end_of_week:
                        item["status"] = f"Due in {days_left} days"
                        this_week.append(item)
                except Exception as e:
                    logger.error(f"Error parsing due date {due_date_str}: {e}")
                    
    return {
        "overdue": overdue,
        "today": today,
        "tomorrow": tomorrow,
        "this_week": this_week
    }

@router.get("/overall-progress")
async def get_overall_progress(current_user: User = Depends(get_current_user)):
    courses = await get_live_courses(current_user)
    if not courses:
        return {
            "overall_percent": 0,
            "course_count_in_progress": 0,
            "course_count_completed": 0,
            "per_course_progress": []
        }
    
    completed = 0
    in_progress = 0
    total_percent = 0.0
    per_course = []
    
    for d in courses:
        progress_data = d.get("progress", {})
        if isinstance(progress_data, dict):
            progress = progress_data.get("progress_percent", 0.0) or 0.0
        else:
            progress = d.get("progress_percent", 0.0) or 0.0
            
        course_name = d.get("course_name", d.get("name", ""))
        
        per_course.append({
            "course_id": d.get("course_id"),
            "course_name": course_name,
            "progress_percent": progress
        })
        
        if progress >= 100.0:
            completed += 1
        else:
            in_progress += 1
            
        total_percent += progress
        
    overall_percent = int(total_percent / len(courses)) if courses else 0
    
    return {
        "overall_percent": overall_percent,
        "course_count_in_progress": in_progress,
        "course_count_completed": completed,
        "per_course_progress": per_course
    }

@router.get("/{course_id}")
async def get_course_detail(course_id: str, current_user: User = Depends(get_current_user)):
    courses = await get_live_courses(current_user)
    for c in courses:
        if c.get("course_id") == course_id:
            return c
    return get_mock_course_data(course_id)

@router.get("/{course_id}/coach-take")
async def get_coach_take(course_id: str, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    courses = await get_live_courses(current_user, db)
    data = None
    for c in courses:
        if c.get("course_id") == course_id:
            data = c
            break
            
    if not data:
        data = get_mock_course_data(course_id)
        
    now = datetime.utcnow()
                
    progress_data = data.get("progress", {})
    grade_data = data.get("grade", {})
    
    if isinstance(progress_data, dict):
        progress_pct = progress_data.get("progress_percent", 0)
        items_completed = progress_data.get("completed_items", 0)
        total_items = progress_data.get("total_items", 0)
    else:
        progress_pct = data.get("progress_percent", 0)
        items_completed = data.get("items_completed", 0)
        total_items = data.get("total_items", 0)
        
    if isinstance(grade_data, dict):
        overall_grade = grade_data.get("grade_percent", 0)
        pass_fail_status = "pass" if grade_data.get("passed") else "fail"
    else:
        overall_grade = data.get("overall_grade", 0)
        pass_fail_status = data.get("pass_fail_status", "unknown")
        
    last_activity_time = data.get("last_activity_time") or (progress_data.get("last_activity_at") if isinstance(progress_data, dict) else None)
    
    days_since = 0
    if last_activity_time:
        try:
            last_dt = datetime.fromisoformat(last_activity_time.replace("Z", "+00:00")).replace(tzinfo=None)
            days_since = (now - last_dt).days
        except:
            pass
            
    assessments = data.get("assessments", [])
    assessment_summary = ", ".join([f"{a.get('assessment_name', '')}: {a.get('score', 0)}%" for a in assessments[:3]])
    
    cohort_avg_progress = data.get("cohort_average_progress")
    cohort_avg_str = f"Class Average Progress: {cohort_avg_progress}%\n" if cohort_avg_progress is not None else ""
    
    prompt = f"""
You are the student's learning coach. Generate a SHORT, personalized observation (2-3 sentences max) about their progress in this specific course.

Course: {data.get("course_name")}
Progress: {items_completed} of {total_items} items ({progress_pct}%)
{cohort_avg_str}Overall grade: {overall_grade}%
Pass/fail: {pass_fail_status}
Last active: {days_since} days ago
Recent assessment scores: {assessment_summary}

Rules:
- Be warm, casual, specific
- Reference actual numbers from the data (including the class average progress if provided)
- If they've been away, acknowledge it gently (no guilt)
- If they're doing well, be specific about what's going well
- If their grade is dropping, mention it with encouragement
- 2-3 sentences MAXIMUM
- Do NOT explain course content
- Do NOT use exclamation marks excessively
"""
    try:
        coach_text = gemini_client.generate_coach_message(prompt)
    except Exception as e:
        coach_text = "Keep going — you're making progress! 💪"
        
    generated_at_iso = now.isoformat() + "Z"
        
    return {
        "text": coach_text,
        "generated_at": generated_at_iso,
        "is_cached": False
    }

@router.get("/{course_id}/pace")
async def get_course_pace(course_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    courses = await get_live_courses(current_user)
    data = None
    for c in courses:
        if c.get("course_id") == course_id:
            data = c
            break
            
    if not data:
        data = get_mock_course_data(course_id)
        
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
        Goal.user_id == current_user.id,
        Goal.course_id == course_id,
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
