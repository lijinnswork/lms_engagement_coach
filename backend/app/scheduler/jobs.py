import asyncio
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.database import SessionLocal
from app.db.models import User, AgentLog, LMSDataCache, DailyActivity
from datetime import datetime, timezone, timedelta
import logging

from app.agents import (
    EngagementWatcher, MomentumWatcher, GoalProgressWatcher, CuriosityWatcher,
    DecisionEngine, MessageBuilder, MessageValidator, DeliveryService, ProgressRangeWatcher
)
from app.agents.reminder_agent import ReminderSuggestionAgent
from app.services.gemini_client import gemini_client
from app.services.openedx_client import OpenEdxClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

async def run_watcher_agents():
    logger.info("Running watcher agents for all active users...")
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()

        for user in users:
            try:
                results = []
                
                # We need to run them synchronously or gather them since these are async methods.
                # In SQLAlchemy async isn't fully set up for SessionLocal, but BaseWatcher uses `async def observe`
                engagement = EngagementWatcher()
                results.append(await engagement.observe(user.id, db))
                

                momentum = MomentumWatcher()
                results.append(await momentum.observe(user.id, db))
                
                goal_progress = GoalProgressWatcher()
                results.append(await goal_progress.observe(user.id, db))
                
                curiosity = CuriosityWatcher()
                results.append(await curiosity.observe(user.id, db))
                
                reminder_agent = ReminderSuggestionAgent()
                results.append(await reminder_agent.observe(user.id, db))

                progress_range_watcher = ProgressRangeWatcher()
                results.append(await progress_range_watcher.observe(user.id, db))
                
                for r in results:
                    log = AgentLog(
                        user_id=user.id,
                        agent_name=r.agent_name,
                        observation=r.observation,
                        decision="speak" if r.should_speak else "stay_silent",
                        reasoning=r.reasoning,
                        priority=r.priority if r.should_speak else None,
                        created_at=datetime.now(timezone.utc)
                    )
                    db.add(log)
                db.commit()
                
                engine = DecisionEngine()
                decision = await engine.decide(user.id, results, db)
                
                if decision["action"] == "speak":
                    chosen = decision["chosen_result"]
                    
                    builder = MessageBuilder(gemini_client)
                    message_text = await builder.build(user.id, chosen, db)
                    
                    validator = MessageValidator()
                    validation = validator.validate(message_text, chosen.agent_name)
                    
                    if validation["valid"]:
                        final_text = validation["message"]
                    else:
                        if validation.get("fallback"):
                            final_text = validation["fallback"]
                        else:
                            continue
                            
                    delivery = DeliveryService()
                    await delivery.deliver(user.id, final_text, chosen, db)
                    
            except Exception as e:
                logger.error(f"Error processing user {user.id}: {e}")
                log = AgentLog(
                    user_id=user.id,
                    agent_name="decision_engine",
                    observation={"error": str(e)},
                    decision="error",
                    reasoning=f"Exception during agent run: {str(e)}",
                    created_at=datetime.now(timezone.utc)
                )
                db.add(log)
                db.commit()
    finally:
        db.close()

async def refresh_lms_data():
    logger.info("Refreshing LMS data cache...")
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.is_active == True).all()
        openedx = OpenEdxClient()

        # Batch size for rate limiting
        batch_size = 10
        for i in range(0, len(users), batch_size):
            batch = users[i:i + batch_size]
            for user in batch:
                if not user.openedx_user_id:
                    continue
                try:
                    enrollments = await openedx.get_user_enrollments(user.openedx_user_id)
                    for enrollment in enrollments:
                        course_id = enrollment["course_id"]
                        progress = await openedx.get_user_progress(course_id, user.openedx_user_id)
                        
                        # Update cache
                        existing = db.query(LMSDataCache).filter(LMSDataCache.user_id == user.id, LMSDataCache.course_id == course_id).first()
                        if existing:
                            existing.data = progress
                        else:
                            new_cache = LMSDataCache(
                                user_id=user.id,
                                course_id=course_id,
                                data=progress
                            )
                            db.add(new_cache)
                        
                        # Process daily activity
                        last_active_at_str = progress.get("progress_details", {}).get("last_active_at")
                        if last_active_at_str:
                            try:
                                # Ensure we parse to a date correctly (could be ISO format)
                                last_active_date = datetime.fromisoformat(last_active_at_str.replace('Z', '+00:00')).date()
                                
                                # Check if a record exists for this date and user
                                daily_act = db.query(DailyActivity).filter(
                                    DailyActivity.user_id == user.id,
                                    DailyActivity.date == last_active_date
                                ).first()
                                
                                if daily_act:
                                    daily_act.was_active = True
                                    daily_act.courses_accessed += 1
                                else:
                                    new_act = DailyActivity(
                                        user_id=user.id,
                                        date=last_active_date,
                                        was_active=True,
                                        courses_accessed=1
                                    )
                                    db.add(new_act)
                            except ValueError:
                                logger.error(f"Failed to parse last_active_at: {last_active_at_str}")

                    db.commit()
                except Exception as e:
                    logger.error(f"Error fetching LMS data for user {user.id}: {e}")
                    db.rollback() # Prevent broken transactions from ruining the batch
            # Respect API rate limits between batches
            await asyncio.sleep(2)
            
    finally:
        db.close()

async def weekly_reset():
    logger.info("Running weekly reset...")
    db = SessionLocal()
    try:
        db.query(User).update({User.coach_interactions_week: 0})
        db.commit()
    finally:
        db.close()

async def check_and_send_notifications():
    logger.info("Checking for scheduled notifications...")
    db = SessionLocal()
    try:
        from app.db.models.reminders import ScheduledNotification, PushSubscription
        from app.services.email_service import send_email
        from pywebpush import webpush, WebPushException
        import json
        import os

        now = datetime.now(timezone.utc)
        
        pending = db.query(ScheduledNotification).filter(
            ScheduledNotification.sent == False,
            ScheduledNotification.scheduled_at <= now
        ).all()
        
        vapid_private = os.getenv("VAPID_PRIVATE_KEY")
        vapid_claims = {"sub": "mailto:admin@example.com"}

        for notif in pending:
            try:
                user = db.query(User).filter(User.id == notif.user_id).first()
                if notif.channel == "in_app":
                    # In-app notifications are polled by the frontend from /api/notifications/recent
                    pass
                elif notif.channel == "email":
                    if user and user.email:
                        subject = f"Reminder: {notif.reminder.title if notif.reminder else 'Study Session'}"
                        body = f"Hi {user.name},\n\nJust a reminder for: {notif.reminder.title if notif.reminder else 'your study session'}."
                        await send_email(user.email, subject, body)
                elif notif.channel == "push":
                    sub = db.query(PushSubscription).filter(PushSubscription.user_id == notif.user_id).first()
                    if sub and vapid_private:
                        payload = json.dumps({
                            "title": "New Reminder",
                            "body": notif.reminder.title if notif.reminder else "Time to study!",
                            "icon": "/logo.png"
                        })
                        try:
                            webpush(
                                subscription_info=sub.subscription_json,
                                data=payload,
                                vapid_private_key=vapid_private,
                                vapid_claims=vapid_claims
                            )
                        except WebPushException as ex:
                            logger.error(f"Push error: {repr(ex)}")

                notif.sent = True
                notif.sent_at = now
            except Exception as e:
                logger.error(f"Error sending notification {notif.id}: {e}")
                
        db.commit()
    finally:
        db.close()

def setup_scheduler():
    import os
    env_run_int = int(os.environ.get("AGENT_RUN_INTERVAL_HOURS", "4"))
    env_lms_int = int(os.environ.get("AGENT_LMS_REFRESH_INTERVAL_HOURS", "2"))
    
    scheduler.add_job(
        run_watcher_agents,
        'interval', hours=env_run_int,
        id='watcher_agents',
        name='Run all watcher agents',
        replace_existing=True
    )
    scheduler.add_job(
        refresh_lms_data,
        'interval', hours=env_lms_int,
        id='refresh_lms',
        name='Refresh LMS data cache',
        replace_existing=True
    )
    scheduler.add_job(
        weekly_reset,
        'cron', day_of_week='mon', hour=0, minute=1,
        id='weekly_reset',
        name='Reset weekly interaction counters',
        replace_existing=True
    )
    scheduler.add_job(
        check_and_send_notifications,
        'interval', minutes=1,
        id='send_notifications',
        name='Process scheduled notifications',
        replace_existing=True
    )
    scheduler.start()
    logger.info("Scheduler started successfully")
