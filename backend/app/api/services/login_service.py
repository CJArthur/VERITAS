from fastapi import Response, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta

from app.api.schemas import UserLogin, SetNewLogin
from app.db.models import User, UserRole, University, UniversityApprovalStatus
from app.db.redis_setup import redis_client
from app.utils.security import verify_password
from app.utils.jwt import create_refresh_token, create_access_token
from app.utils.cookies import set_auth_cookies
from app.utils.refresh_tokens import add_refresh_token_to_user_set
from app.utils.config import REFRESH_TOKEN_EXPIRE_DAYS

# --- Login user --- #
def login_user(user_data: UserLogin, response: Response, db: Session):
# 1. Check user
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user or not verify_password(user_data.password, user.hashed_password):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if not user.is_verified:
        raise HTTPException(status_code=400, detail="Email not verified")

    if user.role == UserRole.university_staff and user.university_id:
        uni = db.query(University).filter(University.id == user.university_id).first()
        if not uni or uni.approval_status != UniversityApprovalStatus.approved:
            raise HTTPException(
                status_code=403,
                detail="University application is pending approval or was rejected",
            )

    # 2. Generate tokens
    access_token = create_access_token(subject=user.id, role=user.role.value)
    refresh_token = create_refresh_token(subject=user.id)

    # 3. Redis (Session storage)
    redis_client.set(
        f"refresh_token:{refresh_token}",
        str(user.id),
        ex=timedelta(days = REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()
    )
    
    # Добавляем токен в SET пользователя
    add_refresh_token_to_user_set(str(user.id), refresh_token)

    # 4. Set cookie
    set_auth_cookies(response, access_token, refresh_token)

    return user

# --- Set new login --- #
def set_new_login(user_data: SetNewLogin, db: Session, current_user: User):
    existing = db.query(User).filter(
        User.login == user_data.new_login,
        User.id != current_user.id,
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Login already taken",
        )

    current_user.login = user_data.new_login
    db.commit()
    db.refresh(current_user)

    return current_user