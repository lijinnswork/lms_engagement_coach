from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api.deps import get_current_user
from app.db.models.user import User
from app.db.models.reminders import PushSubscription, ScheduledNotification
from app.schemas.reminders import PushSubscriptionCreate
import datetime

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.post("/push-subscription")
def save_push_subscription(subscription: PushSubscriptionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    existing = db.query(PushSubscription).filter(PushSubscription.user_id == current_user.id).first()
    if existing:
        existing.subscription_json = subscription.subscription_json
    else:
        new_sub = PushSubscription(
            user_id=current_user.id,
            subscription_json=subscription.subscription_json
        )
        db.add(new_sub)
    db.commit()
    return {"status": "success"}

@router.get("/recent")
def get_recent_notifications(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    now = datetime.datetime.utcnow()
    # Fetch in-app notifications sent in the last 24 hours
    twenty_four_hours_ago = now - datetime.timedelta(hours=24)
    recent = db.query(ScheduledNotification).filter(
        ScheduledNotification.user_id == current_user.id,
        ScheduledNotification.channel == "in_app",
        ScheduledNotification.sent == True,
        ScheduledNotification.sent_at >= twenty_four_hours_ago
    ).order_by(ScheduledNotification.sent_at.desc()).limit(10).all()
    
    return [
        {
            "id": n.id,
            "reminder_id": n.reminder_id,
            "title": n.reminder.title if n.reminder else "Reminder",
            "type": n.reminder.reminder_type if n.reminder else "generic",
            "sent_at": n.sent_at
        }
        for n in recent
    ]
