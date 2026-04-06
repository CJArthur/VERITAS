from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.db.models import (
    User,
    Issuer,
    IssuerApprovalStatus,
    UserRole,
)
from app.utils.dependencies import get_current_user


def require_roles(*allowed: UserRole):
    def _dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user
    return _dep


def get_approved_university_staff(
    db: Session = Depends(get_db),
    user: User = Depends(require_roles(UserRole.university_staff)),
) -> tuple[User, Issuer]:
    if not user.issuer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account is not linked to an organization",
        )
    issuer = db.query(Issuer).filter(Issuer.id == user.issuer_id).first()
    if not issuer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if issuer.approval_status != IssuerApprovalStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organization registration is not approved yet",
        )
    return user, issuer


def require_super_admin(user: User = Depends(require_roles(UserRole.super_admin))) -> User:
    return user


def require_student(user: User = Depends(require_roles(UserRole.student))) -> User:
    return user
