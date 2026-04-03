from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.settings import SETTINGS

engine = create_engine(SETTINGS.POSTGRES_URL)
SessionLocal = sessionmaker(autocommit = False, autoflush = False, bind = engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()