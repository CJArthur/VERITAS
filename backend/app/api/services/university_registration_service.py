import hashlib
import secrets
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.api.services.email_service import send_verification_email
from app.db.models import University, User, UserRole, UniversityApprovalStatus
from app.db.redis_setup import redis_client
from app.utils.config import BASE_VERIFICATION_URL, VERIFICATION_URL_EXPIRY_SECONDS
from app.utils.security import generate_verification_token, hash_password
from app.settings import SETTINGS


def register_university_account(
    *,
    db: Session,
    user_login: str,
    user_email: str,
    user_password: str,
    university_name: str,
    ogrn: str,
    license_number: str,
    accreditation_number: str,
    background_tasks: BackgroundTasks,
) -> User:
    email_taken: Optional[User] = db.query(User).filter(User.email == user_email).first()
    if email_taken:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    if db.query(User).filter(User.login == user_login).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken",
        )

    if db.query(University).filter(University.ogrn == ogrn).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University with this OGRN is already registered",
        )

    api_raw = secrets.token_hex(32)
    uni = University(
        name=university_name,
        ogrn=ogrn,
        license_number=license_number,
        accreditation_number=accreditation_number,
        api_secret_hash=hashlib.sha256(api_raw.encode()).hexdigest(),
        approval_status=UniversityApprovalStatus.pending,
    )
    db.add(uni)
    db.flush()

    user = User(
        login=user_login,
        email=user_email,
        hashed_password=hash_password(user_password),
        is_verified=False,
        role=UserRole.university_staff,
        university_id=uni.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

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
