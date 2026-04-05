from sqlalchemy.orm import Session
from fastapi import BackgroundTasks, HTTPException, status
from typing import Optional

from app.db.models import User, UserRole
from app.db.redis_setup import redis_client
from app.api.services.email_service import send_verification_email
from app.utils.security import generate_verification_token, hash_password
from app.utils.config import (
    VERIFICATION_URL_EXPIRY_SECONDS,
    BASE_VERIFICATION_URL,
    BOOTSTRAP_SUPER_ADMIN_EMAIL,
)
from app.settings import SETTINGS

def registr_user(user_login: str, user_email: str, user_password: str,
                 background_tasks: BackgroundTasks, db: Session):
    
    # 1. Проверяем, существует ли пользователь по Email
    user: Optional[User] = db.query(User).filter(User.email == user_email).first()

    # 2. Сценарий: Пользователь уже существует
    if user:
        if user.is_verified:
            # 2.1 Если верифицирован: Ошибка, занято.
            raise HTTPException (
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered and verified."
            )

        # 2.2 Если НЕ верифицирован: Обновляем данные и отправляем заново.
        
        # Проверка уникальности логина/username (если он изменился)
        if user_login != user.login:
            if db.query(User).filter(User.login == user_login).first():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Username is already taken by another user."
                )

        # Обновляем пароль и логин
        user.hashed_password = hash_password(user_password)
        user.login = user_login
        
        db.commit()
        db.refresh(user)
        
    # 3. Сценарий: Пользователь не существует (Создаем)
    else:
        # Проверка уникальности логина/username для нового пользователя
        if db.query(User).filter(User.login == user_login).first():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Username is already taken by another user."
            )

        role = UserRole.student
        if (
            BOOTSTRAP_SUPER_ADMIN_EMAIL
            and user_email.lower() == BOOTSTRAP_SUPER_ADMIN_EMAIL.lower()
            and not db.query(User).filter(User.role == UserRole.super_admin).first()
        ):
            role = UserRole.super_admin

        user = User(
            login=user_login,
            email=user_email,
            hashed_password=hash_password(user_password),
            is_verified=False,
            role=role,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # 4. Верификация email
    if SETTINGS.SKIP_EMAIL_VERIFICATION:
        # Режим без SMTP: верифицируем сразу, письмо не отправляем
        user.is_verified = True
        db.commit()
        db.refresh(user)
    else:
        verification_token = generate_verification_token()
        redis_client.set(
            f"verification:{verification_token}",
            str(user.id),
            ex=VERIFICATION_URL_EXPIRY_SECONDS,
        )
        verification_link = f"{BASE_VERIFICATION_URL}?token={verification_token}"
        background_tasks.add_task(send_verification_email, user.email, verification_link)

    return user