from fastapi import Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import timedelta

from app.db.redis_setup import redis_client
from app.db.models import User
from app.utils.jwt import create_refresh_token, create_access_token
from app.utils.refresh_tokens import add_refresh_token_to_user_set
from app.utils.config import REFRESH_TOKEN_EXPIRE_DAYS, FRONTEND_URL


def verify_user_email(response: Response, token: str, db: Session):
    # 1. Проверяем токен в Redis
    user_id_str = redis_client.get(f"verification:{token}")
    if not user_id_str:
        # Если ссылка протухла — редирект на страницу ошибки
        return RedirectResponse("http://localhost:3000/error?msg=expired")

    # 2. Активируем пользователя
    user_id = UUID(user_id_str)
    db_user = db.query(User).filter(User.id == user_id).first()
    if not db_user:
         return RedirectResponse("http://localhost:3000/error?msg=user_not_found")

    if not db_user.is_verified:
        db_user.is_verified = True
        db.commit()

    # 3. УДАЛЯЕМ токен верификации из Redis (чтобы ссылка была одноразовой)
    redis_client.delete(f"verification:{token}")

    # 4. ГЕНЕРИРУЕМ ТОКЕНЫ АВТОРИЗАЦИИ (Auto-Login)
    access_token = create_access_token(subject=db_user.id, role=db_user.role.value)
    refresh_token = create_refresh_token(subject=db_user.id)

    # Сохраняем refresh token в Redis (для сессий)
    redis_client.set(
        f"refresh_token:{refresh_token}", 
        str(db_user.id), 
        ex=timedelta(days = REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()
    )
    # Добавляем токен в SET пользователя
    add_refresh_token_to_user_set(str(db_user.id), refresh_token)

    # 5. СОЗДАЕМ РЕДИРЕКТ С УСТАНОВКОЙ КУК
    redirect_resp = RedirectResponse(url=FRONTEND_URL, status_code=status.HTTP_302_FOUND)
    
    # Устанавливаем Access Token в куки
    redirect_resp.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,  # JavaScript не может прочитать (защита от XSS)
        max_age=900,    # 15 минут
        samesite="lax", # Важно для редиректов
        secure=False    # True, если HTTPS 
    )
    
    # Устанавливаем Refresh Token в куки (опционально, если нужно авто-обновление)
    redirect_resp.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        max_age=30 * 24 * 60 * 60,
        samesite="lax",
        secure=False
    )

    return redirect_resp