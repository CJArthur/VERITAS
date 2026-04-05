from fastapi import Response

from app.utils.config import SECURE_COOKIES, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    # Set tokens in protected HttpOnly cookies

    # 1. Access Token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        secure=SECURE_COOKIES,
        samesite="none" if SECURE_COOKIES else "lax"
    )

    # 2. Refresh Token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        secure=SECURE_COOKIES,
        samesite="none" if SECURE_COOKIES else "lax"
    )
