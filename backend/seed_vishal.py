import sys
import os
sys.path.append(os.getcwd())

from app.database import SessionLocal
from app.db.models.user import User
import bcrypt

try:
    db = SessionLocal()
    email = "vishal.reddy@iimbx.iimb.ac.in"
    
    # Hash password correctly
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(b"Welcome@789", salt).decode("utf-8")
    
    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            password_hash=hashed,
            full_name="Vishal Reddy",
            role="super_admin"
        )
        db.add(user)
        print("Created new user")
    else:
        user.password_hash = hashed
        user.role = "super_admin"
        print("Updated existing user")
    db.commit()
    print("Success")
except Exception as e:
    print("Error:", e)
finally:
    db.close()
