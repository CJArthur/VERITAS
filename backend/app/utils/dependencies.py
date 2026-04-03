from fastapi import Depends, HTTPException, status, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from uuid import UUID

from app.db.postgres import get_db
from app.db.models import User
from app.db.redis_setup import redis_client 
from app.utils.config import SECRET_KEY, ALGORITHM

# --- Вспомогательная функция: достает токен отовсюду ---
def get_token_from_request(request: Request) -> str:
    # 1. Сначала ищем в Куках (для браузера)
    token = request.cookies.get("access_token")
    if token:
        return token

    # 2. Если кук нет, ищем в Заголовке
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:]
    
    # Если токена нет нигде
    return None

# --- Основная зависимость ---
def get_current_user(
    request: Request, 
    db: Session = Depends(get_db)
) -> User:
    
    # Исключение, которое мы будем кидать при любой ошибке
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    # 1. Достаем токен (нашей функцией выше)
    token = get_token_from_request(request)
    if not token:
        raise credentials_exception

    # 2. ПРОВЕРКА BLACKLIST
    # Если токен в бане — не пускаем
    if redis_client.get(f"blacklist:{token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revoked (logged out)",
        )

    try:
        # 3. Декодируем JWT
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        
        if user_id_str is None:
            raise credentials_exception
        
        # Конвертируем строку в UUID
        user_id = UUID(user_id_str)

    except JWTError:
        raise credentials_exception
    
    # 4. Ищем юзера в БД
    user = db.query(User).filter(User.id == user_id).first()
    
    if user is None:
        raise credentials_exception
        
    return user


def validate_token_string(token: str, db: Session) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is empty",
        )

    # Проверка blacklist
    if redis_client.get(f"blacklist:{token}"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token revoked (logged out)",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload",
            )
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user