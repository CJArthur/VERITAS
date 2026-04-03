from datetime import datetime, timedelta
from typing import Union, Any
from jose import jwt

from app.utils.config import (SECRET_KEY, ALGORITHM,
                              ACCESS_TOKEN_EXPIRE_MINUTES,
                              REFRESH_TOKEN_EXPIRE_DAYS)

def create_access_token(
    subject: Union[str, Any],
    *,
    role: str | None = None,
) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: dict = {"exp": expire, "sub": str(subject), "type": "access"}
    if role is not None:
        to_encode["role"] = role
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt


def create_refresh_token(subject: Union[str, Any]) -> str:
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode = {"exp": expire, "sub": str(subject), "type": "refresh"}
    encode_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encode_jwt
