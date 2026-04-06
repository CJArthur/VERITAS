import re
from datetime import date
from pydantic import BaseModel, EmailStr, constr, Field, field_validator
from typing import Optional, List
from uuid import UUID


class UserResponse(BaseModel):
    id: UUID
    login: str
    email: EmailStr
    is_verified: bool
    role: str
    issuer_id: Optional[UUID] = None

    # Backward-compat alias for any frontend still using university_id
    @property
    def university_id(self) -> Optional[UUID]:
        return self.issuer_id

    class Config:
        from_attributes = True


# --- Registration/Verification --- #
class UserRegister(BaseModel):
    login: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class VerificationIn(BaseModel):
    email: EmailStr
    code: str


class Message(BaseModel):
    message: str


# --- Reset password in account --- #
class ResetPassword(BaseModel):
    old_pass: str = Field(min_length=8, max_length=128)
    new_pass: str = Field(min_length=8, max_length=128)
    confirm_new_pass: str = Field(min_length=8, max_length=128)


# --- Forgot password --- #
class ForgotPassword(BaseModel):
    email: EmailStr


# --- Confirm pass(drop pass/delete prof) --- #
class VerifyPass(BaseModel):
    new_pass: str = Field(min_length=8, max_length=128)
    confirm_new_pass: str = Field(min_length=8, max_length=128)


# --- Admin actions --- #
class RejectIssuerBody(BaseModel):
    reason: str = Field(min_length=1, max_length=500)


# --- Log in/Access --- #
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


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
    password: str = Field(min_length=8, max_length=128)


# --- Token validation --- #
class TokenValidatioRequest(BaseModel):
    token: str


# --- Issuer registration --- #
class IssuerRegister(BaseModel):
    login: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    issuer_name: str
    issuer_type: str = "university"          # university | training_center | corporate | certification_body
    ogrn: constr(min_length=13, max_length=13)
    license_number: str
    accreditation_number: Optional[str] = None   # required only for university type

    @field_validator("accreditation_number")
    @classmethod
    def accreditation_required_for_university(cls, v: Optional[str], info) -> Optional[str]:
        issuer_type = info.data.get("issuer_type", "university")
        if issuer_type == "university" and not v:
            raise ValueError("accreditation_number is required for universities")
        return v


# Backward-compat alias — some older code imports UniversityRegister
UniversityRegister = IssuerRegister


RejectUniversityBody = RejectIssuerBody  # backward-compat alias


class ClaimDiplomaBody(BaseModel):
    registration_number: str
    graduate_full_name: str
    birth_year: Optional[int] = None


class ShareLinkBody(BaseModel):
    valid_hours: int = Field(default=72, ge=1, le=24 * 365)
    recipient: Optional[str] = Field(default=None, max_length=120)


# Document type / issuer type compatibility matrix
_ALLOWED_DOC_TYPES: dict[str, set[str]] = {
    "university":         {"diploma", "certificate", "professional_license"},
    "training_center":    {"certificate", "professional_license"},
    "corporate":          {"certificate"},
    "certification_body": {"certificate", "professional_license"},
}

_OCSО_RE = re.compile(r"^\d{2}\.\d{2}\.\d{2}$")


class ManualDiplomaIn(BaseModel):
    graduate_full_name: str
    birth_date: date                                    # full date, was birth_year int
    issue_date: Optional[date] = None                  # default: June 30 of study_end_year
    study_end_year: int                                 # was: year
    specialty_name: str
    specialty_code: Optional[str] = None               # ОКСО format XX.XX.XX; required for diploma
    diploma_number: str
    qualification: str = "bachelor"
    document_type: str = "diploma"
    issuer_name: Optional[str] = None                  # brand name if different from registered issuer
    gpa: float = Field(ge=0.0, le=5.0)                 # required — forces conscious entry

    @field_validator("specialty_code")
    @classmethod
    def validate_specialty_code(cls, v: Optional[str], info) -> Optional[str]:
        doc_type = info.data.get("document_type", "diploma")
        if doc_type == "diploma":
            if not v:
                raise ValueError("specialty_code is required for diplomas (ОКСО format XX.XX.XX)")
            if not _OCSО_RE.match(v):
                raise ValueError("specialty_code must match XX.XX.XX (ОКСО format)")
        return v


class PublicDiplomaView(BaseModel):
    certificate_token: UUID
    graduate_full_name: str
    specialty_name: str
    study_end_year: int
    registration_number: str
    university_name: str                               # kept as university_name for frontend compat
    university_avatar_url: Optional[str] = None
    status: str
    signature_valid: bool
    employer_link_valid_until: Optional[str] = None
    verification_count: int = 0
    share_recipient: Optional[str] = None
    document_type: str = "diploma"
    issuer_name: Optional[str] = None
    blockchain_status: str = "not_configured"          # not_configured | pending | anchored | mismatch
    blockchain_tx_hash: Optional[str] = None
    blockchain_anchored_at: Optional[str] = None
    blockchain_network: str = "sepolia"


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
    blockchain_status: str = "not_configured"
    blockchain_tx_hash: Optional[str] = None
    blockchain_anchored_at: Optional[str] = None


class IssuerProfilePatch(BaseModel):
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None


# Backward-compat alias
UniversityProfilePatch = IssuerProfilePatch


class IssuerInfo(BaseModel):
    id: UUID
    name: str
    ogrn: str
    license_number: str
    accreditation_number: Optional[str] = None
    issuer_type: str = "university"
    avatar_url: Optional[str] = None
    banner_url: Optional[str] = None
    approval_status: str

    class Config:
        from_attributes = True


# Backward-compat alias
UniversityInfo = IssuerInfo
