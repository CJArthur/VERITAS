from fastapi import Request, Response, HTTPException, status
from datetime import timedelta
from uuid import UUID

from sqlalchemy.orm import Session
from app.db.redis_setup import redis_client
from app.db.models import User
from app.utils.jwt import create_refresh_token, create_access_token
from app.utils.cookies import set_auth_cookies
from app.utils.refresh_tokens import add_refresh_token_to_user_set, remove_refresh_token_from_user_set
from app.utils.config import REFRESH_TOKEN_EXPIRE_DAYS


def make_update_refresh_token(request: Request, response: Response, db: Session):

    # 1. Get Refresh token from cookie
    old_refresh_token = request.cookies.get("refresh_token")

    if not old_refresh_token:
        raise HTTPException(status_code=401, detail="Refresh token missing")
    
    # 2. Check session valid in Redis
    user_id_raw = redis_client.get(f"refresh_token:{old_refresh_token}")
    if not user_id_raw:
        raise HTTPException(status_code=401, detail="Token expired or invalid")

    user_id_str = (
        user_id_raw.decode("utf-8")
        if isinstance(user_id_raw, (bytes, bytearray))
        else str(user_id_raw)
    )

    # 3. Check user in db
    user = db.query(User).filter(User.id == UUID(user_id_str)).first()
    if not user:
         raise HTTPException(status_code = 404, detail = "User associated with token not found")

    # 4. --- Make Rotation ---
    # Delete old refresh token
    redis_client.delete(f"refresh_token:{old_refresh_token}")
    # Удаляем из SET пользователя
    remove_refresh_token_from_user_set(user_id_str, old_refresh_token)

    # Generate new Tokens
    new_refresh_token = create_refresh_token(subject=user.id)
    new_access_token = create_access_token(subject=user.id, role=user.role.value)

    # Save new Refresh token
    redis_client.set(
        f"refresh_token:{new_refresh_token}",
        user_id_str,
        ex=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )
    # Добавляем новый токен в SET пользователя
    add_refresh_token_to_user_set(user_id_str, new_refresh_token)

    # --- End of Rotation

    # 5. Set new Cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)

    return Response(status_code = status.HTTP_200_OK)