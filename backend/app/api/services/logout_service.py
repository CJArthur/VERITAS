from fastapi import Response, status
from datetime import datetime
from jose import jwt, JWTError

from app.db.redis_setup import redis_client
from app.utils.config import SECRET_KEY, ALGORITHM
from app.utils.refresh_tokens import remove_refresh_token_from_user_set


def logout_user(access_token_bearer, refresh_token, response: Response):    
    # 1. Cancel Refresh
    if refresh_token:
        # Получаем user_id из токена перед удалением
        user_id = redis_client.get(f"refresh_token:{refresh_token}")
        redis_client.delete(f"refresh_token:{refresh_token}")
        # Удаляем из SET пользователя, если user_id найден
        if user_id:
            remove_refresh_token_from_user_set(user_id, refresh_token)

    # 3. Cansel Access
    if access_token_bearer and access_token_bearer.startswith("Bearer "):
        access_token = access_token_bearer.split(" ")[1]
         
        try:
              # Get live time of token
              payload = jwt.decode(access_token, SECRET_KEY, algorithms = [ALGORITHM])
              exp_timestamp = payload.get("exp")

              # Calculate remaining live time
              if exp_timestamp:
                   expiration_time = datetime.fromtimestamp(exp_timestamp)
                   remaining_seconds = int((expiration_time - datetime.utcnow()).total_seconds())


                   if remaining_seconds > 0:
                        # Add Access token in BlackList Redis
                        redis_client.set(
                             f"blacklist:{access_token}",
                             "1",
                             ex=remaining_seconds
                        )
        except JWTError:
              # Ignore error if token not valid or expired
              pass

    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")

    return Response(status_code = status.HTTP_204_NO_CONTENT)