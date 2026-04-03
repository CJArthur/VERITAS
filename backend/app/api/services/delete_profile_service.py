from fastapi import Response, status, HTTPException
from sqlalchemy.orm import Session

from app.api.schemas import DeleteProf
from app.db.models import User
from app.db.redis_setup import redis_client
from app.utils.security import verify_password

def delete_profile(user_data: DeleteProf, response: Response, db: Session, current_user: User):
    
    # 1. Check password
    if not verify_password(user_data.password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid password. Profile deletion requires confirmation."
        )

    # 2. KILL SWITCH: delete tokens
    
    # Get all users tokens
    all_tokens_set_key = f"user_refresh_tokens:{current_user.id}"
    old_tokens_bytes = redis_client.smembers(all_tokens_set_key)
    
    if old_tokens_bytes:
        keys_to_delete = [f"refresh_token:{t}" for t in old_tokens_bytes]
        # delete tokens
        if keys_to_delete:
            redis_client.delete(*keys_to_delete)
    
    # Delete list of user tokens
    redis_client.delete(all_tokens_set_key)

    # 3. Deelete user from db
    db.delete(current_user)
    db.commit()
    
    # 4. Delete cookies
    response.delete_cookie(key="access_token")
    response.delete_cookie(key="refresh_token")
    
    return {"message": "Profile successfully deleted"}
    


    