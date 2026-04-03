from fastapi import Response

from app.utils.config import SECURE_COOKIES


def set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    # Set tokens in protected HttpOnly cookies

    # 1. Access Token
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        max_age=900,  # 15 minutes
        secure=SECURE_COOKIES,
        samesite="lax"
    )

    # 2. Refresh Token
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,  # 30 days
        secure=SECURE_COOKIES,
        samesite="lax"
    )
