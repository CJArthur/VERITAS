from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from backend.app.settings import SETTINGS


app = FastAPI(
    title="BFF Service",
    version="1.0.0",
    swagger_ui_parameters={"persistAuthorization": True},
)

def _cors_origins() -> list[str]:
    raw = (SETTINGS.CORS_ORIGINS or "").strip()
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

@app.get("/health")
async def healthcheck():
    return {"service": "auth", "status": "ok", "database": "connected"}
