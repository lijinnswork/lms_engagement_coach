import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.db.models.user import User

def main():
    if len(sys.argv) < 3:
        print("Usage: python promote_user.py <email> <role>")
        print("Available roles: super_admin, support_staff, student")
        print("Example: python promote_user.py student@test.com super_admin")
        return

    email = sys.argv[1].strip().lower()
    target_role = sys.argv[2].strip()

    valid_roles = ["super_admin", "support_staff", "student"]
    if target_role not in valid_roles:
        print(f"Error: Invalid role. Must be one of: {', '.join(valid_roles)}")
        return

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            print(f"Error: User with email '{email}' not found in the database.")
            return

        old_role = user.role
        user.role = target_role
        db.commit()
        print(f"🎉 Success! Updated {email}:")
        print(f"   Old Role: '{old_role}'")
        print(f"   New Role: '{target_role}'")
    except Exception as e:
        print("Database error:", e)
    finally:
        db.close()

if __name__ == "__main__":
    main()
