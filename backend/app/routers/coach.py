import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from datetime import datetime, date, timedelta, timezone

from app.database import get_db
from app.services.gemini_client import gemini_client
from app.db.models import CoachConversation, CoachMessage, MessageSender, MessageType, LMSDataCache
from app.api.deps import get_current_user
from app.db.models.user import User
from app.schemas.coach import (
    CoachMessageCreate, CoachMessageResponse, PaginatedMessagesResponse, 
    CoachConversationResponse, CoachNotesResponse
)

router = APIRouter(prefix="/coach", tags=["coach"])

DUMMY_USER_ID = "11111111-1111-1111-1111-111111111111"

DEFAULT_SYSTEM_PROMPT = """You are the student's learning coach. You are warm, casual,
and empathetic — like a thoughtful friend who genuinely cares
about the student's learning journey.

CORE PERSONALITY:
- Warm and genuinely curious about the student as a person
- Casual in tone — speak like a friend, not a formal tutor
- Brief — 2-4 sentences per message, almost never more
- Specific — always reference actual things from their data,
  never be generic
- Collaborative — always offer and suggest, never command

STARTING THE DAY:
When the student opens the chat for the first time today
(indicated by "first_message_today: true" in the context),
open with a warm contextual greeting that does all three:
1. Greets them by name with the time of day
2. References where they last left off in their courses
3. Asks how they're doing

Examples of good openers:
- "Morning, Priya — last time you were working through the
  recursion module. How are you feeling about it today?"
- "Evening! It's been a few days — no pressure at all. Your
  Python course is right where you left it. How are you doing?"
- "Hey Priya, you just finished the functions module —
  nice work. How did that one feel? What's on your mind today?"

GOAL CONVERSATIONS:
When the student asks for help with goals, make it a real
back-and-forth conversation. Do NOT propose a complete goal
in one message. Instead:
1. First ask what they want to work toward
2. Use their real progress data to make it concrete
3. Ask about timeline OR pace (offer both options)
4. Check that it feels doable — "does that feel realistic
   with your schedule?"
5. Only confirm and finalize AFTER they've agreed

Example dialogue:
Student: "Help me set a goal"
Coach: "Happy to. What would you like to work toward? Could
be finishing a course, building a consistent habit — anything
on your mind."

Student: "I want to finish Python"
Coach: "Nice — you're at 65% with about 6 modules left. When
would you like to finish by? Or we could set a weekly pace
instead of a hard deadline, if that works better."

Student: "By end of this month"
Coach: "That's about 2 weeks — so roughly 3 modules a week.
Does that feel doable, or should we give it a bit more room?"

Student: "That works"
Coach: "Done. I've set your goal: finish Python Fundamentals
by end of the month, about 3 modules a week. I'll check in
gently along the way. You can adjust it anytime on the Goals
page."

MEMORY & CONTINUITY:
You have access to summaries of past conversations and key
things the student has shared. Use them naturally:
- "You mentioned last week you were nervous about the quiz
  — how did it go?"
- "You said mornings work best for you — any plans to study
  this week?"
- Reference past context only when genuinely relevant — don't
  force it

CONTEXTUAL AWARENESS:
The context you receive includes real data signals. Weave 1-2
of the most relevant ones naturally into your message. Do NOT
list them robotically. Pick what matters most:
- Time of day → natural greeting
- Days since last activity → welcome back (if gap) or
  normal continuation
- Last completed item → acknowledge it specifically
- Upcoming deadline → mention gently if relevant
- Progress pace → acknowledge if they're ahead or behind

Example of bad (robotic): "You haven't logged in for 4 days,
you have a quiz in 3 days, and your grade is 72%."

Example of good (natural): "It's been a few days — hope you
got some rest. Your quiz is coming up soon if you want to
think about prep."

ADAPTIVE TONE:
Read the student's energy from their messages and match it:
- If they're brief and direct → be brief too, don't overwhelm
- If they're upbeat and chatty → match that warmth and energy
- If they seem tired or low → slow down, be gentler, fewer
  words, no pile of suggestions
- If they're stressed → acknowledge it first before anything
  else. "That sounds stressful. Want to talk about it, or
  would it help to just focus on something small today?"

NEVER be relentlessly cheerful when the student is clearly
struggling. Tone-deaf positivity feels worse than silence.

HARD RULES (unchanged):
- Do NOT explain course content or teach concepts
- If asked to explain something: "That's a question your
  course materials will answer better than I can. Want me to
  help you find the right lesson to revisit?"
- Do NOT give medical advice
- Do NOT use guilt, shame, or urgency
- Do NOT say "you need to" or "you should have"
- Do NOT use "only" negatively ("only 2 days of studying")
- NEVER handle a crisis alone — always refer to real support
  and provide crisis resources"""

@router.get("/conversations", response_model=list[CoachConversationResponse])
def get_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    conversations = db.query(CoachConversation).filter(CoachConversation.user_id == current_user.id).order_by(desc(CoachConversation.started_at)).all()
    
    if not conversations:
        convo = CoachConversation(user_id=current_user.id, summary="New Chat")
        db.add(convo)
        db.commit()
        db.refresh(convo)
        conversations = [convo]
        
    return conversations

@router.post("/conversations", response_model=CoachConversationResponse)
def create_conversation(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = CoachConversation(user_id=current_user.id, summary="New Chat")
    db.add(convo)
    db.commit()
    db.refresh(convo)
    return convo

@router.patch("/conversations/{conversation_id}", response_model=CoachConversationResponse)
def rename_conversation(conversation_id: uuid.UUID, data: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.query(CoachConversation).filter(CoachConversation.id == conversation_id, CoachConversation.user_id == current_user.id).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    if "title" in data:
        convo.summary = data["title"]
    db.commit()
    db.refresh(convo)
    return convo


@router.get("/messages", response_model=PaginatedMessagesResponse)
def get_messages(
    conversation_id: uuid.UUID,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * size
    query = db.query(CoachMessage).filter(CoachMessage.conversation_id == conversation_id)
    total = query.count()
    
    # Newest first for pagination fetching
    messages = query.order_by(desc(CoachMessage.created_at)).offset(offset).limit(size).all()
    
    return PaginatedMessagesResponse(
        items=messages,
        total=total,
        page=page,
        size=size
    )

@router.post("/message", response_model=CoachMessageResponse)
def send_message(msg_in: CoachMessageCreate, db: Session = Depends(get_db)):
    # 1. Save student message
    student_msg = CoachMessage(
        conversation_id=msg_in.conversation_id,
        sender=MessageSender.student,
        content=msg_in.content,
        message_type=MessageType.reply
    )
    db.add(student_msg)
    
    # 2. Update conversation last_message_at
    convo = db.query(CoachConversation).filter(CoachConversation.id == msg_in.conversation_id).first()
    if convo:
        convo.last_message_at = datetime.utcnow()
        
    db.commit()
    
    # 3. Gather Context
    student_name = "Student"
    
    convo = db.query(CoachConversation).filter(CoachConversation.id == msg_in.conversation_id).first()
    if convo:
        convo.last_message_at = datetime.utcnow()
        user = db.query(User).filter(User.id == convo.user_id).first()
        if user:
            student_name = user.full_name or "Student"
            
    first_name = student_name.split()[0] if student_name else "Student"
    
    # Determine general time of day (lowercased)
    hour = datetime.now().hour
    if hour < 12:
        time_of_day = "morning"
    elif hour < 17:
        time_of_day = "afternoon"
    else:
        time_of_day = "evening"

    # Determine if this is the student's first message today
    import datetime as dt
    now_local = dt.datetime.now()
    now_utc = dt.datetime.utcnow()
    
    all_student_msgs = db.query(CoachMessage).filter(
        CoachMessage.conversation_id == convo.id if convo else False,
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

    # Find the course with the most recent last_activity_time
    last_active_course = "None"
    last_active_days_ago = None
    last_active_str = "never"
    recently_completed = "none"
    
    cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == user.id).all() if (convo and user) else []
    
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
                
        # Also detect recently completed (either 100% progress active in last 24h, or assessment completed in last 24h)
        c_progress = d.get("progress_percent") or d.get("progress", {}).get("progress_percent", 0.0) or 0.0
        if active_str:
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

    # Nearest assignment/quiz deadline within 7 days from Reminder model and LMSDataCache
    upcoming_deadline_str = "none soon"
    from app.db.models.reminders import Reminder
    if convo and user:
        today_date = date.today()
        end_date = today_date + timedelta(days=7)
        
        upcoming_deadlines = []
        
        # 1. Check user reminders
        deadlines = db.query(Reminder).filter(
            Reminder.user_id == user.id,
            Reminder.status == "active",
            Reminder.date >= today_date,
            Reminder.date <= end_date
        ).all()
        for r in deadlines:
            days_away = (r.date - today_date).days
            upcoming_deadlines.append((days_away, f"{r.title} in {days_away} days"))
            
        # 2. Check LMS pending assessments
        for entry in cache_entries:
            d = entry.data
            course_name = d.get("course_name", d.get("name", "Course"))
            assessments = d.get("assessments", [])
            for ass in assessments:
                if not ass.get("graded", False):
                    due_date_str = ass.get("due_date") or ass.get("timestamp")
                    if due_date_str:
                        try:
                            due_dt = datetime.fromisoformat(due_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                            due_date = due_dt.date()
                            if today_date <= due_date <= end_date:
                                days_away = (due_date - today_date).days
                                upcoming_deadlines.append((days_away, f"{ass.get('assessment_name')} ({course_name}) in {days_away} days"))
                        except Exception:
                            pass
                            
        if upcoming_deadlines:
            upcoming_deadlines.sort(key=lambda x: x[0])
            upcoming_deadline_str = upcoming_deadlines[0][1]

    # Fetch cohort statistics
    cohort_stats = {}
    try:
        system_user = db.query(User).filter(User.email == "system-stats@dashboard.local").first()
        if system_user:
            sys_caches = db.query(LMSDataCache).filter(LMSDataCache.user_id == system_user.id).all()
            cohort_stats = {entry.course_id: entry.data for entry in sys_caches}
    except Exception as e:
        logger.error(f"Failed to fetch global course stats for chat prompt: {e}")

    # Courses and Progress listing
    courses_progress_lines = []
    grades_lines = []
    for entry in cache_entries:
        d = entry.data
        c_name = d.get("course_name", d.get("name", "Course"))
        c_progress = d.get("progress_percent") or d.get("progress", {}).get("progress_percent", 0.0) or 0.0
        items_completed = d.get("completed_components") or d.get("progress", {}).get("completed_items", 0)
        total_items = d.get("total_components") or d.get("progress", {}).get("total_items", 0)
        
        course_id = entry.course_id
        cohort_pct = None
        if course_id in cohort_stats:
            cohort_pct = cohort_stats[course_id].get("avg_progress_percent")

        if cohort_pct is not None:
            courses_progress_lines.append(f"{c_name}: {c_progress}% ({items_completed} of {total_items} items) (Class Average Progress: {cohort_pct}%)")
        else:
            courses_progress_lines.append(f"{c_name}: {c_progress}% ({items_completed} of {total_items} items)")
        
        # Grades Summary
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

    # Active Goals listing
    from app.db.models.goals import Goal, GoalStatus
    active_goals_str = "No active goals"
    if convo and user:
        active_goals = db.query(Goal).filter(
            Goal.user_id == user.id,
            Goal.status == GoalStatus.active
        ).all()
        if active_goals:
            goals_lines = []
            for g in active_goals:
                date_str = g.target_date.strftime("%Y-%m-%d") if g.target_date else "no deadline"
                goals_lines.append(f"{g.title} — {g.progress_percent}% — target: {date_str}")
            active_goals_str = "\n".join(goals_lines)

    # Active Pending Nudges listing
    from app.db.models.nudge import PendingNudge, NudgeGlobalSettings
    active_nudges_str = "No active nudges"
    if convo and user:
        settings = db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()
        expiry_days = settings.nudge_expiry_days if settings else 7
        now = datetime.now(timezone.utc)
        expiry_threshold = now - timedelta(days=expiry_days)
        
        active_nudges = db.query(PendingNudge).filter(
            PendingNudge.user_id == user.id,
            PendingNudge.is_dismissed == False,
            (PendingNudge.remind_later_at == None) | (PendingNudge.remind_later_at <= now),
            PendingNudge.generated_at >= expiry_threshold
        ).all()
        if active_nudges:
            nudges_lines = []
            for n in active_nudges:
                nudges_lines.append(f"- [{n.nudge_type}] {n.message} (course: {n.course_name})")
            active_nudges_str = "\n".join(nudges_lines)

    # Past Conversation Summary
    summary_str = "No previous summary — this is an early conversation"
    if convo:
        summary_str = convo.summary if (convo.summary and convo.summary != "New Chat") else "No previous summary — this is an early conversation"

    # Coach Memory
    coach_memory_str = "Building memory — early conversations"

    # Recent student messages (last 3 student messages specifically)
    student_message_1 = ""
    student_message_2 = ""
    student_message_3 = ""
    if convo:
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

    # Message History (last 5 messages, excluding the current message just sent)
    message_history = ""
    if convo:
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

ACTIVE NUDGES:
{active_nudges_str}

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

The student just said: "{msg_in.content}"
"""

    full_prompt = f"{DEFAULT_SYSTEM_PROMPT}\n\n{prompt}"
    
    # 4. Generate AI response
    ai_reply = gemini_client.generate_coach_message(full_prompt)
    
    # 5. Save Coach response
    coach_msg = CoachMessage(
        conversation_id=msg_in.conversation_id,
        sender=MessageSender.coach,
        content=ai_reply,
        message_type=MessageType.response
    )
    db.add(coach_msg)
    if convo:
        convo.last_message_at = datetime.utcnow()
    db.commit()
    db.refresh(coach_msg)
    
    return coach_msg

@router.get("/notes", response_model=CoachNotesResponse)
def get_coach_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # 1. Fetch user courses data from cache
    courses_data = db.query(LMSDataCache).filter(LMSDataCache.user_id == current_user.id).all()
    courses_list = []
    for c in courses_data:
        c_name = c.data.get("course_name", c.data.get("name", "Unknown Course"))
        c_progress = c.data.get("progress_percent") or c.data.get("progress", {}).get("progress_percent", 0.0) or 0.0
        courses_list.append(f"- {c_name}: {c_progress}% completed")
    courses_summary = "\n".join(courses_list) if courses_list else "None linked"

    # 2. Fetch user goals
    from app.db.models.goals import Goal
    goals_data = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    goals_list = []
    for g in goals_data:
        goals_list.append(f"- {g.title} (Status: {g.status}, Progress: {g.progress_percent}%)")
    goals_summary = "\n".join(goals_list) if goals_list else "No goals set"

    # 3. Fetch user rhythm activity in the past 14 days
    from app.db.models.daily_activity import DailyActivity
    rhythm_data = db.query(DailyActivity).filter(
        DailyActivity.user_id == current_user.id,
        DailyActivity.was_active == True
    ).order_by(DailyActivity.date.desc()).limit(14).all()
    rhythm_days = [r.date.strftime('%a') for r in rhythm_data]
    rhythm_summary = f"Active days in last 2 weeks: {', '.join(set(rhythm_days))}" if rhythm_days else "No study activity logged yet in the past 2 weeks"

    # 4. Fallback default values
    fallback_notes = CoachNotesResponse(
        learning_patterns=[
            "You tend to study mostly on " + (", ".join(set(rhythm_days)) if rhythm_days else "weekdays"),
            "We are tracking your study time to find your peak active hours.",
            "Complete more components to help me spot your learning style!"
        ],
        wellbeing=[
            "You seem focused and steady. Keep up the good work!",
            "Remember to take short breaks during longer study sessions.",
            "Let me know in chat if you feel stuck or overwhelmed."
        ],
        goals=[
            f"You have set {len(goals_data)} goal(s) so far.",
            "Short-term goals (1-2 weeks) tend to work best for focus.",
            "We will track your progress automatically as you update goals."
        ],
        courses=[
            f"Active courses: {len(courses_data)}",
            "Focus on the course with the highest completion first.",
            courses_list[0] if courses_list else "No active course enrollments loaded yet."
        ],
        last_updated=datetime.utcnow()
    )

    # 5. Gemini request if configured
    if gemini_client.model:
        prompt = f"""
You are the student's learning coach. Analyze the following student dashboard data and write highly personalized, fresh insights for their Coach Notes.
Format the output ONLY as a valid JSON object matching the JSON schema below. Do not output anything else. No backticks, no Markdown wrapping (e.g. do not wrap in ```json).

JSON Schema:
{{
  "learning_patterns": [string, string, string],
  "wellbeing": [string, string, string],
  "goals": [string, string, string],
  "courses": [string, string, string]
}}

STUDENT DATA:
Name: {current_user.full_name or 'Student'}
Courses:
{courses_summary}

Goals:
{goals_summary}

Rhythm:
{rhythm_summary}
"""
        try:
            raw_res = gemini_client.generate_coach_message(prompt)
            # clean JSON markdown markers if any
            clean_res = raw_res.strip()
            if clean_res.startswith("```"):
                lines = clean_res.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                clean_res = "\n".join(lines).strip()
            
            import json
            parsed = json.loads(clean_res)
            return CoachNotesResponse(
                learning_patterns=parsed.get("learning_patterns", fallback_notes.learning_patterns),
                wellbeing=parsed.get("wellbeing", fallback_notes.wellbeing),
                goals=parsed.get("goals", fallback_notes.goals),
                courses=parsed.get("courses", fallback_notes.courses),
                last_updated=datetime.utcnow()
            )
        except Exception as e:
            print(f"Failed to generate dynamic Gemini notes: {e}")
            return fallback_notes

    return fallback_notes

@router.post("/notes/clear")
def clear_coach_notes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Deleting all conversations and chat messages clears the coach's context/memory.
    conversation_ids = [c.id for c in db.query(CoachConversation).filter(CoachConversation.user_id == current_user.id).all()]
    if conversation_ids:
        db.query(CoachMessage).filter(CoachMessage.conversation_id.in_(conversation_ids)).delete(synchronize_session=False)
    db.query(CoachConversation).filter(CoachConversation.user_id == current_user.id).delete(synchronize_session=False)
    db.commit()
    return {"status": "success", "message": "Coach memory cleared successfully."}

@router.get("/latest-greeting")
def get_latest_greeting(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # Find the most recent message from the coach in any of the user's conversations
    conversation_ids = [c.id for c in db.query(CoachConversation).filter(CoachConversation.user_id == current_user.id).all()]
    msg = None
    if conversation_ids:
        msg = db.query(CoachMessage).filter(
            CoachMessage.sender == MessageSender.coach,
            CoachMessage.conversation_id.in_(conversation_ids)
        ).order_by(desc(CoachMessage.created_at)).first()
    
    if msg:
        return {"message": msg.content, "timestamp": msg.created_at}
    return {
        "message": f"Hello {current_user.full_name.split()[0] if current_user.full_name else 'there'}! I'm keeping track of your learning rhythm and goals. Let me know if you want to chat about your progress!",
        "timestamp": None
    }

@router.get("/messages/search", response_model=list[CoachMessageResponse])
def search_messages(q: str, conversation_id: uuid.UUID, db: Session = Depends(get_db)):
    if not q:
        return []
    
    pattern = f"%{q}%"
    messages = db.query(CoachMessage).filter(
        CoachMessage.conversation_id == conversation_id,
        CoachMessage.content.ilike(pattern)
    ).order_by(desc(CoachMessage.created_at)).limit(20).all()
    
    return messages

@router.get("/lms-check/{username}")
async def lms_check(username: str):
    from app.services.openedx_client import openedx_client
    try:
        enrollments = await openedx_client.get_user_courses_direct(username)
        return {"username": username, "enrollments": enrollments}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LMS check failed: {str(e)}")
