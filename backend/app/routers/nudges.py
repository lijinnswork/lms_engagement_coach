import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel

from app.database import get_db
from app.api.deps import get_current_active_user, RoleChecker
from app.db.models.user import User
from app.db.models.nudge import PendingNudge, NudgeRangeConfig, NudgeGlobalSettings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nudges", tags=["nudges"])

# Role-based checkers
require_admin = RoleChecker(['support_staff', 'super_admin'])
require_super_admin = RoleChecker(['super_admin'])

# Pydantic Schemas
class PendingNudgeSchema(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    course_id: str
    course_name: str
    nudge_type: str
    message: str
    range_config_id: Optional[uuid.UUID] = None
    email_sent: bool
    email_sent_at: Optional[datetime] = None
    generated_at: datetime
    is_dismissed: bool
    dismissed_at: Optional[datetime] = None
    remind_later_at: Optional[datetime] = None
    action_taken: Optional[str] = None

    class Config:
        from_attributes = True

class NudgeRangeConfigSchema(BaseModel):
    id: uuid.UUID
    range_name: str
    from_pct: int
    to_pct: int
    tone: str
    is_enabled: bool
    message_template: Optional[str] = None
    stuck_trigger_days: int
    max_repeats: int
    display_order: int

    class Config:
        from_attributes = True

class NudgeRangeConfigCreate(BaseModel):
    range_name: str
    from_pct: int
    to_pct: int
    tone: str
    is_enabled: Optional[bool] = True
    message_template: Optional[str] = None
    stuck_trigger_days: Optional[int] = 7
    max_repeats: Optional[int] = 3
    display_order: int

class NudgeRangeConfigUpdate(BaseModel):
    range_name: Optional[str] = None
    from_pct: Optional[int] = None
    to_pct: Optional[int] = None
    tone: Optional[str] = None
    is_enabled: Optional[bool] = None
    message_template: Optional[str] = None
    stuck_trigger_days: Optional[int] = None
    max_repeats: Optional[int] = None
    display_order: Optional[int] = None

class NudgeGlobalSettingsSchema(BaseModel):
    id: int
    inactivity_threshold_days: int
    goal_behind_threshold_pct: int
    max_active_nudges: int
    nudge_expiry_days: int
    email_nudges_enabled: bool
    respect_student_email_setting: bool
    updated_at: datetime

    class Config:
        from_attributes = True

class NudgeGlobalSettingsUpdate(BaseModel):
    inactivity_threshold_days: Optional[int] = None
    goal_behind_threshold_pct: Optional[int] = None
    max_active_nudges: Optional[int] = None
    nudge_expiry_days: Optional[int] = None
    email_nudges_enabled: Optional[bool] = None
    respect_student_email_setting: Optional[bool] = None

class ResetConfirmation(BaseModel):
    confirm: bool

class RangePreviewRequest(BaseModel):
    course_name: str
    progress_pct: int
    range_name: str
    from_pct: int
    to_pct: int
    tone: str
    message_template: Optional[str] = None
    nudge_type: str  # range_entry or range_stuck

# Seeding Helper
def seed_default_ranges_and_settings(db: Session):
    # Ensure settings exist
    settings = db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()
    if not settings:
        settings = NudgeGlobalSettings(
            id=1,
            inactivity_threshold_days=5,
            goal_behind_threshold_pct=50,
            max_active_nudges=3,
            nudge_expiry_days=7,
            email_nudges_enabled=True,
            respect_student_email_setting=True
        )
        db.add(settings)
        db.commit()

    # Ensure range configs exist
    configs_count = db.query(NudgeRangeConfig).count()
    if configs_count == 0:
        defaults = [
            {"range_name": "Just Started", "from_pct": 0, "to_pct": 10, "tone": "motivational", "display_order": 1},
            {"range_name": "Early Stage", "from_pct": 10, "to_pct": 25, "tone": "momentum-building", "display_order": 2},
            {"range_name": "Building Up", "from_pct": 25, "to_pct": 50, "tone": "celebratory", "display_order": 3},
            {"range_name": "Halfway+", "from_pct": 50, "to_pct": 75, "tone": "celebratory", "display_order": 4},
            {"range_name": "Final Stretch", "from_pct": 75, "to_pct": 90, "tone": "motivational", "display_order": 5},
            {"range_name": "Almost There", "from_pct": 90, "to_pct": 100, "tone": "celebratory", "display_order": 6},
            {"range_name": "Complete", "from_pct": 100, "to_pct": 100, "tone": "celebration", "display_order": 7},
        ]
        for d in defaults:
            cfg = NudgeRangeConfig(
                range_name=d["range_name"],
                from_pct=d["from_pct"],
                to_pct=d["to_pct"],
                tone=d["tone"],
                display_order=d["display_order"],
                is_enabled=True
            )
            db.add(cfg)
        db.commit()

# ==========================================
# STUDENT API ENDPOINTS
# ==========================================

@router.get("", response_model=List[PendingNudgeSchema])
@router.get("/", response_model=List[PendingNudgeSchema])
async def get_nudges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Ensure DB is seeded
    seed_default_ranges_and_settings(db)
    
    # Load settings
    settings = db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()
    expiry_days = settings.nudge_expiry_days if settings else 7
    
    now = datetime.now(timezone.utc)
    expiry_threshold = now - timedelta(days=expiry_days)
    
    # Retrieve pending active nudges
    pending = db.query(PendingNudge).filter(
        PendingNudge.user_id == current_user.id,
        PendingNudge.is_dismissed == False,
        (PendingNudge.remind_later_at == None) | (PendingNudge.remind_later_at <= now),
        PendingNudge.generated_at >= expiry_threshold
    ).order_by(desc(PendingNudge.generated_at)).limit(10).all()
    
    return pending

@router.post("/{id}/dismiss")
async def dismiss_nudge(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    nudge = db.query(PendingNudge).filter(
        PendingNudge.id == id,
        PendingNudge.user_id == current_user.id
    ).first()
    if not nudge:
        raise HTTPException(status_code=404, detail="Nudge not found")

    nudge.is_dismissed = True
    nudge.dismissed_at = datetime.now(timezone.utc)
    nudge.action_taken = "dismissed"
    db.commit()
    return {"success": True}

@router.post("/{id}/open-course")
async def open_course_nudge(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    nudge = db.query(PendingNudge).filter(
        PendingNudge.id == id,
        PendingNudge.user_id == current_user.id
    ).first()
    if not nudge:
        raise HTTPException(status_code=404, detail="Nudge not found")

    nudge.is_dismissed = True
    nudge.dismissed_at = datetime.now(timezone.utc)
    nudge.action_taken = "opened_course"
    db.commit()
    
    return {
        "course_id": nudge.course_id,
        "redirect_url": f"/course/{nudge.course_id}"
    }

@router.post("/{id}/remind-later")
async def remind_later_nudge(
    id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    nudge = db.query(PendingNudge).filter(
        PendingNudge.id == id,
        PendingNudge.user_id == current_user.id
    ).first()
    if not nudge:
        raise HTTPException(status_code=404, detail="Nudge not found")

    nudge.remind_later_at = datetime.now(timezone.utc) + timedelta(hours=24)
    nudge.action_taken = "remind_later"
    db.commit()
    return {"success": True}

# ==========================================
# ADMIN API ENDPOINTS
# ==========================================

@router.get("/admin/ranges", response_model=List[NudgeRangeConfigSchema])
async def list_ranges(
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    seed_default_ranges_and_settings(db)
    return db.query(NudgeRangeConfig).order_by(NudgeRangeConfig.display_order).all()

@router.post("/admin/ranges", response_model=NudgeRangeConfigSchema)
async def create_range(
    range_in: NudgeRangeConfigCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    # Create config
    cfg = NudgeRangeConfig(
        range_name=range_in.range_name,
        from_pct=range_in.from_pct,
        to_pct=range_in.to_pct,
        tone=range_in.tone,
        is_enabled=range_in.is_enabled,
        message_template=range_in.message_template,
        stuck_trigger_days=range_in.stuck_trigger_days,
        max_repeats=range_in.max_repeats,
        display_order=range_in.display_order
    )
    db.add(cfg)
    db.commit()
    db.refresh(cfg)
    return cfg

@router.patch("/admin/ranges/{id}", response_model=NudgeRangeConfigSchema)
async def update_range(
    id: uuid.UUID,
    range_in: NudgeRangeConfigUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    cfg = db.query(NudgeRangeConfig).filter(NudgeRangeConfig.id == id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Range config not found")
        
    for field, value in range_in.dict(exclude_unset=True).items():
        setattr(cfg, field, value)
        
    db.commit()
    db.refresh(cfg)
    return cfg

@router.delete("/admin/ranges/{id}")
async def delete_range(
    id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    cfg = db.query(NudgeRangeConfig).filter(NudgeRangeConfig.id == id).first()
    if not cfg:
        raise HTTPException(status_code=404, detail="Range config not found")
        
    # Block deletion of default ranges by name
    defaults_names = {"Just Started", "Early Stage", "Building Up", "Halfway+", "Final Stretch", "Almost There", "Complete"}
    if cfg.range_name in defaults_names:
        raise HTTPException(
            status_code=403,
            detail="Cannot delete the 7 default seeded ranges"
        )
        
    db.delete(cfg)
    db.commit()
    return {"success": True}

@router.post("/admin/ranges/reset")
async def reset_ranges(
    confirmation: ResetConfirmation,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    if not confirmation.confirm:
        raise HTTPException(status_code=400, detail="Confirmation required")
        
    # Delete all range configs
    db.query(NudgeRangeConfig).delete()
    db.commit()
    
    # Re-seed defaults
    seed_default_ranges_and_settings(db)
    return {"success": True}

@router.get("/admin/settings", response_model=NudgeGlobalSettingsSchema)
async def get_settings(
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    seed_default_ranges_and_settings(db)
    return db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()

@router.patch("/admin/settings", response_model=NudgeGlobalSettingsSchema)
async def update_settings(
    settings_in: NudgeGlobalSettingsUpdate,
    current_user: User = Depends(require_super_admin),
    db: Session = Depends(get_db)
):
    settings = db.query(NudgeGlobalSettings).filter(NudgeGlobalSettings.id == 1).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Global settings not found")
        
    for field, value in settings_in.dict(exclude_unset=True).items():
        setattr(settings, field, value)
        
    db.commit()
    db.refresh(settings)
    return settings

@router.get("/admin/analytics")
async def get_analytics(
    period: str = "30d",
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    days = 30
    if period == "7d":
        days = 7
    elif period == "90d":
        days = 90
        
    now = datetime.now(timezone.utc)
    since = now - timedelta(days=days)
    
    # Query total nudges in period
    total = db.query(func.count(PendingNudge.id)).filter(
        PendingNudge.generated_at >= since
    ).scalar() or 0
    
    # Query rates
    opened = db.query(func.count(PendingNudge.id)).filter(
        PendingNudge.generated_at >= since,
        PendingNudge.action_taken == "opened_course"
    ).scalar() or 0
    
    dismissed = db.query(func.count(PendingNudge.id)).filter(
        PendingNudge.generated_at >= since,
        PendingNudge.action_taken == "dismissed"
    ).scalar() or 0
    
    remind_later = db.query(func.count(PendingNudge.id)).filter(
        PendingNudge.generated_at >= since,
        PendingNudge.action_taken == "remind_later"
    ).scalar() or 0
    
    open_rate = round((opened / total) * 100, 1) if total > 0 else 0.0
    dismiss_rate = round((dismissed / total) * 100, 1) if total > 0 else 0.0
    remind_later_rate = round((remind_later / total) * 100, 1) if total > 0 else 0.0
    
    # Breakdown by nudge type
    type_breakdown = db.query(PendingNudge.nudge_type, func.count(PendingNudge.id)).filter(
        PendingNudge.generated_at >= since
    ).group_by(PendingNudge.nudge_type).all()
    by_type = {t: count for t, count in type_breakdown}
    
    # Breakdown by range_config_id
    range_breakdown = db.query(
        PendingNudge.range_config_id,
        func.count(PendingNudge.id),
        func.sum(func.case((PendingNudge.action_taken == "opened_course", 1), else_=0))
    ).filter(
        PendingNudge.generated_at >= since,
        PendingNudge.range_config_id != None
    ).group_by(PendingNudge.range_config_id).all()
    
    by_range = []
    for r_id, sent_count, open_count in range_breakdown:
        cfg = db.query(NudgeRangeConfig).filter(NudgeRangeConfig.id == r_id).first()
        r_name = cfg.range_name if cfg else "Unknown"
        by_range.append({
            "range_config_id": str(r_id),
            "range_name": r_name,
            "sent_count": sent_count,
            "open_rate": round((open_count / sent_count) * 100, 1) if sent_count > 0 else 0.0
        })
        
    return {
        "total_nudges_sent": total,
        "open_rate": open_rate,
        "dismiss_rate": dismiss_rate,
        "remind_later_rate": remind_later_rate,
        "by_type": by_type,
        "by_range": by_range
    }

@router.post("/admin/ranges/preview")
async def preview_range_nudge(
    req: RangePreviewRequest,
    current_user: User = Depends(require_admin)
):
    from app.services.gemini_client import gemini_client
    prompt = f"""Generate a warm, brief nudge (1-2 sentences maximum) for a student at this stage in their course.

Course: {req.course_name}
Current progress: {req.progress_pct}%
Stage: {req.range_name} ({req.from_pct}% to {req.to_pct}%)
Tone required: {req.tone}
Trigger type: {req.nudge_type}

"""
    if req.message_template:
        prompt += f"Use this as a base, adapting lightly: {req.message_template}\n"
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
    msg = gemini_client.generate_coach_message(prompt)
    return {"message": msg}
