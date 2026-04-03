import redis.asyncio as aioredis
from redis.asyncio.client import Redis
from app.settings import SETTINGS


def get_async_redis():
    return aioredis.from_url(
        SETTINGS.REDIS_URL.get_secret_value(),
        decode_responses=True,
    )
