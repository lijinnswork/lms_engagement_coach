import httpx
import logging
from datetime import datetime, timedelta, timezone
from app.config import settings
import asyncio

logger = logging.getLogger(__name__)

class OpenEdxClient:
    def __init__(self):
        self.base_url = settings.OPENEDX_BASE_URL
        self.client_id = settings.OPENEDX_CLIENT_ID
        self.client_secret = settings.OPENEDX_CLIENT_SECRET
        self.api_version = settings.OPENEDX_API_VERSION
        
        self._access_token = None
        self._token_expires_at = None
        self._client = httpx.AsyncClient(base_url=self.base_url) if self.base_url else None

    async def _authenticate(self):
        if not self._client:
            return # Mocking
            
        if self._access_token and self._token_expires_at and datetime.now(timezone.utc) < self._token_expires_at:
            return

        try:
            response = await self._client.post(
                "/oauth2/access_token",
                data={
                    "client_id": self.client_id,
                    "client_secret": self.client_secret,
                    "grant_type": "client_credentials"
                }
            )
            response.raise_for_status()
            data = response.json()
            self._access_token = data["access_token"]
            expires_in = data.get("expires_in", 3600)
            self._token_expires_at = datetime.now(timezone.utc) + timedelta(seconds=expires_in - 60)
        except Exception as e:
            logger.error(f"Failed to authenticate with Open edX: {e}")
            raise

    async def _request(self, method: str, endpoint: str, **kwargs):
        if not self._client:
            return self._mock_response(endpoint, kwargs.get("params", {}))
            
        await self._authenticate()
        headers = kwargs.pop("headers", {})
        headers["Authorization"] = f"Bearer {self._access_token}"
        
        try:
            response = await self._client.request(method, endpoint, headers=headers, **kwargs)
            response.raise_for_status()
            return response.json()
        except Exception as e:
            logger.error(f"Open edX API Error at {endpoint}: {e}")
            raise

    def _mock_response(self, endpoint: str, params: dict):
        """Returns realistic mock payloads mimicking Open edX API responses"""
        if "enrollment" in endpoint:
            return [
                {
                    "course_id": "course-v1:edX+DemoX+Demo_Course",
                    "mode": "honor",
                    "is_active": True,
                    "course_details": {
                        "course_id": "course-v1:edX+DemoX+Demo_Course",
                        "course_name": "Demonstration Course"
                    }
                }
            ]
        elif "progress" in endpoint:
            return {
                "course_id": "course-v1:edX+DemoX+Demo_Course",
                "progress_details": {
                    "total_components": 120,
                    "completed_components": 45,
                    "last_active_at": (datetime.now(timezone.utc) - timedelta(days=5)).isoformat(), # 5 days ago
                    "engagement_score": 0.65
                }
            }
        return {}

    async def get_courses(self):
        return await self._request("GET", f"/api/courses/{self.api_version}/courses/")

    async def get_course_details(self, course_id: str):
        return await self._request("GET", f"/api/courses/{self.api_version}/courses/{course_id}")

    async def get_user_info(self, username: str):
        return await self._request("GET", f"/api/user/v1/accounts/{username}")

    async def get_user_enrollments(self, username: str):
        return await self._request("GET", f"/api/enrollment/v1/enrollment", params={"user": username})

    async def get_user_progress(self, course_id: str, username: str):
        # Progress metrics
        return await self._request("GET", f"/api/courseware/v1/progress/{course_id}/", params={"user": username})

    async def sync_user_lms_data(self, db, user) -> list:
        lms_username = user.lms_username
        if not lms_username:
            logger.warning(f"User {user.email} has no LMS username linked.")
            return []

        lms_url = "https://iimbx.edu.in" if settings.LMS_URL == "https://iimbx.site" else settings.LMS_URL
        admin_email = "iimbx.support@iimbx.iimb.ac.in" if settings.LMS_ADMIN_EMAIL == "admin@iimbx.iimb.ac.in" else settings.LMS_ADMIN_EMAIL
        admin_password = "Welcome@123" if settings.LMS_ADMIN_PASSWORD == "Drc@1234" else settings.LMS_ADMIN_PASSWORD
        user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

        logger.info(f"LMS Sync: Starting for user {lms_username}")

        # Use an AsyncClient to manage cookie state across redirects/requests
        # We explicitly set verify=False and timeout=3.0 to fail-fast and bypass SSL or slow network routing issues
        async with httpx.AsyncClient(headers={'User-Agent': user_agent}, follow_redirects=True, verify=False, timeout=45.0) as client:
            try:
                # Step A: Get initial cookies from root
                root_res = await client.get(f"{lms_url}/")
                
                # Step B: Get CSRF token from login page
                login_page_res = await client.get(f"{lms_url}/login")
                csrf_token = client.cookies.get("csrftoken")
                logger.info(f"LMS Sync: Got CSRF token from cookies: {csrf_token}")

                # Step C: AJAX Login
                login_headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrf_token or '',
                    'Referer': f"{lms_url}/login"
                }
                login_data = {
                    'email': admin_email,
                    'password': admin_password
                }
                login_res = await client.post(f"{lms_url}/login_ajax", headers=login_headers, data=login_data)
                
                if login_res.status_code != 200:
                    logger.error(f"LMS Sync: Login failed with status {login_res.status_code}")
                    raise Exception(f"LMS Login failed: {login_res.status_code}")

                session_id = client.cookies.get("sessionid")
                final_csrf = client.cookies.get("csrftoken") or csrf_token
                logger.info(f"LMS Sync: Session ID present: {bool(session_id)}")

                if not session_id:
                    raise Exception("Failed to obtain LMS sessionid")

                # Step D: Fetch profile data page-by-page
                all_enrollments = []
                current_page = 1
                total_pages = 1

                while current_page <= total_pages:
                    logger.info(f"LMS Sync: Fetching profile page {current_page} of {total_pages}")
                    profile_url = f"{lms_url}/api/user/learning-profile/{lms_username}/?page={current_page}"
                    
                    profile_headers = {
                        'Accept': 'application/json'
                    }
                    
                    profile_res = await client.get(profile_url, headers=profile_headers)
                    if profile_res.status_code != 200:
                        logger.error(f"LMS Sync: Profile fetch failed on page {current_page}: {profile_res.status_code}")
                        raise ValueError(f"LMS profile fetch failed on page {current_page}")

                    data = profile_res.json()
                    enrollments = data.get("enrollments", [])
                    all_enrollments.extend(enrollments)

                    if current_page == 1 and "pagination" in data:
                        total_pages = data["pagination"].get("total_pages", 1)

                    current_page += 1

                logger.info(f"LMS Sync: Successfully fetched {len(all_enrollments)} enrollments for {lms_username}")

                # Step E: Update LMSDataCache database entries
                from app.db.models.lms_data_cache import LMSDataCache
                from app.db.models.daily_activity import DailyActivity

                # Delete old cache for this user
                db.query(LMSDataCache).filter(LMSDataCache.user_id == user.id).delete()

                # Insert new cache entries
                unique_dates = set()
                for enrollment in all_enrollments:
                    course_id = enrollment.get("course_id")
                    if course_id:
                        cache_entry = LMSDataCache(
                            user_id=user.id,
                            course_id=course_id,
                            data=enrollment
                        )
                        db.add(cache_entry)

                        last_active_at_str = enrollment.get("last_activity_time") or enrollment.get("progress", {}).get("last_activity_at")
                        if last_active_at_str:
                            try:
                                last_active_date = datetime.fromisoformat(last_active_at_str.replace('Z', '+00:00')).date()
                                unique_dates.add(last_active_date)
                            except Exception as e:
                                logger.error(f"Failed to parse last_activity_time during sync: {e}")

                # Save unique daily activity dates in database
                for last_active_date in unique_dates:
                    daily_act = db.query(DailyActivity).filter(
                        DailyActivity.user_id == user.id,
                        DailyActivity.date == last_active_date
                    ).first()
                    
                    # Count how many courses were active on this date
                    count = 0
                    for enrollment in all_enrollments:
                        last_active_at_str = enrollment.get("last_activity_time") or enrollment.get("progress", {}).get("last_activity_at")
                        if last_active_at_str:
                            try:
                                dt = datetime.fromisoformat(last_active_at_str.replace('Z', '+00:00')).date()
                                if dt == last_active_date:
                                    count += 1
                            except:
                                pass
                    count = max(count, 1)

                    if daily_act:
                        daily_act.was_active = True
                        daily_act.courses_accessed = count
                    else:
                        new_act = DailyActivity(
                            user_id=user.id,
                            date=last_active_date,
                            was_active=True,
                            courses_accessed=count
                        )
                        db.add(new_act)

                db.commit()
                return all_enrollments
            except Exception as e:
                import traceback
                error_trace = traceback.format_exc()
                logger.error(f"LMS Sync Error for user {lms_username}: {e}. Detail:\n{error_trace}")
                db.rollback()
                raise ValueError("Poor connection, try again for data population")

    async def get_user_courses_direct(self, username: str) -> list:
        lms_url = "https://iimbx.edu.in" if settings.LMS_URL == "https://iimbx.site" else settings.LMS_URL
        admin_email = "iimbx.support@iimbx.iimb.ac.in" if settings.LMS_ADMIN_EMAIL == "admin@iimbx.iimb.ac.in" else settings.LMS_ADMIN_EMAIL
        admin_password = "Welcome@123" if settings.LMS_ADMIN_PASSWORD == "Drc@1234" else settings.LMS_ADMIN_PASSWORD
        user_agent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

        logger.info(f"LMS Direct Fetch: Starting for user {username}")

        async with httpx.AsyncClient(headers={'User-Agent': user_agent}, follow_redirects=True, verify=False, timeout=45.0) as client:
            # Step A: Get initial cookies from root
            await client.get(f"{lms_url}/")
            
            # Step B: Get CSRF token from login page
            await client.get(f"{lms_url}/login")
            csrf_token = client.cookies.get("csrftoken")

            # Step C: AJAX Login
            login_headers = {
                'Content-Type': 'application/x-www-form-urlencoded',
                'X-CSRFToken': csrf_token or '',
                'Referer': f"{lms_url}/login"
            }
            login_data = {
                'email': admin_email,
                'password': admin_password
            }
            login_res = await client.post(f"{lms_url}/login_ajax", headers=login_headers, data=login_data)
            
            if login_res.status_code != 200:
                raise Exception(f"LMS Login failed: {login_res.status_code}")

            session_id = client.cookies.get("sessionid")
            if not session_id:
                raise Exception("Failed to obtain LMS sessionid")

            # Step D: Fetch profile data page-by-page
            all_enrollments = []
            current_page = 1
            total_pages = 1

            while current_page <= total_pages:
                logger.info(f"LMS Direct Fetch: Fetching profile page {current_page} of {total_pages}")
                profile_url = f"{lms_url}/api/user/learning-profile/{username}/?page={current_page}"
                profile_res = await client.get(profile_url, headers={'Accept': 'application/json'})
                
                if profile_res.status_code == 404 and current_page == 1:
                    raise ValueError(f"Learner '{username}' not found.")
                elif profile_res.status_code != 200:
                    raise Exception(f"LMS Profile fetch failed on page {current_page}: {profile_res.status_code}")

                data = profile_res.json()
                enrollments = data.get("enrollments", [])
                all_enrollments.extend(enrollments)
                
                if current_page == 1 and "pagination" in data:
                    total_pages = data["pagination"].get("total_pages", 1)
                    
                current_page += 1

            return all_enrollments

    async def close(self):
        if self._client:
            await self._client.aclose()

openedx_client = OpenEdxClient()
