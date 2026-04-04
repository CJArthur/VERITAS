from app.settings import SETTINGS

_redis_url = SETTINGS.UPSTASH_REDIS_URL.get_secret_value()
_redis_token = SETTINGS.UPSTASH_REDIS_TOKEN.get_secret_value() if SETTINGS.UPSTASH_REDIS_TOKEN else ""

# Синхронный клиент — используется там где нет async контекста
# Если есть Upstash TOKEN — используем Upstash HTTP SDK, иначе — обычный redis-py
if _redis_token:
    from upstash_redis import Redis
    redis_client = Redis(url=_redis_url, token=_redis_token)
else:
    import redis as _redis
    redis_client = _redis.from_url(_redis_url, decode_responses=True)


async def get_async_redis():
    import redis.asyncio as aioredis

    if _redis_token:
        # Upstash: TLS + password
        return aioredis.from_url(
            _redis_url,
            ssl=True,
            password=_redis_token,
            decode_responses=True,
        )
    else:
        # Обычный Redis (локальный или Railway plugin)
        return aioredis.from_url(_redis_url, decode_responses=True)
