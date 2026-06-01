import json
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from sqlalchemy import desc
from .base_watcher import WatcherResult
from app.db.models import User, CoachMessage, Goal, CoachConversation, LMSDataCache
from app.db.models.coach_studio import CoachPromptVersion, CoachConfig, PredefinedResponse

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

class MessageBuilder:
    def __init__(self, gemini_client):
        self.gemini = gemini_client

    async def _get_active_prompt(self, db: Session):
        version = db.query(CoachPromptVersion).filter(
            CoachPromptVersion.is_active == True,
            CoachPromptVersion.is_draft == False
        ).first()
        if version:
            return version.prompt_text
        return DEFAULT_SYSTEM_PROMPT

    def _get_config_val(self, db: Session, key: str, default: any = None):
        conf = db.query(CoachConfig).filter(CoachConfig.config_key == key).first()
        if conf:
            try:
                return json.loads(conf.config_value)
            except json.JSONDecodeError:
                return conf.config_value
        return default

    async def build(self, user_id: str, chosen_result: WatcherResult, db: Session) -> str:
        # Check Predefined Responses
        # Note: For proactive watcher messages, the "trigger" might be based on the observation. 
        # But per the instructions, we check predefined responses. Since watcher messages don't have a "User Message", 
        # we check the reasoning/suggested action if we really needed to, but the instructions implied predefined 
        # responses are mostly for chat. We'll still check if any apply just in case the observation matches a keyword.
        msg_to_check = (chosen_result.reasoning + " " + chosen_result.suggested_action).lower()
        
        responses = db.query(PredefinedResponse).filter(PredefinedResponse.is_enabled == True).order_by(PredefinedResponse.display_order).all()
        matched_response = None
        preferred_contexts = []
        
        for r in responses:
            matched = False
            if r.match_mode == "any":
                matched = any(kw.lower() in msg_to_check for kw in r.trigger_keywords)
            elif r.match_mode == "all":
                matched = all(kw.lower() in msg_to_check for kw in r.trigger_keywords)
            elif r.match_mode == "exact":
                matched = msg_to_check.strip() in [kw.lower() for kw in r.trigger_keywords]
                
            if matched:
                if r.priority == "strict":
                    matched_response = r.response_text
                    break
                else:
                    preferred_contexts.append(r.response_text)
                    
        if matched_response:
            return matched_response

        # Build dynamic prompt
        system_prompt = await self._get_active_prompt(db)
        context = await self._gather_context(user_id, db)
        
        # Apply behavior settings
        max_sentences = self._get_config_val(db, "behavior.max_sentences", 4)
        use_first_name = self._get_config_val(db, "behavior.use_first_name", True)
        
        if not use_first_name:
            context['first_name'] = "Student"
            
        prompt = self._build_prompt(context, chosen_result, max_sentences)

        if preferred_contexts:
            prompt += f"\n\nPREFERRED RESPONSE GUIDANCE:\n{preferred_contexts[0]}"

        full_prompt = f"{system_prompt}\n\n{prompt}"
        
        raw_response = self.gemini.generate_coach_message(full_prompt)
        
        from .message_validator import MessageValidator
        validator = MessageValidator()
        validation = validator.validate(raw_response, chosen_result.agent_name)
        
        if validation["valid"]:
            return validation["message"]
        return validation.get("fallback", "I noticed something interesting about your learning this week. Want to chat about it?")

    async def _gather_context(self, user_id, db) -> dict:
        user = db.query(User).filter(User.id == user_id).first()
        student_name = user.full_name if user else "Student"
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
        # Since watcher agents are scheduled proactive alerts, they might not have a specific conversation session
        # being actively created. But we can fetch the user's most recent conversation!
        convo = db.query(CoachConversation).filter(CoachConversation.user_id == user_id).order_by(desc(CoachConversation.last_message_at)).first()
        
        first_message_today = "true"
        if convo:
            import datetime as dt
            now_local = dt.datetime.now()
            now_utc = dt.datetime.utcnow()
            
            all_student_msgs = db.query(CoachMessage).filter(
                CoachMessage.conversation_id == convo.id,
                CoachMessage.sender == "student"
            ).all()
            
            other_msgs_today = []
            for m in all_student_msgs:
                msg_date = m.created_at.date()
                if msg_date == now_local.date() or msg_date == now_utc.date():
                    other_msgs_today.append(m)
                    
            first_message_today = "true" if len(other_msgs_today) == 0 else "false"

        # Find the course with the most recent last_activity_time
        last_active_course = "None"
        last_active_days_ago = None
        last_active_str = "never"
        recently_completed = "none"
        
        cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == user_id).all()
        
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
                    
            # Detect recently completed
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

        # Upcoming deadlines within 7 days
        upcoming_deadline_str = "none soon"
        from app.db.models.reminders import Reminder
        today_date = date.today()
        end_date = today_date + timedelta(days=7)
        deadlines = db.query(Reminder).filter(
            Reminder.user_id == user_id,
            Reminder.status == "active",
            Reminder.date >= today_date,
            Reminder.date <= end_date
        ).all()
        if deadlines:
            deadlines = sorted(deadlines, key=lambda r: r.date)
            closest = deadlines[0]
            days_away = (closest.date - today_date).days
            upcoming_deadline_str = f"{closest.title} in {days_away} days"

        # Courses and Progress listing
        courses_progress_lines = []
        grades_lines = []
        for entry in cache_entries:
            d = entry.data
            c_name = d.get("course_name", d.get("name", "Course"))
            c_progress = d.get("progress_percent") or d.get("progress", {}).get("progress_percent", 0.0) or 0.0
            items_completed = d.get("completed_components") or d.get("progress", {}).get("completed_items", 0)
            total_items = d.get("total_components") or d.get("progress", {}).get("total_items", 0)
            courses_progress_lines.append(f"{c_name}: {c_progress}% ({items_completed} of {total_items} items)")
            
            # Grades
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

        # Active goals
        active_goals_str = "No active goals"
        from app.db.models.goals import Goal, GoalStatus
        active_goals = db.query(Goal).filter(
            Goal.user_id == user_id,
            Goal.status == GoalStatus.active
        ).all()
        if active_goals:
            goals_lines = []
            for g in active_goals:
                date_str = g.target_date.strftime("%Y-%m-%d") if g.target_date else "no deadline"
                goals_lines.append(f"{g.title} — {g.progress_percent}% — target: {date_str}")
            active_goals_str = "\n".join(goals_lines)

        # Past Conversation Summary
        summary_str = "No previous summary — this is an early conversation"
        if convo and convo.summary and convo.summary != "New Chat":
            summary_str = convo.summary

        # Coach Memory
        coach_memory_str = "Building memory — early conversations"

        # Recent student messages
        student_message_1 = ""
        student_message_2 = ""
        student_message_3 = ""
        if convo:
            recent_student_msgs = db.query(CoachMessage).filter(
                CoachMessage.conversation_id == convo.id,
                CoachMessage.sender == "student"
            ).order_by(desc(CoachMessage.created_at)).limit(3).all()
            student_msgs_list = [m.content for m in reversed(recent_student_msgs)]
            while len(student_msgs_list) < 3:
                student_msgs_list.insert(0, "")
            student_message_1 = student_msgs_list[0]
            student_message_2 = student_msgs_list[1]
            student_message_3 = student_msgs_list[2]

        # Last 5 messages
        message_history = ""
        if convo:
            recent_history_msgs = db.query(CoachMessage).filter(
                CoachMessage.conversation_id == convo.id
            ).order_by(desc(CoachMessage.created_at)).limit(5).all()
            message_history = "\n".join([f"{m.sender.value}: {m.content}" for m in reversed(recent_history_msgs)])

        faqs = self._get_config_val(db, "knowledge.faqs", [])
        active_faqs = [faq for faq in faqs if faq.get("is_active", True)]
        kb_text = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in active_faqs]) if active_faqs else "None"

        return {
            "first_name": first_name,
            "time_of_day": time_of_day,
            "first_message_today": first_message_today,
            "last_active_course": last_active_course,
            "last_active_str": last_active_str,
            "recently_completed": recently_completed,
            "upcoming_deadline_str": upcoming_deadline_str,
            "courses_progress_str": courses_progress_str,
            "grades_summary_str": grades_summary_str,
            "active_goals_str": active_goals_str,
            "summary_str": summary_str,
            "coach_memory_str": coach_memory_str,
            "student_message_1": student_message_1,
            "student_message_2": student_message_2,
            "student_message_3": student_message_3,
            "message_history": message_history,
            "knowledge_base": kb_text
        }

    def _build_prompt(self, context, result: WatcherResult, max_sentences: int) -> str:
        return f"""STUDENT CONTEXT:
Name: {context['first_name']}
Time_of_day: {context['time_of_day']}
First message today: {context['first_message_today']}

COURSE ACTIVITY:
Last active course: {context['last_active_course']}
Last active: {context['last_active_str']}
Recently completed: {context['recently_completed'] if context['recently_completed'] != "none" else "none recently"}
Upcoming deadline: {context['upcoming_deadline_str']}

COURSES AND PROGRESS:
{context['courses_progress_str']}

GRADES SUMMARY:
{context['grades_summary_str']}

ACTIVE GOALS:
{context['active_goals_str']}

PAST CONVERSATION SUMMARY:
{context['summary_str']}

WHAT YOU REMEMBER ABOUT THIS STUDENT:
{context['coach_memory_str']}

RECENT STUDENT MESSAGES (for tone reading):
- "{context['student_message_1']}"
- "{context['student_message_2']}"
- "{context['student_message_3']}"

LAST 5 MESSAGES (for continuity):
{context['message_history']}

KNOWLEDGE BASE / FAQs (Use this info to answer questions or provide guidance):
{context['knowledge_base']}

---

OBSERVATION from {result.agent_name}:
{result.reasoning}

Suggested action: {result.suggested_action}
Additional context: {json.dumps(result.context_for_message)}

---

Write a proactive message from the coach to {context['first_name']}.
Be warm, specific, and brief (maximum {max_sentences} sentences).
Reference the specific observation above — do not be generic.
"""

    def _get_time_of_day(self) -> str:
        hour = datetime.now().hour
        if hour < 12: return "morning"
        elif hour < 17: return "afternoon"
        elif hour < 21: return "evening"
        else: return "night"
