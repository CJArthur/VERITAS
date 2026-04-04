from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, joinedload

from app.api.schemas import PublicDiplomaView
from app.api.services.diploma_crypto import verify_issuer_signature
from app.db.models import Diploma, DiplomaStatus, VerificationLog
from app.db.postgres import get_db

router = APIRouter(prefix="/public", tags=["Public verification"])


@router.get("/diplomas/{certificate_token}", response_model=PublicDiplomaView)
def public_view_diploma(
    certificate_token: UUID,
    request: Request,
    db: Session = Depends(get_db),
):
    d = (
        db.query(Diploma)
        .options(joinedload(Diploma.university))
        .filter(Diploma.certificate_token == certificate_token)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    now = datetime.now(timezone.utc)
    if d.employer_link_valid_until is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Выпускник ещё не открыл доступ по ссылке",
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
            detail="Срок действия ссылки истёк",
        )

    if d.status == DiplomaStatus.revoked:
        raise HTTPException(
            status_code=status.HTTP_410_GONE,
            detail=f"Диплом аннулирован: {d.revoke_reason or '—'}",
        )

    sig_ok = False
    if d.issuer_signature:
        sig_ok = verify_issuer_signature(d.university_id, d.data_hash, d.issuer_signature)

    log = VerificationLog(
        diploma_id=d.id,
        verifier_type="public_link",
        verifier_ip=request.client.host if request.client else "unknown",
        result="ok" if sig_ok else "signature_mismatch",
    )
    db.add(log)
    db.commit()

    return PublicDiplomaView(
        certificate_token=d.certificate_token,
        graduate_full_name=d.graduate_full_name,
        specialty_name=d.specialty_name,
        study_end_year=d.study_end_year,
        registration_number=d.registration_number,
        university_name=d.university.name if d.university else "",
        status=d.status.value,
        signature_valid=sig_ok,
        employer_link_valid_until=valid_until.isoformat(),
    )
