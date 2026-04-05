"""
OAuth Яндекс: настройте YANDEX_CLIENT_ID / YANDEX_CLIENT_SECRET / YANDEX_REDIRECT_URI в окружении.
Подключите роутер в app.main при готовности приложения в кабинете Яндекса.
"""

import os

import httpx
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.db.models import User
from app.db.postgres import get_db
from app.utils.jwt import create_access_token, create_refresh_token
from app.utils.cookies import set_auth_cookies
from app.utils.refresh_tokens import add_refresh_token_to_user_set
from app.utils.config import REFRESH_TOKEN_EXPIRE_DAYS
from datetime import timedelta
from app.db.redis_setup import redis_client

router = APIRouter(prefix="/auth/yandex", tags=["Yandex OAuth"])

YANDEX_CLIENT_ID = os.getenv("YANDEX_CLIENT_ID", "")
YANDEX_CLIENT_SECRET = os.getenv("YANDEX_CLIENT_SECRET", "")
YANDEX_REDIRECT_URI = os.getenv(
    "YANDEX_REDIRECT_URI",
    "http://127.0.0.1:8200/api/v1/auth/yandex/callback",
)


@router.get("/login")
async def yandex_login():
    if not YANDEX_CLIENT_ID:
        raise HTTPException(
            status_code=503,
            detail="Yandex OAuth is not configured (YANDEX_CLIENT_ID)",
        )
    auth_url = (
        f"https://oauth.yandex.ru/authorize?"
        f"response_type=code&"
        f"client_id={YANDEX_CLIENT_ID}&"
        f"redirect_uri={YANDEX_REDIRECT_URI}"
    )
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def yandex_callback(code: str, db: Session = Depends(get_db)):
    if not code:
        raise HTTPException(status_code=400, detail="Code not provided")
    if not YANDEX_CLIENT_ID or not YANDEX_CLIENT_SECRET:
        raise HTTPException(status_code=503, detail="Yandex OAuth is not configured")

    token_url = "https://oauth.yandex.ru/token"
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "client_id": YANDEX_CLIENT_ID,
        "client_secret": YANDEX_CLIENT_SECRET,
        "redirect_uri": YANDEX_REDIRECT_URI,
    }

    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get token from Yandex")
        token_data = token_response.json()
        yandex_access = token_data.get("access_token")
        info_url = "https://login.yandex.ru/info?format=json"
        headers = {"Authorization": f"OAuth {yandex_access}"}
        info_response = await client.get(info_url, headers=headers)
        yandex_user = info_response.json()

    yandex_id = str(yandex_user.get("id", ""))
    email = yandex_user.get("default_email")
    if not email:
        raise HTTPException(status_code=400, detail="Yandex did not return email")

    user = db.query(User).filter(User.yandex_id == yandex_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.yandex_id = yandex_id
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=400,
                detail="Сначала зарегистрируйтесь по почте, затем войдите через Яндекс "
                "для привязки аккаунта.",
            )

    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id)
    redis_client.set(
        f"refresh_token:{refresh_token}",
        str(user.id),
        ex=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    add_refresh_token_to_user_set(str(user.id), refresh_token)

    resp = RedirectResponse(url=os.getenv("FRONTEND_URL", "http://localhost:3000"))
    set_auth_cookies(resp, access_token, refresh_token)
    return resp
