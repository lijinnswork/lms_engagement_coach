import os
import sys
import unittest
import uuid
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, "/Users/vishalcreddy/Desktop/AI_Coach_Student_Dashboard/1/backend")

from fastapi.testclient import TestClient
from app.main import app
from app.database import SessionLocal, engine
from app.db.base import Base
from app.db.models.user import User
from app.db.models.announcement import Announcement, AnnouncementDismissal

class TestDynamicFeatures(unittest.TestCase):
    def setUp(self):
        Base.metadata.create_all(bind=engine)
        self.db = SessionLocal()
        self.client = TestClient(app)
        
        # Clean up any leftover users
        self.db.query(User).filter(User.email == "test_dynamic@example.com").delete()
        self.db.commit()

        # Create a mock student user
        self.user = User(
            id=uuid.uuid4(),
            email="test_dynamic@example.com",
            password_hash="fake",
            full_name="Dynamic Test User",
            role="student",
            lms_username="testdynamic",
            is_active=True
        )
        self.db.add(self.user)
        self.db.commit()

        # Override get_current_user to return our user
        from app.api.deps import get_current_user
        app.dependency_overrides[get_current_user] = lambda: self.user

    def tearDown(self):
        self.db.query(User).filter(User.id == self.user.id).delete()
        self.db.query(AnnouncementDismissal).filter(AnnouncementDismissal.user_id == self.user.id).delete()
        self.db.commit()
        self.db.close()
        app.dependency_overrides.clear()

    def test_announcements_dismissal(self):
        # Create a test announcement
        ann = Announcement(
            id=uuid.uuid4(),
            text="Dynamic Test Announcement",
            type="info",
            source="manual",
            target_audience="all",
            start_date=datetime.utcnow() - timedelta(days=1),
            end_date=datetime.utcnow() + timedelta(days=1),
            is_active=True
        )
        self.db.add(ann)
        self.db.commit()

        # Fetch active announcements
        res = self.client.get("/announcements/")
        self.assertEqual(res.status_code, 200)
        items = res.json()
        self.assertTrue(any(i["id"] == str(ann.id) for i in items))

        # Dismiss announcement
        dismiss_res = self.client.post(f"/announcements/{ann.id}/dismiss")
        self.assertEqual(dismiss_res.status_code, 200)

        # Verify it's not active anymore
        res_after = self.client.get("/announcements/")
        self.assertEqual(res_after.status_code, 200)
        items_after = res_after.json()
        self.assertFalse(any(i["id"] == str(ann.id) for i in items_after))

        # Clean up announcement
        self.db.delete(ann)
        self.db.commit()

    def test_coach_notes_and_latest_greeting(self):
        # Fetch coach notes
        res = self.client.get("/coach/notes")
        self.assertEqual(res.status_code, 200)
        notes = res.json()
        self.assertIn("learning_patterns", notes)
        self.assertIn("wellbeing", notes)

        # Clear coach notes
        res_clear = self.client.post("/coach/notes/clear")
        self.assertEqual(res_clear.status_code, 200)
        self.assertEqual(res_clear.json()["status"], "success")

        # Fetch latest greeting
        res_greet = self.client.get("/coach/latest-greeting")
        self.assertEqual(res_greet.status_code, 200)
        self.assertIn("message", res_greet.json())

    def test_lms_sync_failure(self):
        # Trigger lms sync (should fail because LMS_URL in settings points to iimbx.site and we have no valid admin credentials)
        res = self.client.post("/account/openedx/sync")
        # Should raise a 500 containing "Poor connection" because sync failed
        self.assertEqual(res.status_code, 500)
        self.assertIn("Poor connection, try again for data population", res.json()["detail"])

if __name__ == "__main__":
    unittest.main()
