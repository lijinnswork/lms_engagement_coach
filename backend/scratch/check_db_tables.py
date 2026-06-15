from app.database import engine
from sqlalchemy import inspect
insp = inspect(engine)
print("Tables in test.db:", insp.get_table_names())
