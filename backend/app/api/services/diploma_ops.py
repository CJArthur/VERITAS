import hashlib
from datetime import date, datetime, timedelta, timezone
from uuid import uuid4

from sqlalchemy.orm import Session

from app.api.services.diploma_crypto import (
    compute_data_hash,
    issuer_signature_hmac,
)
from app.db.models import (
    Diploma,
    DiplomaStatus,
    QualificationType,
    StudyForm,
    University,
)


def _empty_transcript_hash() -> str:
    return hashlib.sha256(b"[]").hexdigest()


def create_diploma_minimal(
    db: Session,
    *,
    university: University,
    graduate_full_name: str,
    year: int,
    specialty_name: str,
    diploma_number: str,
) -> Diploma:
    """Создаёт запись диплома из минимального набора полей (импорт CSV / ручной ввод)."""
    issue_date = date(year, 6, 30)
    birth_placeholder = date(1900, 1, 1)
    start_year = max(1900, year - 4)

    data_hash = compute_data_hash(
        university_id=university.id,
        registration_number=diploma_number,
        graduate_full_name=graduate_full_name,
        issue_date=issue_date,
        serial_number=diploma_number,
    )
    sig = issuer_signature_hmac(university.id, data_hash)

    d = Diploma(
        university_id=university.id,
        serial_number=diploma_number,
        registration_number=diploma_number,
        issue_date=issue_date,
        graduate_full_name=graduate_full_name.strip(),
        graduate_birth_date=birth_placeholder,
        specialty_code="00.00.00",
        specialty_name=specialty_name.strip(),
        qualification=QualificationType.bachelor,
        study_form=StudyForm.full_time,
        study_start_year=start_year,
        study_end_year=year,
        gpa=0.0,
        data_hash=data_hash,
        transcript_hash=_empty_transcript_hash(),
        certificate_token=uuid4(),
        issuer_signature=sig,
        status=DiplomaStatus.active,
    )
    db.add(d)
    db.commit()
    db.refresh(d)
    return d


def revoke_diploma(
    db: Session,
    diploma: Diploma,
    *,
    reason: str,
) -> Diploma:
    diploma.status = DiplomaStatus.revoked
    diploma.revoke_reason = reason
    db.commit()
    db.refresh(diploma)
    return diploma


def set_share_expiry(
    db: Session,
    diploma: Diploma,
    *,
    valid_hours: int,
) -> datetime:
    until = datetime.now(timezone.utc) + timedelta(hours=valid_hours)
    diploma.employer_link_valid_until = until
    db.commit()
    db.refresh(diploma)
    return until
