import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.db.models.user import User
import bcrypt

try:
    db = SessionLocal()
    email = "iimbx.tools@iimbx.iimb.ac.in"
    password = "Welcome@123"
    
    # Hash password correctly
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=hashed,
            full_name="IIMBx Tools Admin",
            role="super_admin"
        )
        db.add(user)
        print("Created new user successfully.")
    else:
        user.password_hash = hashed
        user.role = "super_admin"
        print("Updated existing user successfully.")
    db.commit()
    print("Seeding transaction committed successfully.")
except Exception as e:
    print("Error during seeding:", e)
finally:
    db.close()
