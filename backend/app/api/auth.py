from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session

from app.api.schemas import TokenValidatioRequest
from app.utils.dependencies import validate_token_string
from app.db.models import User
from app.db.postgres import get_db

router = APIRouter()

@router.post("/validate")
def validate_token(request: TokenValidatioRequest, db: Session = Depends(get_db)):
    try:
        user = validate_token_string(request.token, db)
        return {
            "valid": True,
            "user_id": str(user.id),
            "email": user.email,
            "role": user.role.value,
        }
    
    except Exception:
        raise HTTPException(status_code = status.HTTP_401_UNAUTHORIZED,
                            detail = "Invalid token")
    
