import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, engine
from app.db.base import Base
from app.db.models.coach_studio import CoachPromptVersion
from app.routers.coach import DEFAULT_SYSTEM_PROMPT
from sqlalchemy.sql import func

def update_prompt():
    db = SessionLocal()
    try:
        # Check if the table exists by doing a select query
        # Since we use create_all in dev, let's make sure Base metadata creates it if not exists
        Base.metadata.create_all(bind=engine)
        
        print("Deactivating existing active prompt versions...")
        db.query(CoachPromptVersion).filter(CoachPromptVersion.is_active == True).update({"is_active": False})
        
        # Calculate next version number
        max_ver = db.query(func.max(CoachPromptVersion.version_number)).scalar() or 0
        next_ver = max_ver + 1
        
        print(f"Inserting the new AI Learning Coach prompt version (v{next_ver})...")
        new_version = CoachPromptVersion(
            prompt_text=DEFAULT_SYSTEM_PROMPT,
            version_number=next_ver,
            is_active=True,
            is_draft=False
        )
        db.add(new_version)
        db.commit()
        print("Successfully published the new Gemini System Prompt as active version!")
        
    except Exception as e:
        print(f"Skipped database update: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    update_prompt()
