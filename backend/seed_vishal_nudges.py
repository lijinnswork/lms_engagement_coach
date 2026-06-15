import sys
import os
import uuid
from datetime import datetime, timezone

sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.db.models.user import User
from app.db.models.nudge import PendingNudge, NudgeRangeConfig

def seed_nudges():
    db = SessionLocal()
    try:
        # Find Vishal Reddy
        email = "vishal.reddy@iimbx.iimb.ac.in"
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"User {email} not found. Please run seed_vishal.py first.")
            return

        print(f"Found user {user.full_name} with ID {user.id}")

        # Clear any existing nudges for Vishal to start fresh
        db.query(PendingNudge).filter(PendingNudge.user_id == user.id).delete()
        db.commit()
        print("Cleared old pending nudges for Vishal.")

        # Get a range config to link if possible (optional)
        range_cfg = db.query(NudgeRangeConfig).filter(NudgeRangeConfig.range_name == "Halfway+").first()
        range_cfg_id = range_cfg.id if range_cfg else None

        # Create exemplar nudges
        nudges_data = [
            {
                "course_id": "course-v1:IIMBx+1004+2025",
                "course_name": "IIMBx 1004: Business Analytics & Data Mining",
                "nudge_type": "range_stuck",
                "message": "Hey Vishal! You've been doing great in Business Analytics & Data Mining. You've been at 55% progress for a few days—would you like to tackle the next set of exercises together? I can help break down the concepts.",
                "range_config_id": range_cfg_id
            },
            {
                "course_id": "course-v1:IIMBx+1001+2025",
                "course_name": "IIMBx 1001: Introduction to Business Management",
                "nudge_type": "range_entry",
                "message": "Phenomenal momentum, Vishal! 🚀 You just entered the 'Early Stage' of Introduction to Business Management (15% completed). Keep up the fantastic pace!",
                "range_config_id": None
            },
            {
                "course_id": "course-v1:IIMBx+1004+2025",
                "course_name": "IIMBx 1004: Business Analytics & Data Mining",
                "nudge_type": "goal_behind",
                "message": "You set a target of 3 hours this week for Business Analytics, and you are currently slightly behind. Let's dedicate 15 minutes today to keep your streak alive!",
                "range_config_id": None
            },
            {
                "course_id": "course-v1:IIMBx+1001+2025",
                "course_name": "IIMBx 1001: Introduction to Business Management",
                "nudge_type": "inactivity",
                "message": "It's been 5 days since your last login to Introduction to Business Management. Even a 5-minute review can make a big difference! Let's get back into it.",
                "range_config_id": None
            }
        ]

        now = datetime.now(timezone.utc)
        for data in nudges_data:
            nudge = PendingNudge(
                id=uuid.uuid4(),
                user_id=user.id,
                course_id=data["course_id"],
                course_name=data["course_name"],
                nudge_type=data["nudge_type"],
                message=data["message"],
                range_config_id=data["range_config_id"],
                email_sent=False,
                generated_at=now,
                is_dismissed=False
            )
            db.add(nudge)
        
        db.commit()
        print(f"Successfully seeded {len(nudges_data)} exemplar nudges for Vishal!")
        
    except Exception as e:
        db.rollback()
        print("Error seeding nudges:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed_nudges()
