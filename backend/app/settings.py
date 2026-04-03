from pydantic import SecretStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

    CORS_ORIGINS: str = "*"
    FRONTEND_URL: str = "http://localhost:3000"
    
    POSTGRES_URL: SecretStr
    REDIS_URL: SecretStr

SETTINGS = Settings()