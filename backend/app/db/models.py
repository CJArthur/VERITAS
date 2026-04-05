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


class UniversityApprovalStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class QualificationType(enum.Enum):
    bachelor = "bachelor"
    master = "master"
    specialist = "specialist"
    phd = "phd"


class StudyForm(enum.Enum):
    full_time = "full_time"
    part_time = "part_time"
    distance = "distance"


class DiplomaStatus(enum.Enum):
    active = "active"
    revoked = "revoked"
    suspended = "suspended"


class DocumentType(str, enum.Enum):
    diploma = "diploma"               # Диплом о высшем / среднем образовании
    certificate = "certificate"       # Сертификат курса / дополнительного обучения
    professional_license = "professional_license"  # Профессиональная лицензия / квалификация


class University(Base):
    __tablename__ = "universities"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(Text)
    ogrn: Mapped[str] = mapped_column(String(13))
    license_number: Mapped[str] = mapped_column(String)
    accreditation_number: Mapped[str] = mapped_column(String)
    api_secret_hash: Mapped[str] = mapped_column(Text)

    approval_status: Mapped[UniversityApprovalStatus] = mapped_column(
        Enum(UniversityApprovalStatus, values_callable=lambda x: [e.value for e in x]),
        default=UniversityApprovalStatus.pending,
    )
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)
    banner_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True, default=None)

    diplomas: Mapped[List["Diploma"]] = relationship(back_populates="university")
    staff_users: Mapped[List["User"]] = relationship(
        back_populates="university",
        foreign_keys="User.university_id",
    )


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
    university_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("universities.id", ondelete="SET NULL"),
        nullable=True,
    )
    yandex_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    university: Mapped[Optional["University"]] = relationship(
        back_populates="staff_users",
        foreign_keys=[university_id],
    )
    claimed_diplomas: Mapped[List["Diploma"]] = relationship(
        back_populates="student_user",
        foreign_keys="[Diploma.student_user_id]",
    )


class Diploma(Base):
    __tablename__ = "diplomas"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid4)
    university_id: Mapped[UUID] = mapped_column(ForeignKey("universities.id"))

    serial_number: Mapped[str] = mapped_column(String)
    registration_number: Mapped[str] = mapped_column(String, index=True)
    issue_date: Mapped[date] = mapped_column(Date)
    graduate_full_name: Mapped[str] = mapped_column(Text, index=True)
    graduate_birth_date: Mapped[date] = mapped_column(Date)
    specialty_code: Mapped[str] = mapped_column(String)
    specialty_name: Mapped[str] = mapped_column(Text)

    qualification: Mapped[QualificationType] = mapped_column(Enum(QualificationType))
    study_form: Mapped[StudyForm] = mapped_column(Enum(StudyForm))

    study_start_year: Mapped[int] = mapped_column(Integer)
    study_end_year: Mapped[int] = mapped_column(Integer)
    gpa: Mapped[float] = mapped_column(Numeric(3, 2))

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
    issuer_name: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True,
        comment="Для сертификатов и лицензий — название выдавшей организации (Coursera, Skillbox и др.)",
    )

    status: Mapped[DiplomaStatus] = mapped_column(
        Enum(DiplomaStatus), default=DiplomaStatus.active
    )
    revoke_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, server_default=func.now(), onupdate=func.now()
    )

    university: Mapped["University"] = relationship(back_populates="diplomas")
    student_user: Mapped[Optional["User"]] = relationship(
        back_populates="claimed_diplomas",
        foreign_keys=[student_user_id],
    )
    subjects: Mapped[List["TranscriptSubject"]] = relationship(back_populates="diploma")
    logs: Mapped[List["VerificationLog"]] = relationship(back_populates="diploma")


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
