import io
from uuid import UUID

import qrcode
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session, joinedload

from app.api.schemas import ClaimDiplomaBody, ShareLinkBody
from app.api.services.diploma_ops import set_share_expiry
from app.db.models import Diploma, DiplomaStatus, User, VerificationLog
from app.db.postgres import get_db
from app.utils.config import PUBLIC_DIPLOMA_URL_BASE
from app.utils.role_deps import require_student

router = APIRouter(prefix="/student", tags=["Student"])


def _norm_name(s: str) -> str:
    return " ".join(s.strip().lower().split())


@router.get("/diplomas")
def my_diplomas(
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    rows = (
        db.query(Diploma)
        .options(joinedload(Diploma.university), joinedload(Diploma.logs))
        .filter(Diploma.student_user_id == user.id)
        .order_by(Diploma.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(d.id),
            "registration_number": d.registration_number,
            "graduate_full_name": d.graduate_full_name,
            "specialty_name": d.specialty_name,
            "study_end_year": d.study_end_year,
            "status": d.status.value,
            "university_name": d.university.name if d.university else None,
            "university_avatar_url": d.university.avatar_url if d.university else None,
            "certificate_token": str(d.certificate_token),
            "employer_link_valid_until": d.employer_link_valid_until.isoformat()
            if d.employer_link_valid_until
            else None,
            "verification_count": len(d.logs),
            "last_verified_at": max(
                (lg.verified_at for lg in d.logs), default=None
            ).isoformat() if d.logs else None,
            "share_recipient": d.share_recipient,
            "document_type": d.document_type.value if d.document_type else "diploma",
            "issuer_name": d.issuer_name,
        }
        for d in rows
    ]


@router.get("/diplomas/{diploma_id}/activity")
def diploma_activity(
    diploma_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    """Per-diploma verification history visible to the owning student."""
    d = (
        db.query(Diploma)
        .filter(Diploma.id == diploma_id, Diploma.student_user_id == user.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    logs = (
        db.query(VerificationLog)
        .filter(VerificationLog.diploma_id == d.id)
        .order_by(VerificationLog.verified_at.desc())
        .limit(20)
        .all()
    )
    return [
        {
            "verifier_org": lg.verifier_org_name,
            "verifier_type": lg.verifier_type,
            "result": lg.result,
            "verified_at": lg.verified_at.isoformat(),
        }
        for lg in logs
    ]


@router.post("/diplomas/claim")
def claim_diploma(
    body: ClaimDiplomaBody,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    want_name = _norm_name(body.graduate_full_name)
    d = (
        db.query(Diploma)
        .filter(
            Diploma.registration_number == body.registration_number.strip(),
            Diploma.status == DiplomaStatus.active,
        )
        .all()
    )
    matches = [x for x in d if _norm_name(x.graduate_full_name) == want_name]
    if not matches:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Диплом не найден или неверные ФИО/номер",
        )
    if len(matches) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Несколько совпадений — обратитесь в вуз",
        )
    dip = matches[0]
    if dip.student_user_id and dip.student_user_id != user.id:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Диплом уже привязан к другому аккаунту",
        )
    # Проверяем полную дату рождения если указана и диплом не содержит placeholder-дату
    if (
        body.birth_date is not None
        and dip.graduate_birth_date is not None
        and dip.graduate_birth_date.year != 1900
        and dip.graduate_birth_date != body.birth_date
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Диплом не найден или неверные данные",
        )
    dip.student_user_id = user.id
    db.commit()
    return {"status": "claimed", "diploma_id": str(dip.id)}


@router.post("/diplomas/{diploma_id}/share")
def create_share_link(
    diploma_id: UUID,
    body: ShareLinkBody,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    d = (
        db.query(Diploma)
        .filter(Diploma.id == diploma_id, Diploma.student_user_id == user.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if d.status != DiplomaStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Diploma not active")

    until = set_share_expiry(db, d, valid_hours=body.valid_hours, recipient=body.recipient)
    url = f"{PUBLIC_DIPLOMA_URL_BASE.rstrip('/')}/{d.certificate_token}"
    return {
        "verification_url": url,
        "employer_link_valid_until": until.isoformat(),
        "valid_hours": body.valid_hours,
        "recipient": body.recipient,
    }


@router.get("/diplomas/{diploma_id}/qr.png")
def diploma_qr_png(
    diploma_id: UUID,
    db: Session = Depends(get_db),
    user: User = Depends(require_student),
):
    d = (
        db.query(Diploma)
        .filter(Diploma.id == diploma_id, Diploma.student_user_id == user.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    if d.status != DiplomaStatus.active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Diploma not active")

    if not d.employer_link_valid_until:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Сначала создайте ссылку для работодателя (POST .../share)",
        )

    url = f"{PUBLIC_DIPLOMA_URL_BASE.rstrip('/')}/{d.certificate_token}"
    img = qrcode.make(url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)
    return StreamingResponse(buf, media_type="image/png")
