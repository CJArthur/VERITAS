from os import environ
from dotenv import load_dotenv
from pydantic import BaseModel, SecretStr

class Settings(BaseModel):
    CORS_ORIGINS: str
    FRONTEND_URL: str = "http://localhost:3000"
    POSTGRES_URL: SecretStr
    REDIS_URL: SecretStr

SETTINGS = Settings(**environ)