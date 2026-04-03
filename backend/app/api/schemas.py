from pydantic import BaseModel, EmailStr, constr, Field
from typing import Optional
from uuid import UUID


class UserResponse(BaseModel):
    id: UUID
    login: str
    email: EmailStr
    is_verified: bool
    role: str
    university_id: Optional[UUID] = None

    class Config:
        from_attributes = True

# --- Registration/Verification --- #
class UserRegister(BaseModel):
    login: str
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )

class VerificationIn(BaseModel):
    email: EmailStr
    code: str

class Message(BaseModel):
    message: str

# --- Reset password in account --- #
class ResetPassword(BaseModel):
    old_pass: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )
    
    new_pass: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )

    confirm_new_pass: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )


# --- Forgot password --- #
class ForgotPassword(BaseModel):
    email: EmailStr

# --- Confirm pass(drop pass/delete prof) --- #
class VerifyPass(BaseModel):
    new_pass: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )

    confirm_new_pass: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )

# --- Log in/Access --- #
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str

class RefreshRequest(BaseModel):
    refresh_token: str

# --- New login --- #
class SetNewLogin(BaseModel):
    new_login: str

# --- Delete prof --- #
class DeleteProf(BaseModel):
    password: str = Field(
        min_length=8,
        max_length=128,
        description="User password"
    )

# --- Token validation --- #
class TokenValidatioRequest(BaseModel):
    token: str


# --- University registration --- #
class UniversityRegister(BaseModel):
    login: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    university_name: str
    ogrn: constr(min_length=13, max_length=13)
    license_number: str
    accreditation_number: str


class RejectUniversityBody(BaseModel):
    reason: str = Field(min_length=1, max_length=2000)


class ClaimDiplomaBody(BaseModel):
    registration_number: str
    graduate_full_name: str


class ShareLinkBody(BaseModel):
    valid_hours: int = Field(default=72, ge=1, le=24 * 365)


class ManualDiplomaIn(BaseModel):
    graduate_full_name: str
    year: int
    specialty_name: str
    diploma_number: str


class PublicDiplomaView(BaseModel):
    certificate_token: UUID
    graduate_full_name: str
    specialty_name: str
    study_end_year: int
    registration_number: str
    university_name: str
    status: str
    signature_valid: bool
    employer_link_valid_until: Optional[str] = None
