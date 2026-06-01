import os
import sys
import unittest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from app.main import app

class TestAdminRouter(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        # We need to bypass JWT auth or simulate an active admin login.
        # But wait, we can mock the current active user or Dependency overrides!
        from app.api.deps import RoleChecker
        # Override the dependency for testing
        from app.db.models.user import User
        # Let's override require_admin_view, require_admin_manage, require_super_admin
        from app.routers import admin_router
        
        # Simple mock admin user
        self.mock_admin = User(
            email="admin@iimbx.iimb.ac.in",
            full_name="Admin Tester",
            role="super_admin"
        )
        
        # Override FastAPI dependencies
        app.dependency_overrides[admin_router.require_admin_view] = lambda: self.mock_admin
        app.dependency_overrides[admin_router.require_admin_manage] = lambda: self.mock_admin
        app.dependency_overrides[admin_router.require_super_admin] = lambda: self.mock_admin

    def tearDown(self):
        app.dependency_overrides.clear()

    def test_dashboard_stats(self):
        response = self.client.get("/admin/dashboard/stats")
        print("\nStats Response:", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("total_users", data)
        self.assertIn("active_this_week", data)
        self.assertIn("goal_completion_rate", data)
        self.assertIn("avg_progress", data)
        self.assertIn("course_progress", data)

    def test_dashboard_charts(self):
        response = self.client.get("/admin/dashboard/charts")
        print("\nCharts Response:", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("engagement_over_time", data)
        self.assertIn("course_status", data)
        self.assertIn("goal_completion", data)
        self.assertIn("coach_activity", data)

    def test_activity_feed(self):
        response = self.client.get("/admin/dashboard/activity-feed")
        print("\nActivity Feed Response:", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        self.assertTrue(isinstance(response.json(), list))

    def test_coach_charts(self):
        response = self.client.get("/admin/coach/charts")
        print("\nCoach Charts Response:", response.status_code, response.json())
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("trigger_distribution", data)
        self.assertIn("message_types", data)
        self.assertIn("response_rate", data)

if __name__ == "__main__":
    unittest.main()
