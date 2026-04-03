from app.settings import SETTINGS
from upstash_redis import Redis
import redis.asyncio as aioredis


redis_client = Redis(
    url = SETTINGS.UPSTASH_REDIS_URL.get_secret_value(),
    token = SETTINGS.UPSTASH_REDIS_TOKEN.get_secret_value(),
)

async def get_async_redis():
    return aioredis.from_url(
        SETTINGS.UPSTASH_REDIS_URL.get_secret_value(),
        ssl=True, 
        password=SETTINGS.UPSTASH_REDIS_TOKEN.get_secret_value(),
        decode_responses=True
    )