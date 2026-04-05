from pydantic import SecretStr, Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from fastapi_mail import ConnectionConfig

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore"
    )

    FASTAPI_PORT: int = 8200

    # --- PostgreSQL Database configuration --- #
    # db - for docker, localhost - for local start
    DB_HOST: str 
    DB_PORT: int 
    DB_USER: str 
    DB_PASSWORD: SecretStr 
    DB_NAME: str

    # Необязательно: подключение собирается из DB_* (см. app.db.postgres).
    POSTGRES_URL: SecretStr | None = None

    # --- Redis Database configuration --- #
    UPSTASH_REDIS_URL: SecretStr
    UPSTASH_REDIS_TOKEN: SecretStr | None = None

    # --- Mail Verification Configuration --- #
    #! Port: 587 - for TLS, 465 - for SSL(Recommend use TLS)

    MAIL_USERNAME: str
    MAIL_PASSWORD: SecretStr
    MAIL_FROM: str
    MAIL_PORT: int
    MAIL_SERVER: str
    MAIL_FROM_NAME: str
    MAIL_TLS: bool
    MAIL_SSL: bool

    # --- Token`s time life
    VERIFICATION_URL_EXPIRY_SECONDS: int = 1800 # Code active 30 min
    FORGOT_PASSWORD_URL_EXPIRY_SECONDS: int = 1800 # code active 30 min

    #False - dev(http), True - prod(https)
    SECURE_COOKIES: bool
    BASE_VERIFICATION_URL: str
    FRONTEND_URL: str
    # URL for drop password by email
    FORGOT_PASSWORD_FRONTEND_URL: str = "http://localhost:8000/api/v1/reset-pass"

    # --- Access/Refresh Tokens --- #
    # Use command line: "openssl rand -hex 32" to generate a your secret key
    SECRET_KEY: SecretStr 
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30

    # --- Domen`s with access --- #
    ALLOWED_ORIGINS: str



SETTINGS = Settings()