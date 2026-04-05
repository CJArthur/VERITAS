from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.postgres import get_db

from app.api.v1 import router as api_v1_router, edit_data_router
from app.api.auth import router as validate_router
from app.api.admin_routes import router as admin_router
from app.api.university_routes import router as university_router
from app.api.student_routes import router as student_router
from app.api.public_routes import router as public_router
from app.api.employer_routes import router as employer_router
from app.api.services.login_yandex_service import router as yandex_router
from app.settings import SETTINGS

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)

app = FastAPI(title="VERITAS API")

def _cors_origins() -> list[str]:
    raw = (SETTINGS.ALLOWED_ORIGINS or "").strip()
    if not raw:
        return [SETTINGS.FRONTEND_URL]
    return [o.strip() for o in raw.split(",") if o.strip()]


app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include routers --- #
app.include_router(api_v1_router, prefix="/api/v1", tags=["Authentication"])
app.include_router(edit_data_router, prefix="/api/v1", tags=["Edit user data"])
app.include_router(validate_router, tags=["Validate token"])
app.include_router(admin_router, prefix="/api/v1")
app.include_router(university_router, prefix="/api/v1")
app.include_router(student_router, prefix="/api/v1")
app.include_router(public_router, prefix="/api/v1")
app.include_router(employer_router, prefix="/api/v1")
app.include_router(yandex_router, prefix="/api/v1")

# --- Health Check Endpoint --- #
@app.get("/health")
async def healthcheck(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"database": "auth_db",
                "status": "ok",
                "connection": "successful"}
    except Exception:
        return {"status": "degraded", "database": "error"}
    
    
# --- Root Endpoint --- #
@app.get("/")
async def root():
    return {
        "service": "veritas-backend",
        "status": "running",
    }




