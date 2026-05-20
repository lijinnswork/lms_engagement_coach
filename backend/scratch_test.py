import asyncio
import sys
import os
from apscheduler.schedulers.asyncio import AsyncIOScheduler

# setup python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, SessionLocal
from app.db.base import Base
from app.db.models import User
from app.scheduler.jobs import run_watcher_agents

async def test_run():
    print("Migrating db locally...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("Creating test user...")
            from uuid import uuid4
            from datetime import datetime, timezone
            user = User(
                id=uuid4(),
                email="testagent@example.com",
                password_hash="fake",
                full_name="Agent Tester",
                is_active=True,
                created_at=datetime.now(timezone.utc)
            )
            db.add(user)
            db.commit()

        print(f"Testing with user {user.id}")
        await run_watcher_agents()
        print("Run watcher agents completed without throwing exceptions.")
    except Exception as e:
        print(f"Exception: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_run())
