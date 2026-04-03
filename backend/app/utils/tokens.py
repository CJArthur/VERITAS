from datetime import datetime, timedelta
from typing import Union, Any

from jose import jwt
from redis.asyncio import Redis

from app.settings import SETTINGS


def create_access_token(subject: Union[str, Any]) -> str:
    # Create short-lived Access token (store User UUID)
    expire = datetime.utcnow() + timedelta(minutes=SETTINGS.ACCESS_TOKEN_EXPIRE_MINUTES)

    # Convert UUID in str, because JSON dont save UUID
    to_encode = {"exp": expire, "sub": str(subject), "type": "access"}
    encoded_jwt = jwt.encode(
        to_encode, SETTINGS.SECRET_KEY.get_secret_value(), algorithm=SETTINGS.ALGORITHM
    )

    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    # Create long-live Refresh token
    expire = datetime.utcnow() + timedelta(days=SETTINGS.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encode_jwt = jwt.encode(
        to_encode, SETTINGS.SECRET_KEY.get_secret_value(), algorithm=SETTINGS.ALGORITHM
    )

    return encode_jwt


# Добавляет refresh токен в SET пользователя.
async def add_refresh_token_to_user_set(
    user_id: str,
    refresh_token: str,
    redis_client: Redis,
):
    set_key = f"user_refresh_tokens:{user_id}"
    # Добавляем токен в SET
    await redis_client.sadd(set_key, refresh_token)
    # Устанавливаем TTL для SET (чтобы он автоматически удалился)
    await redis_client.expire(
        set_key, timedelta(days=SETTINGS.REFRESH_TOKEN_EXPIRE_DAYS)
    )


# Удаляет refresh токен из SET пользователя.
async def remove_refresh_token_from_user_set(
    user_id: str,
    refresh_token: str,
    redis_client: Redis,
):
    set_key = f"user_refresh_tokens:{user_id}"
    await redis_client.srem(set_key, refresh_token)


# Удаляет все refresh токены пользователя используя SET
async def delete_all_user_refresh_tokens(
    user_id: str,
    redis_client: Redis,
):
    set_key = f"user_refresh_tokens:{user_id}"

    # Получаем все токены из SET
    tokens = await redis_client.smembers(set_key)

    if tokens:
        # Удаляем каждый refresh_token:{token} ключ
        for token in tokens:
            await redis_client.delete(f"refresh_token:{token}")

        # Удаляем сам SET
        await redis_client.delete(set_key)
