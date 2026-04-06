from fastapi import APIRouter, Request, Response, status, Depends, Query, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session

from app.db.postgres import get_db
from app.db.models import User

from app.api.schemas import (
    UserLogin,
    UserRegister,
    ResetPassword,
    ForgotPassword,
    VerifyPass,
    SetNewLogin,
    DeleteProf,
    UserResponse,
    UniversityRegister,
    IssuerRegister,
)
from app.api.services.registration_service import registr_user
from app.api.services.verify_service import verify_user_email
from app.api.services.login_service import login_user
from app.api.services.refresh_service import make_update_refresh_token
from app.api.services.login_service import set_new_login
from app.api.services.reset_password_service import (reset_password_in_account,
                                                     forgot_password_by_email,
                                                     reset_password)
from app.api.services.logout_service import logout_user
from app.api.services.delete_profile_service import delete_profile
from app.api.services.university_registration_service import register_university_account
from app.api.services.issuer_registration_service import register_issuer_account
from app.utils.dependencies import get_current_user

router = APIRouter()
edit_data_router = APIRouter()

@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)):
     return current_user

# --- Registration Endpoint --- #
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Вся сложная логика ушла в сервис
    registr_user(
        db=db,
        user_email=user_data.email,
        user_password=user_data.password,
        user_login=user_data.login,
        background_tasks=background_tasks
    )
    
    return {"message": "Registration successful. Check your email."}


@router.post("/register/university", status_code=status.HTTP_201_CREATED)
def register_university(
    user_data: UniversityRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    register_university_account(
        db=db,
        user_login=user_data.login,
        user_email=user_data.email,
        user_password=user_data.password,
        university_name=user_data.issuer_name,
        ogrn=user_data.ogrn,
        license_number=user_data.license_number,
        accreditation_number=user_data.accreditation_number,
        background_tasks=background_tasks,
    )
    return {
        "message": "Application submitted. Verify your email. "
        "A super-admin must approve the university before staff can sign in.",
    }


@router.post("/register/issuer", status_code=status.HTTP_201_CREATED)
def register_issuer(
    user_data: IssuerRegister,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    register_issuer_account(
        db=db,
        user_login=user_data.login,
        user_email=user_data.email,
        user_password=user_data.password,
        issuer_name=user_data.issuer_name,
        ogrn=user_data.ogrn,
        license_number=user_data.license_number,
        accreditation_number=user_data.accreditation_number,
        issuer_type=user_data.issuer_type,
        background_tasks=background_tasks,
    )
    return {
        "message": "Application submitted. Verify your email. "
        "A super-admin must approve the issuer before staff can sign in.",
    }


# --- Verification Endpoint --- #
@router.get("/verify")
def verify(response: Response, token: str = Query(...), db: Session = Depends(get_db)):
    # Call function from services
    redirect_resp = verify_user_email(response, token, db)

    return redirect_resp

# --- Log in Endpoint --- #
@router.post("/login")
def login(user_data: UserLogin, response: Response, db: Session = Depends(get_db)):

    user = login_user(user_data, response, db)

    return user

# --- Refresh Endpoint --- #
@router.post("/refresh")
def update_refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    
    answer = make_update_refresh_token(request, response, db)

    return {"message": "Token rotaded and refreshed", "status_code": {answer}}


# --- Log out Endpoint --- #
@router.post("/logout")
def logout(request: Request, response: Response):

    # 1. Get token from request
    access_token_bearer = request.cookies.get("access_token")
    refresh_token = request.cookies.get("refresh_token")

    answer = logout_user(access_token_bearer, refresh_token, response)

    return {"message": "Logged out successfuly",
            "status_code": answer}


# --- Forgot password --- #
# 1. Send email
@edit_data_router.post("/forgot-pass")
def forgot_password(user_data: ForgotPassword, background_tasks: BackgroundTasks,
                    db: Session = Depends(get_db)):
    
    forgot_password_by_email(user_data, background_tasks, db)

    return {"message": "Check your email to reset password"}

# 2. Reset old pass and set new
@edit_data_router.post("/reset-pass")
def reset_password_after_mail(user_data: VerifyPass, response: Response, token: str = Query(...), db: Session = Depends(get_db)):
    try:
        reset_password(user_data, response, token, db)
        return {"message": "Password reseted successul"}
    except HTTPException:
        # Re-raise HTTP exceptions to preserve status code and detail
        raise
    except Exception as e:
        # Catch any unexpected errors
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while resetting password: {str(e)}"
        )

# --- Reset password in account Endpoint --- #
@edit_data_router.post("/set-new-pass")
def set_new_pass_in_account(user_data: ResetPassword, current_user: User = Depends(get_current_user),
                            db: Session = Depends(get_db)):

    reset_password_in_account(user_data, current_user, db)

    return {"message": "Successful resetting password"}


# --- Set new login in account --- #
@edit_data_router.put("/change-login")
def change_login(user_data: SetNewLogin, db: Session = Depends(get_db),
                 current_user: User = Depends(get_current_user)):
    
    set_new_login(user_data, db, current_user)

    return {"message": "User name changed"}


# --- Delete profile --- #
@edit_data_router.post("/delete-profile")
def delete_profile_in_account(user_data: DeleteProf, response: Response, 
                              db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    

    return delete_profile(user_data, response, db, current_user)
