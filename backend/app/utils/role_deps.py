from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.db.models import (
    User,
    University,
    UniversityApprovalStatus,
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
) -> tuple[User, University]:
    if not user.university_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="University account is not linked to an organization",
        )
    uni = db.query(University).filter(University.id == user.university_id).first()
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="University not found")
    if uni.approval_status != UniversityApprovalStatus.approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="University registration is not approved",
        )
    return user, uni


def require_super_admin(user: User = Depends(require_roles(UserRole.super_admin))) -> User:
    return user


def require_student(user: User = Depends(require_roles(UserRole.student))) -> User:
    return user
