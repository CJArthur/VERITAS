"""
Employer/HR open API — verified via Bearer API key.
Used by HR systems, ATS integrations, and direct API consumers.

Authentication: Authorization: Bearer <api_key>
Rate limit: enforced at application level (future: Redis sliding window)
"""

import hashlib
import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from app.api.services.diploma_crypto import verify_issuer_signature
from app.db.models import Diploma, DiplomaStatus, EmployerApiKey, VerificationLog
from app.db.postgres import get_db

router = APIRouter(prefix="/employer", tags=["Employer API"])


def _hash_key(raw_key: str) -> str:
    return hashlib.sha256(raw_key.encode()).hexdigest()


def _get_api_key(
    authorization: str = Header(..., description="Bearer <api_key>"),
    db: Session = Depends(get_db),
) -> EmployerApiKey:
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header. Use: Bearer <api_key>",
            headers={"WWW-Authenticate": "Bearer"},
        )
    raw_key = authorization[7:]
    key_hash = _hash_key(raw_key)
    api_key = (
        db.query(EmployerApiKey)
        .filter(EmployerApiKey.key_hash == key_hash, EmployerApiKey.is_active == True)
        .first()
    )
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or revoked API key",
            headers={"WWW-Authenticate": "Bearer"},
        )
    # Update last_used_at (non-blocking — best effort)
    try:
        api_key.last_used_at = datetime.now(timezone.utc)
        db.commit()
    except Exception:
        db.rollback()
    return api_key


@router.get(
    "/verify/{certificate_token}",
    summary="Verify diploma authenticity",
    description="""
Verify a diploma by its certificate token. Returns full diploma data with cryptographic signature status.

**Authentication:** `Authorization: Bearer <your_api_key>`

**Use cases:**
- ATS (Applicant Tracking System) integration
- HR platform background check automation
- Corporate onboarding verification workflows

**Response codes:**
- `200` — diploma found and data returned (check `status` and `signature_valid` fields)
- `401` — invalid or missing API key
- `404` — diploma not found
- `410` — diploma access expired or diploma revoked
""",
)
def employer_verify(
    certificate_token: UUID,
    request: Request,
    db: Session = Depends(get_db),
    api_key: EmployerApiKey = Depends(_get_api_key),
):
    d = (
        db.query(Diploma)
        .options(joinedload(Diploma.university))
        .filter(Diploma.certificate_token == certificate_token)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diploma not found")

    now = datetime.now(timezone.utc)

    # Check employer link TTL
    if d.employer_link_valid_until is None:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Graduate has not shared access to this diploma",
        )
    raw_until = d.employer_link_valid_until
    valid_until = (
        raw_until.replace(tzinfo=timezone.utc)
        if raw_until.tzinfo is None
        else raw_until.astimezone(timezone.utc)
    )
    if now > valid_until:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail="Employer access link has expired. Ask graduate to renew.",
        )

    # Verify cryptographic signature
    sig_ok = False
    if d.issuer_signature:
        sig_ok = verify_issuer_signature(d.university_id, d.data_hash, d.issuer_signature)

    diploma_status = d.status.value if hasattr(d.status, "value") else str(d.status)

    # Write immutable verification log
    log = VerificationLog(
        diploma_id=d.id,
        verifier_type="employer_api",
        verifier_ip=request.client.host if request.client else "unknown",
        verifier_org_name=api_key.org_name,
        result="ok" if (sig_ok and diploma_status == "active") else "signature_mismatch" if not sig_ok else diploma_status,
    )
    db.add(log)
    db.commit()

    return {
        "verified": sig_ok and diploma_status == "active",
        "diploma": {
            "certificate_token": str(d.certificate_token),
            "registration_number": d.registration_number,
            "graduate_full_name": d.graduate_full_name,
            "university_name": d.university.name if d.university else None,
            "specialty_name": d.specialty_name,
            "specialty_code": d.specialty_code,
            "study_end_year": d.study_end_year,
            "issue_date": d.issue_date.isoformat() if d.issue_date else None,
            "qualification": d.qualification.value if hasattr(d.qualification, "value") else str(d.qualification),
            "gpa": float(d.gpa) if d.gpa else None,
            "status": diploma_status,
        },
        "verification": {
            "signature_valid": sig_ok,
            "checked_at": now.isoformat(),
            "verified_by_org": api_key.org_name,
        },
        "access": {
            "valid_until": valid_until.isoformat(),
        },
    }
