from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine
from app.db.base import Base
from .config import settings
from .routers import auth, announcements, courses, goals, coach, reminders, notifications, account, dashboard, nudges
from app.scheduler.jobs import setup_scheduler

Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

@app.on_event("startup")
def startup_event():
    setup_scheduler()
    
    # Auto-promote administrators on database startup
    try:
        from app.database import SessionLocal
        from app.db.models.user import User
        db = SessionLocal()
        emails_to_promote = ["lijin@gmail.com", "lijin.ns@iimbx.iimb.ac.in", "vishal.reddy@iimbx.iimb.ac.in", "iimbx.tools@iimbx.iimb.ac.in"]
        for email in emails_to_promote:
            user = db.query(User).filter(User.email == email.strip().lower()).first()
            if user and user.role != "super_admin":
                user.role = "super_admin"
                db.commit()
                print(f"Auto-promoted {email} to super_admin on startup.")
        db.close()
    except Exception as e:
        print("Error promoting admins on startup:", e)


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
app.include_router(nudges.router)

from app.routers import admin_router, admin_coach_studio, admin_course_stats
app.include_router(admin_router.router)
app.include_router(admin_coach_studio.router)
app.include_router(admin_course_stats.router)
@app.get("/")
def read_root():
    return {"message": "Welcome to the Student Dashboard Coach API"}
