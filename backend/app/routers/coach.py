import uuid
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc
from datetime import datetime

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

DEFAULT_SYSTEM_PROMPT = """You are the user's supportive learning coach. You are warm,
casual, and empathetic — like a thoughtful friend who is good
at helping people stay connected to their learning goals.

YOU MUST:
- Use the student's first name
- Keep responses SHORT: 2-4 sentences, rarely more
- Be specific: reference actual data from their learning
- Offer and suggest, never command or demand
- Respect the student's agency — they are in charge
- Be curious about them, not just their numbers
- Match their energy: if they're brief, be brief back

YOU MUST NOT:
- Explain course content or teach concepts
- Give medical or mental health advice
- Shame, guilt, or create urgency
- Send messages longer than 4 sentences unless the student specifically asks
"""

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
    goals_str = "None active"
    courses_str = "None linked"
    lms_activity_str = "No active connection"
    
    convo = db.query(CoachConversation).filter(CoachConversation.id == msg_in.conversation_id).first()
    if convo:
        convo.last_message_at = datetime.utcnow()
        user = db.query(User).filter(User.id == convo.user_id).first()
        if user:
            student_name = user.full_name
            
            # Active goals
            from app.db.models.goals import Goal, GoalStatus
            active_goals = db.query(Goal).filter(
                Goal.user_id == user.id,
                Goal.status == GoalStatus.active
            ).all()
            if active_goals:
                goals_str = ", ".join([g.title for g in active_goals])
                
            # Courses progress from cache
            cache_entries = db.query(LMSDataCache).filter(LMSDataCache.user_id == user.id).all()
            if cache_entries:
                courses_list = []
                for entry in cache_entries:
                    d = entry.data
                    c_name = d.get("course_name", d.get("name", "Course"))
                    c_progress = d.get("progress_percent", d.get("progress", 0.0)) or 0.0
                    courses_list.append(f"{c_name} ({c_progress}%)")
                courses_str = ", ".join(courses_list)
                lms_activity_str = f"Connected. Last synchronized at {cache_entries[0].created_at.strftime('%Y-%m-%d %H:%M:%S UTC')}"

    recent_msgs = db.query(CoachMessage).filter(CoachMessage.conversation_id == msg_in.conversation_id).order_by(desc(CoachMessage.created_at)).limit(5).all()
    # Reverse so they are chronological
    recent_context = "\n".join([f"{m.sender.value}: {m.content}" for m in reversed(recent_msgs)])
    
    # Determine general time of day
    hour = datetime.now().hour
    if hour < 12:
        time_of_day = "Morning"
    elif hour < 17:
        time_of_day = "Afternoon"
    else:
        time_of_day = "Evening"

    prompt = f"""
{DEFAULT_SYSTEM_PROMPT}

Student: {student_name}
Current time: {time_of_day}
Active goals: {goals_str}
Current courses and progress: {courses_str}
LMS synchronization status: {lms_activity_str}
Last 5 coach messages (for continuity):
{recent_context}

The student just said: "{msg_in.content}"

Respond as the coach. Be warm, specific, and brief.
"""
    
    # 4. Generate AI response
    ai_reply = gemini_client.generate_coach_message(prompt)
    
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
def get_coach_notes():
    return CoachNotesResponse(
        learning_patterns=[
            "You tend to study most on Tue-Wed-Thu",
            "Your most active time is 10 AM - 12 PM",
            "You engage most deeply with hands-on exercises"
        ],
        wellbeing=[
            "Your average mood this month: Okay-Good",
            "You've felt overwhelmed 3 times this month",
            "You used breathing exercises twice"
        ],
        goals=[
            "You've completed 2 of 5 goals this month",
            "You prefer short-term goals (1-2 weeks)",
            "Goals you set yourself have higher completion than ones I suggest"
        ],
        courses=[
            "Strongest engagement: Python Fundamentals",
            "Most revisited topic: Data Structures",
            "Course with lowest activity: UX Design (2 weeks since last visit)"
        ],
        last_updated=datetime.utcnow()
    )

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
