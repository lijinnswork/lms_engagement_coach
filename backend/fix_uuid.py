import os
import glob

models_dir = "/Users/vishalcreddy/Documents/AI Coach/backend/app/db/models"
for file_path in glob.glob(f"{models_dir}/*.py"):
    with open(file_path, "r") as f:
        content = f.read()
    
    new_content = content.replace(
        "from sqlalchemy.dialects.postgresql import UUID",
        "from sqlalchemy.types import Uuid as UUID"
    )
    
    if new_content != content:
        with open(file_path, "w") as f:
            f.write(new_content)
        print(f"Updated {file_path}")

print("Done updating models.")
