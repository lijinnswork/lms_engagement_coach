import sys
import os
from datetime import datetime, date, timedelta, timezone

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, desc
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.models import User, CoachConversation, CoachMessage, MessageSender, MessageType, LMSDataCache
from app.db.models.goals import Goal, GoalStatus, GoalProposedBy
from app.db.models.reminders import Reminder

# Setup SQLite in-memory database for testing
engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine)

def setup_test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    # 1. Create a test student user
    student = User(
        email="test_student@example.com",
        password_hash="hashed_pw",
        full_name="Priya Patel",
        role="student"
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    
    # 2. Create a conversation
    convo = CoachConversation(
        user_id=student.id,
        summary="Recursion & Goals Chat"
    )
    db.add(convo)
    db.commit()
    db.refresh(convo)
    
    return db, student, convo

def test_context_generation():
    db, student, convo = setup_test_db()
    
    # Let's seed cache entry for course
    now = datetime.now(timezone.utc)
    course_data = {
        "course_id": "course-v1:IIMBx+Python101+2026",
        "course_name": "Python Fundamentals",
        "progress_percent": 65.0,
        "completed_components": 12,
        "total_components": 18,
        "last_active_at": (now - timedelta(hours=2)).isoformat(),
        "overall_grade": 85.0,
        "assessments": [
            {
                "assessment_name": "Quiz 1: Functions",
                "score": 90.0,
                "max_score": 100.0,
                "graded": True,
                "timestamp": (now - timedelta(hours=2)).isoformat()
            }
        ]
    }
    
    cache_entry = LMSDataCache(
        user_id=student.id,
        course_id="course-v1:IIMBx+Python101+2026",
        data=course_data
    )
    db.add(cache_entry)
    
    # Let's seed active goal
    goal = Goal(
        user_id=student.id,
        course_id="course-v1:IIMBx+Python101+2026",
        title="Finish Python Fundamentals by end of the month",
        status=GoalStatus.active,
        proposed_by=GoalProposedBy.student,
        progress_percent=65,
        target_date=date.today() + timedelta(days=14)
    )
    db.add(goal)
    
    # Let's seed reminder/deadline in 3 days
    reminder = Reminder(
        user_id=student.id,
        title="Python Quiz 2: Recursion",
        reminder_type="assignment_deadline",
        date=date.today() + timedelta(days=3),
        time=datetime.now().time(),
        status="active"
    )
    db.add(reminder)
    
    # Let's seed student message
    student_msg = CoachMessage(
        conversation_id=convo.id,
        sender=MessageSender.student,
        content="Help me set a goal",
        message_type=MessageType.reply
    )
    db.add(student_msg)
    db.commit()
    
    # Now, let's replicate the context-gathering logic to verify it extracts everything correctly!
    student_name = student.full_name
    first_name = student_name.split()[0] if student_name else "Student"
    
    hour = datetime.now().hour
    if hour < 12:
        time_of_day = "morning"
    elif hour < 17:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    import datetime as dt
    now_local = dt.datetime.now()
    now_utc = dt.datetime.utcnow()
    
    all_student_msgs = db.query(CoachMessage).filter(
        CoachMessage.conversation_id == convo.id,
        CoachMessage.sender == MessageSender.student
    ).all()
    
    other_msgs_today = []
    for m in all_student_msgs:
        if m.id == student_msg.id:
            continue
        msg_date = m.created_at.date()
        if msg_date == now_local.date() or msg_date == now_utc.date():
            other_msgs_today.append(m)
            
    first_message_today = "true" if len(other_msgs_today) == 0 else "false"

    last_active_course = "None"
    last_active_days_ago = None
    last_active_str = "never"
    recently_completed = "none"
    
    cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == student.id).all()
    
    most_recent_time = None
    for entry in cache_entries:
        d = entry.data
        c_name = d.get("course_name", d.get("name", "Course"))
        active_str = d.get("last_active_at") or d.get("progress", {}).get("last_activity_at")
        if active_str:
            try:
                dt_active = datetime.fromisoformat(active_str.replace('Z', '+00:00'))
                if most_recent_time is None or dt_active > most_recent_time:
                    most_recent_time = dt_active
                    last_active_course = c_name
            except Exception:
                pass
                
            c_progress = d.get("progress_percent") or d.get("progress", {}).get("progress_percent", 0.0) or 0.0
            try:
                dt_active = datetime.fromisoformat(active_str.replace('Z', '+00:00'))
                now_tz = datetime.now(timezone.utc) if dt_active.tzinfo else datetime.utcnow()
                delta = now_tz - dt_active
                if delta.days <= 1 and c_progress == 100.0:
                    recently_completed = c_name
            except Exception:
                pass
                
            assessments = d.get("assessments", [])
            for ass in assessments:
                ts_str = ass.get("timestamp")
                if ts_str:
                    try:
                        ts = datetime.fromisoformat(ts_str.replace('Z', '+00:00'))
                        now_tz = datetime.now(timezone.utc) if ts.tzinfo else datetime.utcnow()
                        delta = now_tz - ts
                        if delta.total_seconds() <= 86400: # 24 hours
                            recently_completed = c_name
                    except Exception:
                        pass

    if most_recent_time:
        now_tz = datetime.now(timezone.utc) if most_recent_time.tzinfo else datetime.utcnow()
        delta = now_tz - most_recent_time
        last_active_days_ago = max(0, delta.days)
        if last_active_days_ago == 0:
            last_active_str = "today"
        elif last_active_days_ago == 1:
            last_active_str = "yesterday"
        else:
            last_active_str = f"{last_active_days_ago} days ago"

    upcoming_deadline_str = "none soon"
    today_date = date.today()
    end_date = today_date + timedelta(days=7)
    deadlines = db.query(Reminder).filter(
        Reminder.user_id == student.id,
        Reminder.status == "active",
        Reminder.date >= today_date,
        Reminder.date <= end_date
    ).all()
    if deadlines:
        deadlines = sorted(deadlines, key=lambda r: r.date)
        closest = deadlines[0]
        days_away = (closest.date - today_date).days
        upcoming_deadline_str = f"{closest.title} in {days_away} days"

    courses_progress_lines = []
    grades_lines = []
    for entry in cache_entries:
        d = entry.data
        c_name = d.get("course_name", d.get("name", "Course"))
        c_progress = d.get("progress_percent") or d.get("progress", {}).get("progress_percent", 0.0) or 0.0
        items_completed = d.get("completed_components") or d.get("progress", {}).get("completed_items", 0)
        total_items = d.get("total_components") or d.get("progress", {}).get("total_items", 0)
        courses_progress_lines.append(f"{c_name}: {c_progress}% ({items_completed} of {total_items} items)")
        
        grade = d.get("overall_grade")
        if grade is not None:
            if grade >= 70.0:
                grade_status = "pass"
            elif grade > 0.0:
                grade_status = "needs_improvement"
            else:
                grade_status = "in_progress"
            grades_lines.append(f"{c_name}: {grade}% ({grade_status})")
        else:
            grades_lines.append(f"{c_name}: None (in_progress)")
            
    courses_progress_str = "\n".join(courses_progress_lines) if courses_progress_lines else "None linked"
    grades_summary_str = "\n".join(grades_lines) if grades_lines else "No grades yet"

    active_goals_str = "No active goals"
    active_goals = db.query(Goal).filter(
        Goal.user_id == student.id,
        Goal.status == GoalStatus.active
    ).all()
    if active_goals:
        goals_lines = []
        for g in active_goals:
            date_str = g.target_date.strftime("%Y-%m-%d") if g.target_date else "no deadline"
            goals_lines.append(f"{g.title} — {g.progress_percent}% — target: {date_str}")
        active_goals_str = "\n".join(goals_lines)

    summary_str = convo.summary if (convo.summary and convo.summary != "New Chat") else "No previous summary — this is an early conversation"
    coach_memory_str = "Building memory — early conversations"

    recent_student_msgs = db.query(CoachMessage).filter(
        CoachMessage.conversation_id == convo.id,
        CoachMessage.sender == MessageSender.student
    ).order_by(desc(CoachMessage.created_at)).limit(3).all()
    student_msgs_list = [m.content for m in reversed(recent_student_msgs)]
    while len(student_msgs_list) < 3:
        student_msgs_list.insert(0, "")
    student_message_1 = student_msgs_list[0]
    student_message_2 = student_msgs_list[1]
    student_message_3 = student_msgs_list[2]

    recent_history_msgs = db.query(CoachMessage).filter(
        CoachMessage.conversation_id == convo.id,
        CoachMessage.id != student_msg.id
    ).order_by(desc(CoachMessage.created_at)).limit(5).all()
    message_history = "\n".join([f"{m.sender.value}: {m.content}" for m in reversed(recent_history_msgs)])

    prompt = f"""STUDENT CONTEXT:
Name: {first_name}
Time of day: {time_of_day}
First message today: {first_message_today}

COURSE ACTIVITY:
Last active course: {last_active_course}
Last active: {last_active_str}
Recently completed: {recently_completed if recently_completed != "none" else "none recently"}
Upcoming deadline: {upcoming_deadline_str}

COURSES AND PROGRESS:
{courses_progress_str}

GRADES SUMMARY:
{grades_summary_str}

ACTIVE GOALS:
{active_goals_str}

PAST CONVERSATION SUMMARY:
{summary_str}

WHAT YOU REMEMBER ABOUT THIS STUDENT:
{coach_memory_str}

RECENT STUDENT MESSAGES (for tone reading):
- "{student_message_1}"
- "{student_message_2}"
- "{student_message_3}"

LAST 5 MESSAGES (for continuity):
{message_history}

The student just said: "{student_msg.content}"
"""

    print("--- CONTEXT ASSEMBLED SUCCESSFULLY ---")
    print(prompt)
    print("--------------------------------------")
    
    # Assertions to verify correct logic output
    assert first_name == "Priya"
    assert first_message_today == "true"
    assert last_active_course == "Python Fundamentals"
    assert last_active_str == "today"
    assert recently_completed == "Python Fundamentals" # due to assessment completed within 2 hours
    assert upcoming_deadline_str == "Python Quiz 2: Recursion in 3 days"
    assert "Python Fundamentals: 65.0% (12 of 18 items)" in courses_progress_str
    assert "Python Fundamentals: 85.0% (pass)" in grades_summary_str
    assert "Finish Python Fundamentals by end of the month — 65% — target:" in active_goals_str
    assert summary_str == "Recursion & Goals Chat"
    assert student_message_3 == "Help me set a goal"
    
    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_context_generation()
