from fastapi import HTTPException, status, BackgroundTasks, Response
from sqlalchemy.orm import Session
from datetime import timedelta
from uuid import UUID

from app.api.services.email_service import send_forgot_password_email
from app.api.schemas import ResetPassword, ForgotPassword, VerifyPass
from app.db.models import User
from app.db.redis_setup import redis_client

from app.utils.cookies import set_auth_cookies
from app.utils.security import verify_password, hash_password, generate_verification_token
from app.utils.jwt import create_refresh_token, create_access_token
from app.utils.refresh_tokens import delete_all_user_refresh_tokens, add_refresh_token_to_user_set
from app.utils.config import (FORGOT_PASSWORD_URL_EXPIRY_SECONDS,
                              FORGOT_PASSWORD_FRONTEND_URL,
                              REFRESH_TOKEN_EXPIRE_DAYS)

#  catch error
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)


# --- Reset password in account --- #
def reset_password_in_account(user_data: ResetPassword, current_user: User, db: Session):
    user = db.query(User).filter(User.id == current_user.id).first()

    # Catch errors
    if not verify_password(user_data.old_pass, current_user.hashed_password):
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = "Old password incorrect")
    
    if user_data.new_pass != user_data.confirm_new_pass:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = "Passwords don`t match")

    # If all okey  
    current_user.hashed_password = hash_password(user_data.confirm_new_pass)
    db.commit()
    db.refresh(user)

    return user


# --- Reset password before login --- #
def forgot_password_by_email(user_data: ForgotPassword, background_tasks:BackgroundTasks,
                             db: Session):
    
    user = db.query(User).filter(User.email == user_data.email).first()

    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                      detail = "User not found")
        
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                      detail = "User exist, but unauthorized")

    # Send email for drop password
    reset_pass_token = generate_verification_token()

    redis_client.set(
        f"reset_pass:{reset_pass_token}",
        str(user.id),
        ex = FORGOT_PASSWORD_URL_EXPIRY_SECONDS
    )

    verification_link = f"{FORGOT_PASSWORD_FRONTEND_URL}?token={reset_pass_token}&login={user.login}"

    background_tasks.add_task(send_forgot_password_email, user.email, verification_link)

    return user

# Reset password after send email
def reset_password(user_data: VerifyPass, response: Response, token: str, db: Session):

    # Enter log
    logger.info(
    "RESET PASSWORD START | token=%s | pass_len=%s",
    token,
    len(user_data.new_pass) if user_data else None)

    # Validate token is not empty
    if not token:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = "Token is required")
    
    # Get user_id from Redis
    user_id_str = redis_client.get(f"reset_pass:{token}")

    logger.info(
    "REDIS CHECK | key=%s | value=%s | type=%s",
    f"reset_pass:{token}",
    user_id_str,
    type(user_id_str))

    # If Link not live
    if not user_id_str:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = "Token expired or invalid. Please request a new password reset link.")
    
    # Convert string to UUID
    # try:
    #     user_id = UUID(str(user_id_str))
    # except (ValueError, TypeError) as e:
    #     raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
    #                         detail = "Invalid token format")

    try:
        user_id = UUID(str(user_id_str))
    except Exception as e:
        logger.error(
            "UUID PARSE ERROR | raw=%s | error=%s",
            user_id_str,
            str(e))
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = "Invalid token format")

    # Get user by id
    user = db.query(User).filter(User.id == user_id).first()

    # Check exist user
    if not user:
        raise HTTPException(status_code = status.HTTP_404_NOT_FOUND,
                            detail = "User not found")
    
    # Check password match
    if user_data.new_pass != user_data.confirm_new_pass:
        raise HTTPException(status_code = status.HTTP_400_BAD_REQUEST,
                            detail = "Passwords don`t match")
        
    # Save new password
    user.hashed_password = hash_password(user_data.confirm_new_pass)
    db.commit()
    db.refresh(user)

    # --- Security block --- #
    # Удаляем все refresh токены пользователя используя SET 
    delete_all_user_refresh_tokens(str(user.id))
    logger.info("Old tokens deleted")

    # --- Auto-login --- #
    new_access_token = create_access_token(subject=str(user.id), role=user.role.value)
    new_refresh_token = create_refresh_token(subject=str(user.id))
    logger.info(f"New tokens create for {user.login} user")

    # Save new tokens
    redis_client.set(
        f"refresh_token:{new_refresh_token}",
        str(user.id),
        ex=timedelta(days = REFRESH_TOKEN_EXPIRE_DAYS).total_seconds()
    )
    logger.info("Redis save tokens")
    
    # Добавляем токен в SET пользователя
    add_refresh_token_to_user_set(str(user.id), new_refresh_token)

    # Set cookies
    set_auth_cookies(response, new_access_token, new_refresh_token)
    logger.info("Set cookies")

    # Delete redis token for frop pass
    redis_client.delete(f"reset_pass:{token}")
    logger.info("Delete reset pass token")
    logger.info("Successful!")

    return user







    