import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from backend.app.database import SessionLocal
from backend.app.db.models.user_session import UserSession
from sqlalchemy import desc

db = SessionLocal()
sessions = db.query(UserSession).order_by(desc(UserSession.created_at)).limit(5).all()
for s in sessions:
    print(f"Session {s.id} for user {s.user_id}: is_revoked={s.is_revoked}")
