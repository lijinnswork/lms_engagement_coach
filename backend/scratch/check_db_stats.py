import os
import sys
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import SessionLocal
from app.db.models.user import User
from app.db.models.user_session import UserSession
from app.db.models.goals import Goal
from app.db.models.lms_data_cache import LMSDataCache
from app.db.models.agent import AgentLog
from app.db.models.coach import CoachMessage
from app.db.models.daily_activity import DailyActivity

db = SessionLocal()
print("Total Users:", db.query(User).count())
print("Total Sessions:", db.query(UserSession).count())
print("Total Goals:", db.query(Goal).count())
print("Total LMS Data Caches:", db.query(LMSDataCache).count())
print("Total Agent Logs:", db.query(AgentLog).count())
print("Total Coach Messages:", db.query(CoachMessage).count())
print("Total Daily Activities:", db.query(DailyActivity).count())

print("\nSample User:")
user = db.query(User).first()
if user:
    print(f"ID: {user.id}, Email: {user.email}, Full Name: {user.full_name}, LMS Username: {user.lms_username}, Role: {user.role}")

print("\nSample Cache:")
cache = db.query(LMSDataCache).first()
if cache:
    print(f"User ID: {cache.user_id}, Course ID: {cache.course_id}")
    print("Data keys:", cache.data.keys())
    print("Data progress_percent:", cache.data.get("progress_percent"))
    print("Data progress details:", cache.data.get("progress"))
db.close()
