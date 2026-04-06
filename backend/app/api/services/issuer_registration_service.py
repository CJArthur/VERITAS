import hashlib
import secrets
from typing import Optional

from fastapi import BackgroundTasks, HTTPException, status
from sqlalchemy.orm import Session

from app.api.services.email_service import send_verification_email
from app.db.models import Issuer, IssuerApprovalStatus, IssuerType, User, UserRole
from app.db.redis_setup import redis_client
from app.utils.config import BASE_VERIFICATION_URL, VERIFICATION_URL_EXPIRY_SECONDS
from app.utils.security import generate_verification_token, hash_password
from app.settings import SETTINGS


def register_issuer_account(
    *,
    db: Session,
    user_login: str,
    user_email: str,
    user_password: str,
    issuer_name: str,
    issuer_type: str = "university",
    ogrn: str,
    license_number: str,
    accreditation_number: Optional[str] = None,
    background_tasks: BackgroundTasks,
) -> User:
    if db.query(User).filter(User.email == user_email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    if db.query(User).filter(User.login == user_login).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken",
        )
    if db.query(Issuer).filter(Issuer.ogrn == ogrn).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Organization with this OGRN is already registered",
        )

    # Validate accreditation_number for university type
    resolved_type = IssuerType(issuer_type) if issuer_type in IssuerType._value2member_map_ else IssuerType.university
    if resolved_type == IssuerType.university and not accreditation_number:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="accreditation_number is required for universities",
        )

    api_raw = secrets.token_hex(32)
    issuer = Issuer(
        name=issuer_name,
        ogrn=ogrn,
        license_number=license_number,
        accreditation_number=accreditation_number or None,
        issuer_type=resolved_type,
        api_secret_hash=hashlib.sha256(api_raw.encode()).hexdigest(),
        approval_status=IssuerApprovalStatus.pending,
    )
    db.add(issuer)
    db.flush()

    user = User(
        login=user_login,
        email=user_email,
        hashed_password=hash_password(user_password),
        is_verified=False,
        role=UserRole.university_staff,
        issuer_id=issuer.id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if SETTINGS.SKIP_EMAIL_VERIFICATION:
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
