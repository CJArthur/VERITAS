import enum
from datetime import date, datetime
from typing import List, Optional
from uuid import UUID, uuid4

from sqlalchemy import (
    String,
    Text,
    Date,
    Integer,
    Numeric,
    ForeignKey,
    Enum,
    DateTime,
    func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class UserRole(str, enum.Enum):
    super_admin = "super_admin"
    university_staff = "university_staff"
    student = "student"


class IssuerApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


# Keep old name as alias so existing code that references UniversityApprovalStatus
# doesn't break before we finish the rename sweep.
UniversityApprovalStatus = IssuerApprovalStatus


class IssuerType(str, enum.Enum):
    university         = "university"
    training_center    = "training_center"
    corporate          = "corporate"
    certification_body = "certification_body"


class QualificationType(enum.Enum):
    bachelor   = "bachelor"
    master     = "master"
    specialist = "specialist"
    phd        = "phd"
    # Non-diploma document types don't have a qualification level
    certificate          = "certificate"
    professional_license = "professional_license"


class StudyForm(enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    distance  = "distance"


class DiplomaStatus(enum.Enum):
    active    = "active"
    revoked   = "revoked"
    suspended = "suspended"


class DocumentType(str, enum.Enum):
    diploma              = "diploma"
    certificate          = "certificate"
    professional_license = "professional_license"


class Issuer(Base):
    __tablename__ = "issuers"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(Text)
    ogrn: Mapped[str] = mapped_column(String(13))
    license_number: Mapped[str] = mapped_column(String)
    accreditation_number: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    api_secret_hash: Mapped[str] = mapped_column(Text)

    issuer_type: Mapped[IssuerType] = mapped_column(
        Enum(IssuerType, values_callable=lambda x: [e.value for e in x]),
        default=IssuerType.university,
    )
    approval_status: Mapped[IssuerApprovalStatus] = mapped_column(
        Enum(IssuerApprovalStatus, values_callable=lambda x: [e.value for e in x]),
        default=IssuerApprovalStatus.pending,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    banner_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    diplomas: Mapped[List["Diploma"]] = relationship(back_populates="issuer")
    staff_users: Mapped[List["User"]] = relationship(
        back_populates="issuer",
        foreign_keys="User.issuer_id",
    )


# Backward-compat alias — remove after all University references are gone
University = Issuer


class User(Base):
    __tablename__ = "users"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    login: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(Text)
    is_verified: Mapped[bool] = mapped_column(default=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.student,
    )
    issuer_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("issuers.id", ondelete="SET NULL"),
        nullable=True,
    )
    yandex_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    issuer: Mapped[Optional["Issuer"]] = relationship(
        back_populates="staff_users",
        foreign_keys=[issuer_id],
    )
    claimed_diplomas: Mapped[List["Diploma"]] = relationship(
        back_populates="student_user",
        foreign_keys="[Diploma.student_user_id]",
    )

    # Backward-compat property
    @property
    def university_id(self) -> Optional[UUID]:
        return self.issuer_id

    @university_id.setter
    def university_id(self, value: Optional[UUID]) -> None:
        self.issuer_id = value

    @property
    def university(self) -> Optional["Issuer"]:
        return self.issuer


class Diploma(Base):
    __tablename__ = "diplomas"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    issuer_id: Mapped[UUID] = mapped_column(ForeignKey("issuers.id"))

    serial_number: Mapped[str] = mapped_column(String)
    registration_number: Mapped[str] = mapped_column(String, index=True)
    issue_date: Mapped[date] = mapped_column(Date)
    graduate_full_name: Mapped[str] = mapped_column(Text, index=True)
    graduate_birth_date: Mapped[date] = mapped_column(Date)
    specialty_code: Mapped[str] = mapped_column(String)
    specialty_name: Mapped[str] = mapped_column(Text)

    qualification: Mapped[Optional[QualificationType]] = mapped_column(
        Enum(QualificationType, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
    )
    study_form: Mapped[StudyForm] = mapped_column(Enum(StudyForm))

    study_start_year: Mapped[int] = mapped_column(Integer)
    study_end_year: Mapped[int] = mapped_column(Integer)
    gpa: Mapped[Optional[float]] = mapped_column(Numeric(3, 2), nullable=True)

    data_hash: Mapped[str] = mapped_column(String(64))
    transcript_hash: Mapped[str] = mapped_column(String(64))
    certificate_token: Mapped[UUID] = mapped_column(default=uuid4, unique=True)
    issuer_signature: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)

    student_user_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    employer_link_valid_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    share_recipient: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType, values_callable=lambda x: [e.value for e in x]),
        default=DocumentType.diploma,
    )
    issuer_name: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    status: Mapped[DiplomaStatus] = mapped_column(
        Enum(DiplomaStatus), default=DiplomaStatus.active
    )
    revoke_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Blockchain anchoring fields
    blockchain_tx_hash: Mapped[Optional[str]] = mapped_column(String(66), nullable=True)
    blockchain_anchored_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    blockchain_network: Mapped[str] = mapped_column(String(32), default="sepolia")

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    issuer: Mapped["Issuer"] = relationship(back_populates="diplomas")
    student_user: Mapped[Optional["User"]] = relationship(
        back_populates="claimed_diplomas",
        foreign_keys=[student_user_id],
    )
    subjects: Mapped[List["TranscriptSubject"]] = relationship(back_populates="diploma")
    logs: Mapped[List["VerificationLog"]] = relationship(back_populates="diploma")

    # Backward-compat property
    @property
    def university_id(self) -> UUID:
        return self.issuer_id

    @property
    def university(self) -> Optional["Issuer"]:
        return self.issuer


class TranscriptSubject(Base):
    __tablename__ = "transcript_subjects"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    diploma_id: Mapped[UUID] = mapped_column(ForeignKey("diplomas.id"))

    subject_name: Mapped[str] = mapped_column(String)
    hours: Mapped[int] = mapped_column(Integer)
    credits: Mapped[int] = mapped_column(Integer)
    grade: Mapped[int] = mapped_column(Integer)
    semester: Mapped[int] = mapped_column(Integer)

    diploma: Mapped["Diploma"] = relationship(back_populates="subjects")


class VerificationLog(Base):
    __tablename__ = "verification_logs"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    diploma_id: Mapped[UUID] = mapped_column(ForeignKey("diplomas.id"))

    verifier_type: Mapped[str] = mapped_column(String)
    verifier_ip: Mapped[str] = mapped_column(String)
    verifier_org_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    verified_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    result: Mapped[str] = mapped_column(String)

    diploma: Mapped["Diploma"] = relationship(back_populates="logs")


class EmployerApiKey(Base):
    __tablename__ = "employer_api_keys"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    org_name: Mapped[str] = mapped_column(String(255))
    key_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    last_used_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
