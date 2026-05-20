from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.database import get_db
from app.api.deps import RoleChecker
from app.db.models.user import User
from app.db.models.coach_studio import CoachConfig, CoachPromptVersion, PredefinedResponse
import json
import uuid
from datetime import datetime
from fastapi import UploadFile, File

router = APIRouter(prefix="/admin/coach-studio", tags=["admin-coach-studio"])

require_super_admin = RoleChecker(['super_admin'])

# ==========================================
# HELPER FUNCTIONS
# ==========================================
def get_config_val(db: Session, key: str, default: any = None):
    conf = db.query(CoachConfig).filter(CoachConfig.config_key == key).first()
    if conf:
        try:
            return json.loads(conf.config_value)
        except json.JSONDecodeError:
            return conf.config_value
    return default

def set_config_val(db: Session, key: str, value: any, user_id: str):
    conf = db.query(CoachConfig).filter(CoachConfig.config_key == key).first()
    val_str = json.dumps(value) if not isinstance(value, str) else value
    if conf:
        conf.config_value = val_str
        conf.updated_by = user_id
    else:
        conf = CoachConfig(config_key=key, config_value=val_str, updated_by=user_id)
        db.add(conf)
    db.commit()

# ==========================================
# PERSONA
# ==========================================
@router.get("/persona")
async def get_persona(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return {
        "display_name": get_config_val(db, "persona.display_name", "Your Coach"),
        "avatar_url": get_config_val(db, "persona.avatar_url", ""),
        "personality_description": get_config_val(db, "persona.description", "A supportive friend..."),
        "personality_traits": get_config_val(db, "persona.traits", ["Warm", "Casual", "Empathetic", "Curious"])
    }

@router.patch("/persona")
async def update_persona(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    for key, value in data.items():
        set_config_val(db, f"persona.{key}", value, current_user.id)
    return {"status": "success"}

# ==========================================
# BASE PROMPT
# ==========================================
@router.get("/prompt")
async def get_prompt(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    active = db.query(CoachPromptVersion).filter(CoachPromptVersion.is_active == True).first()
    draft = db.query(CoachPromptVersion).filter(CoachPromptVersion.is_draft == True).order_by(desc(CoachPromptVersion.created_at)).first()
    return {
        "active_prompt": active.prompt_text if active else None,
        "draft_prompt": draft.prompt_text if draft else (active.prompt_text if active else None)
    }

@router.patch("/prompt")
async def save_draft_prompt(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    draft = CoachPromptVersion(prompt_text=data["prompt_text"], is_active=False, is_draft=True)
    db.add(draft)
    db.commit()
    return {"status": "success"}

@router.post("/prompt/publish")
async def publish_prompt(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    # Deactivate current active
    db.query(CoachPromptVersion).filter(CoachPromptVersion.is_active == True).update({"is_active": False})
    # Create new active
    new_version = CoachPromptVersion(
        prompt_text=data["prompt_text"],
        is_active=True,
        is_draft=False,
        published_by=current_user.id,
        published_at=func.now()
    )
    db.add(new_version)
    db.commit()
    return {"status": "success"}

@router.get("/prompt/versions")
async def get_prompt_versions(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    versions = db.query(CoachPromptVersion).filter(CoachPromptVersion.is_draft == False).order_by(desc(CoachPromptVersion.created_at)).all()
    return [{"id": v.id, "version_number": v.version_number, "prompt_text": v.prompt_text, "published_at": v.published_at, "is_active": v.is_active} for v in versions]

@router.post("/prompt/restore/{version_id}")
async def restore_prompt(version_id: str, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    version = db.query(CoachPromptVersion).filter(CoachPromptVersion.id == version_id).first()
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    draft = CoachPromptVersion(prompt_text=version.prompt_text, is_active=False, is_draft=True)
    db.add(draft)
    db.commit()
    return {"status": "success"}

# ==========================================
# BEHAVIOR
# ==========================================
@router.get("/behavior")
async def get_behavior(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return {
        "max_response_sentences": get_config_val(db, "behavior.max_sentences", 4),
        "response_delay_seconds": get_config_val(db, "behavior.response_delay", 2),
        "default_nudge_frequency": get_config_val(db, "behavior.nudge_frequency", 3),
        "min_gap_hours": get_config_val(db, "behavior.min_gap", 24),
        "quiet_hours_start": get_config_val(db, "behavior.quiet_start", "22:00"),
        "quiet_hours_end": get_config_val(db, "behavior.quiet_end", "08:00"),
        "match_energy": get_config_val(db, "behavior.match_energy", True),
        "soften_on_negative_mood": get_config_val(db, "behavior.soften_mood", True),
        "use_first_name": get_config_val(db, "behavior.use_first_name", True)
    }

@router.patch("/behavior")
async def update_behavior(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    for key, value in data.items():
        if key == "max_response_sentences": set_config_val(db, "behavior.max_sentences", value, current_user.id)
        elif key == "response_delay_seconds": set_config_val(db, "behavior.response_delay", value, current_user.id)
        elif key == "default_nudge_frequency": set_config_val(db, "behavior.nudge_frequency", value, current_user.id)
        elif key == "min_gap_hours": set_config_val(db, "behavior.min_gap", value, current_user.id)
        elif key == "quiet_hours_start": set_config_val(db, "behavior.quiet_start", value, current_user.id)
        elif key == "quiet_hours_end": set_config_val(db, "behavior.quiet_end", value, current_user.id)
        elif key == "match_energy": set_config_val(db, "behavior.match_energy", value, current_user.id)
        elif key == "soften_on_negative_mood": set_config_val(db, "behavior.soften_mood", value, current_user.id)
        elif key == "use_first_name": set_config_val(db, "behavior.use_first_name", value, current_user.id)
    return {"status": "success"}

# ==========================================
# DATA SOURCES
# ==========================================
@router.get("/data-sources")
async def get_data_sources(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return {
        "lms": get_config_val(db, "data.lms.enabled", True),
        "moods": get_config_val(db, "data.moods.enabled", True),
        "goals": get_config_val(db, "data.goals.enabled", True),
        "history": get_config_val(db, "data.history.enabled", True),
        "observations": get_config_val(db, "data.observations.enabled", True),
        "context_window": get_config_val(db, "data.context_window", 5)
    }

@router.patch("/data-sources")
async def update_data_sources(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    for key, value in data.items():
        if key == "context_window":
            set_config_val(db, "data.context_window", value, current_user.id)
        else:
            set_config_val(db, f"data.{key}.enabled", value, current_user.id)
    return {"status": "success"}

@router.post("/data-sources/sync")
async def sync_data_sources(current_user: User = Depends(require_super_admin)):
    # Mocking LMS refresh
    return {"status": "success"}

# ==========================================
# PREDEFINED RESPONSES & KNOWLEDGE BASE
# ==========================================
@router.get("/knowledge")
async def get_knowledge(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return get_config_val(db, "knowledge.faqs", [])

@router.patch("/knowledge")
async def update_knowledge(payload: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    data = payload.get("data", [])
    set_config_val(db, "knowledge.faqs", data, current_user.id)
    return {"status": "success"}

@router.get("/knowledge/documents")
async def get_documents(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return get_config_val(db, "knowledge.documents", [])

@router.post("/knowledge/upload")
async def upload_document(file: UploadFile = File(...), current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    docs = get_config_val(db, "knowledge.documents", [])
    new_doc = {
        "id": str(uuid.uuid4()), 
        "name": file.filename, 
        "status": "Processed", 
        "date": datetime.now().strftime("%b %d, %Y")
    }
    docs.append(new_doc)
    set_config_val(db, "knowledge.documents", docs, current_user.id)
    return new_doc

@router.delete("/knowledge/documents/{doc_id}")
async def delete_document(doc_id: str, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    docs = get_config_val(db, "knowledge.documents", [])
    docs = [d for d in docs if d.get("id") != doc_id]
    set_config_val(db, "knowledge.documents", docs, current_user.id)
    return {"status": "success"}
@router.get("/responses")
async def get_responses(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    responses = db.query(PredefinedResponse).order_by(PredefinedResponse.display_order).all()
    return responses

@router.post("/responses")
async def create_response(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    r = PredefinedResponse(
        trigger_name=data["trigger_name"],
        trigger_keywords=data["trigger_keywords"],
        match_mode=data["match_mode"],
        response_text=data["response_text"],
        priority=data["priority"],
        is_critical=data.get("is_critical", False),
        is_enabled=data.get("is_enabled", True),
        display_order=data.get("display_order", 0)
    )
    db.add(r)
    db.commit()
    return {"status": "success"}

@router.patch("/responses/{response_id}")
async def update_response(response_id: str, data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    r = db.query(PredefinedResponse).filter(PredefinedResponse.id == response_id).first()
    if not r: raise HTTPException(status_code=404)
    if "trigger_name" in data: r.trigger_name = data["trigger_name"]
    if "trigger_keywords" in data: r.trigger_keywords = data["trigger_keywords"]
    if "match_mode" in data: r.match_mode = data["match_mode"]
    if "response_text" in data: r.response_text = data["response_text"]
    if "priority" in data: r.priority = data["priority"]
    if "is_enabled" in data: r.is_enabled = data["is_enabled"]
    db.commit()
    return {"status": "success"}

@router.delete("/responses/{response_id}")
async def delete_response(response_id: str, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    r = db.query(PredefinedResponse).filter(PredefinedResponse.id == response_id).first()
    if not r: raise HTTPException(status_code=404)
    db.delete(r)
    db.commit()
    return {"status": "success"}

# ==========================================
# WATCHERS
# ==========================================
@router.get("/watchers")
async def get_watchers(current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return {
        "engagement": get_config_val(db, "watcher.engagement", {"active": True, "inactivity_days": 4, "drop_threshold": 50, "course_inactive": 14}),

        "momentum": get_config_val(db, "watcher.momentum", {"active": True, "consistency_streak": 7, "improvement_threshold": 15}),
        "goal_progress": get_config_val(db, "watcher.goal_progress", {"active": True, "behind_threshold": 50, "stale_days": 14}),
        "curiosity": get_config_val(db, "watcher.curiosity", {"active": True, "topic_revisit": 3, "deep_engagement": 2.0, "min_data_weeks": 2})
    }

@router.patch("/watchers/{agent_name}")
async def update_watchers(agent_name: str, data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    current_val = get_config_val(db, f"watcher.{agent_name}", {})
    current_val.update(data)
    set_config_val(db, f"watcher.{agent_name}", current_val, current_user.id)
    return {"status": "success"}

# ==========================================
# TEST CHAT
# ==========================================
from app.services.gemini_client import gemini_client
import time
from sqlalchemy.sql import func

@router.post("/test-chat")
async def test_chat(data: dict, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    start_time = time.time()
    
    msg = data.get("message", "")
    prompt_mode = data.get("prompt_mode", "draft")
    mock_student = data.get("mock_student", "test")
    history = data.get("conversation_history", [])
    
    # 1. Fetch Prompt
    if prompt_mode == "live":
        version = db.query(CoachPromptVersion).filter(CoachPromptVersion.is_active == True).first()
    else:
        version = db.query(CoachPromptVersion).filter(CoachPromptVersion.is_draft == True).order_by(desc(CoachPromptVersion.created_at)).first()
    
    system_prompt = version.prompt_text if version else "You are a helpful coach."
    
    # 2. Check predefined responses
    responses = db.query(PredefinedResponse).filter(PredefinedResponse.is_enabled == True).order_by(PredefinedResponse.display_order).all()
    
    matched_response = None
    predefined_match_name = None
    preferred_contexts = []
    
    msg_lower = msg.lower()
    for r in responses:
        matched = False
        if r.match_mode == "any":
            matched = any(kw.lower() in msg_lower for kw in r.trigger_keywords)
        elif r.match_mode == "all":
            matched = all(kw.lower() in msg_lower for kw in r.trigger_keywords)
        elif r.match_mode == "exact":
            matched = msg_lower.strip() in [kw.lower() for kw in r.trigger_keywords]
            
        if matched:
            predefined_match_name = r.trigger_name
            if r.priority == "strict":
                matched_response = r.response_text
                break
            else:
                preferred_contexts.append(r.response_text)
                
    # 3. Handle Strict Match
    if matched_response:
        return {
            "response": matched_response,
            "debug": {
                "prompt_sent": "Bypassed Gemini due to STRICT predefined response.",
                "tokens_input": 0,
                "tokens_output": 0,
                "response_time_ms": int((time.time() - start_time) * 1000),
                "predefined_match": predefined_match_name,
                "data_sources_used": []
            }
        }
        
    # 4. Generate Context
    ds = get_data_sources(current_user, db)
    used_ds = []
    
    # Mock data based on mock_student
    student_ctx = "Student: Test Student"
    if mock_student == "struggling":
        student_ctx += "\nMoods: Overwhelmed, Tired\nGoals: Behind"
    elif mock_student == "active":
        student_ctx += "\nMoods: Great, Good\nGoals: Ahead"
    
    if preferred_contexts:
        student_ctx += f"\n\nPREFERRED RESPONSE GUIDANCE:\n{preferred_contexts[0]}"
        
    faqs = get_config_val(db, "knowledge.faqs", [])
    active_faqs = [faq for faq in faqs if faq.get("is_active", True)]
    if active_faqs:
        kb_text = "\n".join([f"Q: {faq['question']}\nA: {faq['answer']}" for faq in active_faqs])
        student_ctx += f"\n\nKNOWLEDGE BASE / FAQS (Use this info to answer questions):\n{kb_text}"
        
    full_prompt = f"{system_prompt}\n\nContext:\n{student_ctx}\n\nUser Message: {msg}"
    
    raw_response = gemini_client.generate_coach_message(full_prompt)
    
    return {
        "response": raw_response,
        "debug": {
            "prompt_sent": full_prompt,
            "tokens_input": len(full_prompt.split()), # Mocking token count
            "tokens_output": len(raw_response.split()), # Mocking token count
            "response_time_ms": int((time.time() - start_time) * 1000),
            "predefined_match": predefined_match_name,
            "data_sources_used": ["mocked"]
        }
    }
