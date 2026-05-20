from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.api.deps import get_current_active_user, RoleChecker
from app.db.models.user import User

router = APIRouter(prefix="/admin", tags=["admin"])

# Different role dependencies
require_admin_view = RoleChecker(['support_staff', 'super_admin'])
require_admin_manage = RoleChecker(['super_admin'])
require_super_admin = RoleChecker(['super_admin'])

# ==========================================
# DASHBOARD ENDPOINTS
# ==========================================

@router.get("/dashboard/stats")
async def get_dashboard_stats(period: str = '30d', current_user: User = Depends(require_admin_view), db: Session = Depends(get_db)):
    return {
        "total_users": 247,
        "active_this_week": 189,
        "goal_completion_rate": "72%",
        "avg_mood": 3.8
    }

@router.get("/dashboard/charts")
async def get_dashboard_charts(period: str = '30d', current_user: User = Depends(require_admin_view)):
    return {"message": "mock chart data"}

@router.get("/dashboard/activity-feed")
async def get_activity_feed(current_user: User = Depends(require_admin_view)):
    return []

# ==========================================
# USERS ENDPOINTS
# ==========================================

@router.get("/users")
async def list_users(current_user: User = Depends(require_admin_view), db: Session = Depends(get_db)):
    users = db.query(User).all()
    return users

@router.post("/users", status_code=status.HTTP_201_CREATED)
async def create_user(user_data: dict, current_user: User = Depends(require_admin_manage), db: Session = Depends(get_db)):
    return {"message": "User invite sent."}

@router.patch("/users/{user_id}")
async def update_user(user_id: str, update_data: dict, current_user: User = Depends(require_admin_manage), db: Session = Depends(get_db)):
    # Simple mock return
    return {"message": "User updated"}

@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    return {"message": "User deleted"}

@router.get("/users/{user_id}/profile")
async def get_user_profile(user_id: str, current_user: User = Depends(require_admin_view)):
    return {"id": user_id, "mock": "profile_data"}

# ==========================================
# COACH MONITOR ENDPOINTS
# ==========================================

from sqlalchemy import func
from app.db.models import CoachMessage, AgentLog

@router.get("/coach/stats")
async def get_coach_stats(period: str = '30d', current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    total_messages = db.query(func.count(CoachMessage.id)).scalar() or 0
    proactive_messages = db.query(func.count(CoachMessage.id)).filter(CoachMessage.is_proactive == True).scalar() or 0
    
    proactive_rate = int((proactive_messages / total_messages * 100)) if total_messages > 0 else 0
    
    # Calculate avg per student per week
    total_users = db.query(func.count(User.id)).scalar() or 1
    avg_per_week = round(proactive_messages / max(total_users, 1), 1)

    # Reception rate (replied or acknowledged vs ignored/dismissed)
    positive_reception = db.query(func.count(CoachMessage.id)).filter(
        CoachMessage.is_proactive == True,
        CoachMessage.student_response.in_(["replied", "acknowledged"])
    ).scalar() or 0
    
    reception_rate = int((positive_reception / proactive_messages * 100)) if proactive_messages > 0 else 0

    return {
        "messages_sent": total_messages,
        "proactive_rate": proactive_rate,
        "avg_per_student_week": avg_per_week,
        "positive_reception_rate": reception_rate
    }

@router.get("/coach/charts")
async def get_coach_charts(period: str = '30d', current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    # Trigger Distribution from AgentLog
    agent_counts = db.query(AgentLog.agent_name, func.count(AgentLog.id)).filter(AgentLog.decision == 'speak').group_by(AgentLog.agent_name).all()
    trigger_data = [{"value": count, "name": str(name.value) if hasattr(name, 'value') else str(name)} for name, count in agent_counts]

    # For now, just return dynamic triggers and mock the rest to avoid complex time-series queries
    return {
        "trigger_distribution": trigger_data,
        "message_types": [5, 8, 22, 30, 35], # Mock data matching frontend
        "response_rate": [72, 75, 71, 78, 80, 85, 82] # Mock data matching frontend
    }

@router.get("/coach/safety-report")
async def get_coach_safety_report(period: str = '30d', current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    error_logs = db.query(func.count(AgentLog.id)).filter(AgentLog.decision == 'error').scalar() or 0
    return {
        "blocked_messages": error_logs,
        "crisis_handled": 0,
        "auto_truncated": 0,
        "validation_failures": error_logs,
        "total_passed": 340
    }

@router.get("/coach/samples")
async def get_coach_samples(count: int = 10, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    messages = db.query(CoachMessage).filter(CoachMessage.is_proactive == True).order_by(CoachMessage.created_at.desc()).limit(count).all()
    samples = []
    for m in messages:
        # Find which agent triggered this message
        agent = "unknown"
        log = db.query(AgentLog).filter(AgentLog.message_id == m.id).first()
        if log:
            agent = str(log.agent_name.value) if hasattr(log.agent_name, 'value') else str(log.agent_name)
            
        samples.append({
            "id": str(m.id),
            "text": m.text,
            "type": "proactive",
            "agent": agent,
            "reception": m.student_response or "ignored"
        })
    return samples

# ==========================================
# AGENT CONTROLS ENDPOINTS
# ==========================================

@router.get("/agents/status")
async def get_agent_status(current_user: User = Depends(require_super_admin)):
    return {"scheduler": "Running"}

from app.scheduler.jobs import run_watcher_agents
import asyncio

@router.post("/agents/run-now")
async def run_agents_now(current_user: User = Depends(require_super_admin)):
    asyncio.create_task(run_watcher_agents())
    return {"status": "triggered"}

@router.post("/agents/pause")
async def pause_scheduler(current_user: User = Depends(require_super_admin)):
    return {"status": "paused"}

@router.post("/agents/resume")
async def resume_scheduler(current_user: User = Depends(require_super_admin)):
    return {"status": "running"}

@router.patch("/agents/{agent_name}")
async def toggle_agent(agent_name: str, current_user: User = Depends(require_super_admin)):
    return {"status": f"{agent_name} toggled"}

@router.get("/agents/gemini-status")
async def check_gemini(current_user: User = Depends(require_super_admin)):
    return {"status": "Connected"}

@router.get("/agents/system-prompt")
async def get_prompt(current_user: User = Depends(require_super_admin)):
    return {"prompt": "You are an AI coach..."}

# ==========================================
# AGENT LOGS & SYSTEM
# ==========================================

from app.db.models import AgentLog

@router.get("/logs")
async def get_logs(limit: int = 100, current_user: User = Depends(require_super_admin), db: Session = Depends(get_db)):
    logs = db.query(AgentLog).order_by(AgentLog.created_at.desc()).limit(limit).all()
    
    formatted_logs = []
    for log in logs:
        time_str = log.created_at.strftime("%I:%M %p") if log.created_at else "Unknown"
        details_str = str(log.observation) if log.observation else ""
        formatted_logs.append({
            "id": str(log.id),
            "time": time_str,
            "agent": str(log.agent_name.value) if hasattr(log.agent_name, "value") else str(log.agent_name),
            "decision": str(log.decision.value) if hasattr(log.decision, "value") else str(log.decision),
            "reasoning": log.reasoning,
            "details": details_str,
            "priority": log.priority
        })
    return formatted_logs

@router.get("/system/health")
async def get_system_health(current_user: User = Depends(require_super_admin)):
    return {"status": "healthy"}
