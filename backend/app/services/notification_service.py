import datetime
from sqlalchemy.orm import Session
from app.db.models.reminders import Reminder, ScheduledNotification

def calculate_notification_times(date_val: datetime.date, time_val: datetime.time, remind_at: list[str]) -> list[datetime.datetime]:
    times = []
    base_dt = datetime.datetime.combine(date_val, time_val)
    for timing in remind_at:
        if timing == "at_time":
            times.append(base_dt)
        elif timing == "30_min_before":
            times.append(base_dt - datetime.timedelta(minutes=30))
        elif timing == "1_hour_before":
            times.append(base_dt - datetime.timedelta(hours=1))
        elif timing == "1_day_before":
            times.append(base_dt - datetime.timedelta(days=1))
    return times

def schedule_notifications_for_reminder(db: Session, reminder: Reminder):
    # Clear existing unsent notifications
    db.query(ScheduledNotification).filter(
        ScheduledNotification.reminder_id == reminder.id,
        ScheduledNotification.sent == False
    ).delete()

    if reminder.status != "active":
        return

    notification_times = calculate_notification_times(reminder.date, reminder.time, reminder.remind_at)
    
    for dt in notification_times:
        # Schedule in_app
        db.add(ScheduledNotification(
            reminder_id=reminder.id,
            user_id=reminder.user_id,
            channel="in_app",
            scheduled_at=dt
        ))
        # Schedule push
        db.add(ScheduledNotification(
            reminder_id=reminder.id,
            user_id=reminder.user_id,
            channel="push",
            scheduled_at=dt
        ))
        
        # Email only for 1 hour or 1 day before
        base_dt = datetime.datetime.combine(reminder.date, reminder.time)
        if dt < base_dt:
            db.add(ScheduledNotification(
                reminder_id=reminder.id,
                user_id=reminder.user_id,
                channel="email",
                scheduled_at=dt
            ))
