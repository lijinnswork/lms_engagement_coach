import json
import random
import uuid
from datetime import datetime, timedelta
import os

# Constants
COURSE_THEMES = ["#7B9EA8", "#E8A87C", "#B4C7B8", "#D9A0A0", "#9B88ED", "#E2C07D", "#82B0D4", "#C6A477", "#A5D6A7", "#FFCC80"]
COURSE_ICONS = ["code", "grid", "monitor", "book", "database", "cpu", "globe", "terminal", "activity", "layers"]

# Generate Courses
courses = []
for i in range(1, 11):
    courses.append({
        "course_id": f"course-v1:edX+C{i}00+2026_T1",
        "name": f"Dummy Course {i}",
        "description": f"Description for Dummy Course {i}. Learn the fundamentals of this topic.",
        "enrollment_mode": random.choice(["honor", "verified", "audit"]),
        "start_date": "2026-01-15T00:00:00Z",
        "end_date": "2026-06-30T00:00:00Z",
        "metadata": {
            "color_theme": COURSE_THEMES[i - 1],
            "icon_type": COURSE_ICONS[i - 1],
            "total_components": random.randint(50, 200)
        }
    })

# Generate Users and Data
users_data = []
first_names = ["Vishal", "Priya", "Lijin", "Amit", "Sneha", "Kiran", "Aditi", "Rahul", "Neha", "Arjun", 
               "Maya", "Ravi", "Kavya", "Vikram", "Anjali", "Suresh", "Divya", "Karan", "Pooja", "Rohan"]

last_names = ["Sharma", "Patel", "Reddy", "Singh", "Kumar", "Iyer", "Nair", "Das", "Rao", "Gupta", "Desai", "Jain", "Menon", "Pillai", "Bose"]

for i in range(20):
    user_id = f"usr_{uuid.uuid4().hex[:12]}"
    first_name = first_names[i]
    last_name = random.choice(last_names)
    full_name = f"{first_name} {last_name}"
    email = f"{first_name.lower()}.{last_name.lower()}@example.com"
    avatar_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={first_name}{last_name}"
    
    # Enroll user in 2 to 4 courses
    enrolled_courses = random.sample(courses, random.randint(2, 4))
    
    progress_data = []
    goals_data = []
    interventions_data = []
    
    for course in enrolled_courses:
        total_comp = course["metadata"]["total_components"]
        completed = random.randint(0, total_comp)
        progress_pct = round((completed / total_comp) * 100, 2)
        
        progress_data.append({
            "course_id": course["course_id"],
            "total_components": total_comp,
            "completed_components": completed,
            "progress_percentage": progress_pct,
            "engagement_score": round(random.uniform(0.1, 1.0), 2),
            "last_active_at": (datetime.utcnow() - timedelta(days=random.randint(0, 14))).isoformat() + "Z"
        })
        
        # Add 1-2 goals per course
        for _ in range(random.randint(1, 2)):
            is_completed = random.choice([True, False])
            goals_data.append({
                "goal_id": f"gl_{uuid.uuid4().hex[:8]}",
                "course_id": course["course_id"],
                "title": f"Complete module {random.randint(1, 10)} in {course['name']}",
                "context_meta": f"{course['name']} · {'completed' if is_completed else 'active'}",
                "status": "completed" if is_completed else random.choice(["active", "proposed"]),
                "is_completed": is_completed,
                "proposed_by": random.choice(["student", "coach"]),
                "created_at": (datetime.utcnow() - timedelta(days=random.randint(5, 30))).isoformat() + "Z",
                "deadline": (datetime.utcnow() + timedelta(days=random.randint(-5, 15))).isoformat() + "Z" if not is_completed else None
            })
            
        # Add random intervention
        if random.choice([True, False]):
            interventions_data.append({
                "intervention_id": f"int_{uuid.uuid4().hex[:8]}",
                "type": random.choice(["encouragement", "nudge", "warning"]),
                "trigger_reason": random.choice(["momentum", "falling_behind", "inactivity"]),
                "message": f"Hey {first_name}, I noticed your recent activity in {course['name']}. Keep it up!",
                "related_course_id": course["course_id"]
            })
            
    # Rhythm Data
    rhythm_data = []
    base_date = datetime.utcnow() - timedelta(days=7)
    for d in range(7):
        current_date = base_date + timedelta(days=d)
        is_active = random.choice([True, False])
        rhythm_data.append({
            "day": current_date.strftime("%a"),
            "date": current_date.strftime("%Y-%m-%d"),
            "active": is_active,
            "intensity_score": round(random.uniform(0.1, 1.0), 2) if is_active else 0.0,
            "hours_spent": round(random.uniform(0.5, 4.0), 1) if is_active else 0.0
        })
        
    users_data.append({
        "user_id": user_id,
        "first_name": first_name,
        "last_name": last_name,
        "full_name": full_name,
        "email": email,
        "role": "student",
        "avatar_url": avatar_url,
        "enrollments": [c["course_id"] for c in enrolled_courses],
        "progress": progress_data,
        "rhythm": rhythm_data,
        "goals": goals_data,
        "interventions": interventions_data
    })

# Final Output
output = {
    "courses": courses,
    "users": users_data
}

artifact_path = '/Users/vishalcreddy/.gemini/antigravity/brain/9b19fae8-5e62-467e-964e-02fed29fcbe6/lms_dummy_data_large.json'
with open(artifact_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"Data successfully generated at {artifact_path}")
