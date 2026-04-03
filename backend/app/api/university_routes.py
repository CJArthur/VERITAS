from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.api.schemas import ManualDiplomaIn
from app.api.services.bulk_diploma_import import import_diplomas_from_upload
from app.api.services.diploma_ops import create_diploma_minimal, revoke_diploma
from app.api.services.diploma_crypto import verify_issuer_signature
from app.db.models import Diploma, DiplomaStatus, University, User
from app.db.postgres import get_db
from app.utils.role_deps import get_approved_university_staff

router = APIRouter(prefix="/university", tags=["University"])


def _norm(s: str) -> str:
    return " ".join(s.lower().split())


@router.post("/diplomas/bulk-upload")
async def bulk_upload_diplomas(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    return await import_diplomas_from_upload(db, uni, file)


@router.get("/diplomas/search")
def search_diplomas(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    term = f"%{q.strip()}%"
    rows = (
        db.query(Diploma)
        .filter(Diploma.university_id == uni.id)
        .filter(
            or_(
                Diploma.registration_number.ilike(term),
                Diploma.graduate_full_name.ilike(term),
            )
        )
        .order_by(Diploma.created_at.desc())
        .limit(50)
        .all()
    )
    return [
        {
            "id": str(d.id),
            "registration_number": d.registration_number,
            "graduate_full_name": d.graduate_full_name,
            "study_end_year": d.study_end_year,
            "status": d.status.value,
            "student_user_id": str(d.student_user_id) if d.student_user_id else None,
        }
        for d in rows
    ]


@router.post("/diplomas/manual")
def add_diploma_manual(
    body: ManualDiplomaIn,
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    d = create_diploma_minimal(
        db,
        university=uni,
        graduate_full_name=body.graduate_full_name,
        year=body.year,
        specialty_name=body.specialty_name,
        diploma_number=body.diploma_number,
    )
    return {"id": str(d.id), "certificate_token": str(d.certificate_token)}


@router.post("/diplomas/{diploma_id}/revoke")
def revoke(
    diploma_id: UUID,
    reason: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    d = (
        db.query(Diploma)
        .filter(Diploma.id == diploma_id, Diploma.university_id == uni.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Diploma not found")
    revoke_diploma(db, d, reason=reason)
    return {"status": "revoked"}


@router.get("/diplomas/{diploma_id}/verify-record")
def verify_signature(
    diploma_id: UUID,
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    d = (
        db.query(Diploma)
        .options(joinload(Diploma.university))
        .filter(Diploma.id == diploma_id, Diploma.university_id == uni.id)
        .first()
    )
    if not d or not d.issuer_signature:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    ok = verify_issuer_signature(uni.id, d.data_hash, d.issuer_signature)
    return {"signature_valid": ok, "data_hash": d.data_hash}
