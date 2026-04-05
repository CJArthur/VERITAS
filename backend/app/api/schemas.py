from pydantic import BaseModel, EmailStr, constr, Field
from typing import Optional, List
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
    birth_year: Optional[int] = None   # если указан — проверяется; None = мягкий режим для старых записей


class ShareLinkBody(BaseModel):
    valid_hours: int = Field(default=72, ge=1, le=24 * 365)
    recipient: Optional[str] = Field(
        default=None,
        max_length=120,
        description="Кому открывается доступ — отображается на странице верификации",
    )


class ManualDiplomaIn(BaseModel):
    graduate_full_name: str
    birth_year: int                   # год рождения выпускника — используется при привязке диплома студентом
    year: int                         # год окончания
    specialty_name: str
    diploma_number: str
    qualification: str = "bachelor"   # bachelor | master | specialist | phd
    document_type: str = "diploma"    # diploma | certificate | professional_license
    issuer_name: Optional[str] = None # заполняется для сертификатов (Coursera, Skillbox…)


class PublicDiplomaView(BaseModel):
    certificate_token: UUID
    graduate_full_name: str
    specialty_name: str
    study_end_year: int
    registration_number: str
    university_name: str
    university_avatar_url: Optional[str] = None
    status: str
    signature_valid: bool
    employer_link_valid_until: Optional[str] = None
    verification_count: int = 0
    share_recipient: Optional[str] = None
    document_type: str = "diploma"
    issuer_name: Optional[str] = None


class SubjectOut(BaseModel):
    subject_name: str
    hours: int
    credits: int
    grade: int
    semester: int

    class Config:
        from_attributes = True


class VerificationLogOut(BaseModel):
    verifier_type: str
    verifier_ip: str
    verifier_org_name: Optional[str] = None
    verified_at: str
    result: str


class DiplomaListItem(BaseModel):
    id: UUID
    registration_number: str
    graduate_full_name: str
    specialty_name: str
    study_end_year: int
    status: str
    certificate_token: UUID
    student_user_id: Optional[UUID] = None
    created_at: str


class DiplomaDetail(BaseModel):
    id: UUID
    registration_number: str
    serial_number: str
    graduate_full_name: str
    specialty_name: str
    specialty_code: str
    study_start_year: int
    study_end_year: int
    issue_date: str
    gpa: float
    status: str
    revoke_reason: Optional[str] = None
    certificate_token: UUID
    data_hash: str
    signature_valid: bool
    university_name: str
    student_user_id: Optional[UUID] = None
    employer_link_valid_until: Optional[str] = None
    subjects: List[SubjectOut] = []
    logs: List[VerificationLogOut] = []
    created_at: str


class UniversityProfilePatch(BaseModel):
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None


class UniversityInfo(BaseModel):
    id: UUID
    name: str
    ogrn: str
    license_number: str
    accreditation_number: str
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    approval_status: str

    class Config:
        from_attributes = True
