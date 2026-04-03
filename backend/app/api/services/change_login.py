from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.db.models import User

from app.api.schemas import SetNewLogin

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