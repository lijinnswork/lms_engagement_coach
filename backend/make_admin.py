import sqlite3
import sys
import os

def elevate_user(email, role):
    db_path = os.path.join(os.path.dirname(__file__), "test.db")
    if not os.path.exists(db_path):
        print(f"Error: Database not found at {db_path}")
        sys.exit(1)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    cursor.execute("SELECT id, email, role FROM users WHERE email = ? COLLATE NOCASE", (email,))
    user = cursor.fetchone()

    if not user:
        print(f"User with email {email} not found.")
        sys.exit(1)

    cursor.execute("UPDATE users SET role = ? WHERE email = ? COLLATE NOCASE", (role, email))
    conn.commit()

    print(f"Success! Elevated {email} from '{user[2]}' to '{role}'.")
    conn.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python make_admin.py <email> [role]")
        sys.exit(1)
        
    email = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else "super_admin"
    elevate_user(email, role)
