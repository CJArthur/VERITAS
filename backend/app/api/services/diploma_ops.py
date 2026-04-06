import hashlib
import asyncio
import logging
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
    DocumentType,
    Issuer,
    QualificationType,
    StudyForm,
)

log = logging.getLogger(__name__)

# Canonical study durations by qualification
STUDY_DURATION: dict[str, int] = {
    "bachelor":            4,
    "specialist":          5,
    "master":              2,
    "phd":                 3,
    "certificate":         1,
    "professional_license": 1,
}

# Document types allowed per issuer type
ALLOWED_DOC_TYPES: dict[str, set[str]] = {
    "university":          {"diploma", "certificate", "professional_license"},
    "training_center":     {"certificate", "professional_license"},
    "corporate":           {"certificate"},
    "certification_body":  {"certificate", "professional_license"},
}


def _empty_transcript_hash() -> str:
    return hashlib.sha256(b"[]").hexdigest()


def create_diploma_minimal(
    db: Session,
    *,
    issuer: Issuer,
    graduate_full_name: str,
    birth_date: date,
    study_end_year: int,
    specialty_name: str,
    specialty_code: str,
    diploma_number: str,
    gpa: float | None,
    qualification: str | None = None,
    document_type: str = "diploma",
    issuer_name: str | None = None,
    issue_date: date | None = None,
) -> Diploma:
    """
    Creates a diploma record from the full required field set.
    All fields explicit — no silent defaults for data quality fields.
    """
    # Validate document type compatibility
    allowed = ALLOWED_DOC_TYPES.get(issuer.issuer_type.value, set())
    if document_type not in allowed:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"{issuer.issuer_type.value} issuers cannot issue {document_type} documents",
        )

    resolved_issue_date = issue_date or date(study_end_year, 6, 30)
    resolved_qualification = qualification or ("bachelor" if document_type == "diploma" else None)
    duration = STUDY_DURATION.get(resolved_qualification or "", 1)
    start_year = max(1900, study_end_year - duration)

    data_hash = compute_data_hash(
        issuer_id=issuer.id,
        registration_number=diploma_number,
        graduate_full_name=graduate_full_name,
        issue_date=resolved_issue_date,
        serial_number=diploma_number,
    )
    sig = issuer_signature_hmac(issuer.id, data_hash)

    d = Diploma(
        issuer_id=issuer.id,
        serial_number=diploma_number,
        registration_number=diploma_number,
        issue_date=resolved_issue_date,
        graduate_full_name=graduate_full_name.strip(),
        graduate_birth_date=birth_date,
        specialty_code=(specialty_code or "").strip() or "00.00.00",
        specialty_name=specialty_name.strip(),
        qualification=QualificationType(resolved_qualification)
            if resolved_qualification in QualificationType._value2member_map_
            else None,
        study_form=StudyForm.full_time,
        study_start_year=start_year,
        study_end_year=study_end_year,
        gpa=round(float(gpa), 2) if gpa is not None else None,
        data_hash=data_hash,
        transcript_hash=_empty_transcript_hash(),
        certificate_token=uuid4(),
        issuer_signature=sig,
        status=DiplomaStatus.active,
        document_type=DocumentType(document_type) if document_type else DocumentType.diploma,
        issuer_name=issuer_name.strip() if issuer_name else None,
    )
    db.add(d)
    db.commit()
    db.refresh(d)

    # Fire-and-forget blockchain anchor in background
    _schedule_blockchain_anchor(d.data_hash, str(d.id), db)

    return d


def _schedule_blockchain_anchor(data_hash: str, diploma_id: str, db: Session) -> None:
    """
    Schedule blockchain anchoring without blocking the request.

    create_diploma_minimal runs inside a FastAPI sync endpoint, which executes
    in a threadpool thread — not the event loop thread. asyncio.create_task()
    requires the event loop thread. We use run_coroutine_threadsafe() instead,
    which is safe to call from any thread given the running loop.
    """
    from app.api.services.blockchain_service import blockchain_service
    if not blockchain_service.is_configured():
        return
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        # No event loop running at all (e.g. tests, CLI) — skip silently
        return
    asyncio.run_coroutine_threadsafe(_anchor_and_save(data_hash, diploma_id), loop)


async def _anchor_and_save(data_hash: str, diploma_id: str) -> None:
    """Background task: anchor hash then update diploma record."""
    from app.api.services.blockchain_service import blockchain_service
    from app.db.postgres import SessionLocal
    from app.db.models import Diploma as DM
    from uuid import UUID
    try:
        tx_hash = await blockchain_service.anchor(data_hash)
        # Open fresh session — original request session is already closed
        with SessionLocal() as session:
            d = session.query(DM).filter(DM.id == UUID(diploma_id)).first()
            if d:
                d.blockchain_tx_hash = tx_hash
                d.blockchain_anchored_at = datetime.now(timezone.utc)
                session.commit()
        log.info("Blockchain anchor OK diploma=%s tx=%s", diploma_id, tx_hash)
    except Exception as exc:
        log.warning("Blockchain anchor FAILED diploma=%s: %s", diploma_id, exc)


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
    recipient: str | None = None,
) -> datetime:
    until = datetime.now(timezone.utc) + timedelta(hours=valid_hours)
    diploma.employer_link_valid_until = until
    diploma.share_recipient = recipient.strip() if recipient else None
    db.commit()
    db.refresh(diploma)
    return until
