from datetime import timedelta
from app.db.redis_setup import redis_client
from app.utils.config import REFRESH_TOKEN_EXPIRE_DAYS

# Добавляет refresh токен в SET пользователя.
def add_refresh_token_to_user_set(user_id: str, refresh_token: str):
    set_key = f"user_refresh_tokens:{user_id}"
    # Добавляем токен в SET
    redis_client.sadd(set_key, refresh_token)
    # Устанавливаем TTL для SET (чтобы он автоматически удалился)
    redis_client.expire(set_key, int(timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()))

# Удаляет refresh токен из SET пользователя.
def remove_refresh_token_from_user_set(user_id: str, refresh_token: str):
    set_key = f"user_refresh_tokens:{user_id}"
    redis_client.srem(set_key, refresh_token)

# Удаляет все refresh токены пользователя используя SET
def delete_all_user_refresh_tokens(user_id: str):
    set_key = f"user_refresh_tokens:{user_id}"
    
    # Получаем все токены из SET
    tokens = redis_client.smembers(set_key)
    
    if tokens:
        # Удаляем каждый refresh_token:{token} ключ
        for token in tokens:
            redis_client.delete(f"refresh_token:{token}")
        
        # Удаляем сам SET
        redis_client.delete(set_key)

