from dotenv import load_dotenv
import os

load_dotenv()
# --- Tokens --- #
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))
VERIFICATION_URL_EXPIRY_SECONDS = int(os.getenv("VERIFICATION_URL_EXPIRY_SECONDS"))


# --- Url`s for verification
FRONTEND_URL = os.getenv("FRONTEND_URL")
BASE_VERIFICATION_URL=os.getenv("BASE_VERIFICATION_URL")

# --- Url`s for drop password
FORGOT_PASSWORD_URL_EXPIRY_SECONDS = int(os.getenv("FORGOT_PASSWORD_URL_EXPIRY_SECONDS"))
BASE_FORGOT_PASSWORD_URL = os.getenv("BASE_FORGOT_PASSWORD_URL")
FORGOT_PASSWORD_FRONTEND_URL = os.getenv("FORGOT_PASSWORD_FRONTEND_URL")

# --- Cookies --- #
SECURE_COOKIES = os.getenv("SECURE_COOKIES", "False").lower() == "true"

# --- Proxy to projects
PROJECTS_SERVICE_URL = os.getenv("PROJECTS_SERVICE_URL")

# --- CORS --- #
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# --- Public diploma / QR (URL для работодателя) --- #
_frontend = os.getenv("FRONTEND_URL", "http://localhost:3000")
PUBLIC_DIPLOMA_URL_BASE = f"{_frontend.rstrip('/')}/v"

# --- Первый суперадмин по email (один раз при пустой таблице super_admin) --- #
BOOTSTRAP_SUPER_ADMIN_EMAIL = os.getenv("BOOTSTRAP_SUPER_ADMIN_EMAIL", "")