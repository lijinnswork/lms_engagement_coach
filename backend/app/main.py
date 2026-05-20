from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from app.db.base import Base
from .config import settings
from .routers import auth, announcements, courses, goals, coach, reminders, notifications, account, dashboard
from app.scheduler.jobs import setup_scheduler

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
def startup_event():
    setup_scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # adjust this for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(announcements.router)
app.include_router(courses.router)
app.include_router(goals.router)
app.include_router(coach.router)
app.include_router(reminders.router)
app.include_router(notifications.router)
app.include_router(account.router)
app.include_router(dashboard.router)

from app.routers import admin_router, admin_coach_studio
app.include_router(admin_router.router)
app.include_router(admin_coach_studio.router)
@app.get("/")
def read_root():
    return {"message": "Welcome to the Learner Engagement Coach API"}
