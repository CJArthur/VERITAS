from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.orm import sessionmaker

from app.settings import SETTINGS


def postgres_url() -> URL:
    """DSN из DB_* — надёжнее, чем одна строка POSTGRES_URL в .env (кодировки Windows)."""
    return URL.create(
        drivername="postgresql+psycopg2",
        username=SETTINGS.DB_USER,
        password=SETTINGS.DB_PASSWORD.get_secret_value(),
        host=SETTINGS.DB_HOST,
        port=SETTINGS.DB_PORT,
        database=SETTINGS.DB_NAME,
    )


engine = create_engine(
    postgres_url(),
    connect_args={"client_encoding": "utf8"},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()