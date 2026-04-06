from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from sqlalchemy import Date, cast, func, or_
from sqlalchemy.orm import Session, joinedload

from app.api.schemas import (
    ManualDiplomaIn,
    DiplomaListItem,
    DiplomaDetail,
    SubjectOut,
    VerificationLogOut,
    IssuerProfilePatch,
    IssuerInfo,
)
from app.api.services.bulk_diploma_import import import_diplomas_from_upload
from app.api.services.diploma_ops import create_diploma_minimal, revoke_diploma
from app.api.services.diploma_crypto import verify_issuer_signature
from app.api.services.blockchain_service import blockchain_service
from app.db.models import Diploma, DiplomaStatus, Issuer, User, VerificationLog
from app.db.postgres import get_db
from app.utils.role_deps import get_approved_university_staff

router = APIRouter(prefix="/issuer", tags=["Issuer"])


def _blockchain_status(d: Diploma) -> str:
    if d.blockchain_tx_hash:
        return "anchored"
    if blockchain_service.is_configured():
        return "pending"
    return "not_configured"


@router.post("/diplomas/bulk-upload")
async def bulk_upload_diplomas(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    return await import_diplomas_from_upload(db, issuer, file)


@router.get("/diplomas/search")
def search_diplomas(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    term = f"%{q.strip()}%"
    rows = (
        db.query(Diploma)
        .filter(Diploma.issuer_id == issuer.id)
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
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    d = create_diploma_minimal(
        db,
        issuer=issuer,
        graduate_full_name=body.graduate_full_name,
        birth_date=body.birth_date,
        study_end_year=body.study_end_year,
        specialty_name=body.specialty_name,
        specialty_code=body.specialty_code or "",
        diploma_number=body.diploma_number,
        gpa=body.gpa,
        qualification=body.qualification,
        document_type=body.document_type,
        issuer_name=body.issuer_name,
        issue_date=body.issue_date,
    )
    return {"id": str(d.id), "certificate_token": str(d.certificate_token)}


@router.get("/diplomas/{diploma_id}/gpa-from-transcript")
def gpa_from_transcript(
    diploma_id: UUID,
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    """Compute average grade from uploaded transcript subjects, scaled to 5.0."""
    _, issuer = ctx
    d = (
        db.query(Diploma)
        .options(joinedload(Diploma.subjects))
        .filter(Diploma.id == diploma_id, Diploma.issuer_id == issuer.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if not d.subjects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No transcript subjects uploaded for this diploma",
        )
    avg = sum(s.grade for s in d.subjects) / len(d.subjects)
    return {"gpa": round(avg, 2), "subject_count": len(d.subjects)}


@router.post("/diplomas/{diploma_id}/revoke")
def revoke(
    diploma_id: UUID,
    reason: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    d = (
        db.query(Diploma)
        .filter(Diploma.id == diploma_id, Diploma.issuer_id == issuer.id)
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
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    d = (
        db.query(Diploma)
        .options(joinedload(Diploma.issuer))
        .filter(Diploma.id == diploma_id, Diploma.issuer_id == issuer.id)
        .first()
    )
    if not d or not d.issuer_signature:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    ok = verify_issuer_signature(issuer.id, d.data_hash, d.issuer_signature)
    return {"signature_valid": ok, "data_hash": d.data_hash}


@router.get("/diplomas", response_model=list[DiplomaListItem])
def list_diplomas(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    rows = (
        db.query(Diploma)
        .filter(Diploma.issuer_id == issuer.id)
        .order_by(Diploma.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        DiplomaListItem(
            id=d.id,
            registration_number=d.registration_number,
            graduate_full_name=d.graduate_full_name,
            specialty_name=d.specialty_name,
            study_end_year=d.study_end_year,
            status=d.status.value,
            certificate_token=d.certificate_token,
            student_user_id=d.student_user_id,
            created_at=d.created_at.isoformat(),
        )
        for d in rows
    ]


@router.get("/diplomas/{diploma_id}", response_model=DiplomaDetail)
def get_diploma_detail(
    diploma_id: UUID,
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    d = (
        db.query(Diploma)
        .options(
            joinedload(Diploma.subjects),
            joinedload(Diploma.logs),
            joinedload(Diploma.issuer),
        )
        .filter(Diploma.id == diploma_id, Diploma.issuer_id == issuer.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    sig_ok = False
    if d.issuer_signature:
        sig_ok = verify_issuer_signature(issuer.id, d.data_hash, d.issuer_signature)

    return DiplomaDetail(
        id=d.id,
        registration_number=d.registration_number,
        serial_number=d.serial_number,
        graduate_full_name=d.graduate_full_name,
        specialty_name=d.specialty_name,
        specialty_code=d.specialty_code,
        study_start_year=d.study_start_year,
        study_end_year=d.study_end_year,
        issue_date=d.issue_date.isoformat(),
        gpa=float(d.gpa),
        status=d.status.value,
        revoke_reason=d.revoke_reason,
        certificate_token=d.certificate_token,
        data_hash=d.data_hash,
        signature_valid=sig_ok,
        university_name=d.issuer.name if d.issuer else "",
        student_user_id=d.student_user_id,
        employer_link_valid_until=(
            d.employer_link_valid_until.isoformat() if d.employer_link_valid_until else None
        ),
        subjects=[
            SubjectOut(
                subject_name=s.subject_name,
                hours=s.hours,
                credits=s.credits,
                grade=s.grade,
                semester=s.semester,
            )
            for s in d.subjects
        ],
        logs=[
            VerificationLogOut(
                verifier_type=lg.verifier_type,
                verifier_ip=lg.verifier_ip,
                verifier_org_name=lg.verifier_org_name,
                verified_at=lg.verified_at.isoformat(),
                result=lg.result,
            )
            for lg in d.logs
        ],
        created_at=d.created_at.isoformat(),
        blockchain_status=_blockchain_status(d),
        blockchain_tx_hash=d.blockchain_tx_hash,
        blockchain_anchored_at=(
            d.blockchain_anchored_at.isoformat() if d.blockchain_anchored_at else None
        ),
    )


@router.get("/analytics", summary="Issuer verification analytics")
def issuer_analytics(
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)

    daily_rows = (
        db.query(
            cast(VerificationLog.verified_at, Date).label("day"),
            func.count(VerificationLog.id).label("cnt"),
        )
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(
            Diploma.issuer_id == issuer.id,
            VerificationLog.verified_at >= thirty_days_ago,
        )
        .group_by(cast(VerificationLog.verified_at, Date))
        .all()
    )
    daily_map = {str(r.day): r.cnt for r in daily_rows}
    daily_counts = [
        {
            "date": str((now - timedelta(days=29 - i)).date()),
            "count": daily_map.get(str((now - timedelta(days=29 - i)).date()), 0),
        }
        for i in range(30)
    ]

    this_week = (
        db.query(func.count(VerificationLog.id))
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.issuer_id == issuer.id, VerificationLog.verified_at >= week_start)
        .scalar() or 0
    )
    last_week = (
        db.query(func.count(VerificationLog.id))
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(
            Diploma.issuer_id == issuer.id,
            VerificationLog.verified_at >= last_week_start,
            VerificationLog.verified_at < week_start,
        )
        .scalar() or 0
    )
    growth = round((this_week - last_week) / max(last_week, 1) * 100) if last_week else None

    top_verifiers = (
        db.query(
            VerificationLog.verifier_org_name,
            func.count(VerificationLog.id).label("cnt"),
        )
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(
            Diploma.issuer_id == issuer.id,
            VerificationLog.verifier_org_name.isnot(None),
        )
        .group_by(VerificationLog.verifier_org_name)
        .order_by(func.count(VerificationLog.id).desc())
        .limit(8)
        .all()
    )

    total = (
        db.query(func.count(VerificationLog.id))
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.issuer_id == issuer.id)
        .scalar() or 0
    )

    recent = (
        db.query(VerificationLog)
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.issuer_id == issuer.id)
        .order_by(VerificationLog.verified_at.desc())
        .limit(15)
        .all()
    )

    top_diplomas = (
        db.query(
            Diploma.graduate_full_name,
            Diploma.specialty_name,
            func.count(VerificationLog.id).label("cnt"),
        )
        .join(VerificationLog, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.issuer_id == issuer.id)
        .group_by(Diploma.graduate_full_name, Diploma.specialty_name)
        .order_by(func.count(VerificationLog.id).desc())
        .limit(5)
        .all()
    )

    return {
        "total_verifications": total,
        "this_week": this_week,
        "last_week": last_week,
        "growth_percent": growth,
        "daily_counts": daily_counts,
        "top_verifiers": [{"org_name": v.verifier_org_name, "count": v.cnt} for v in top_verifiers],
        "top_diplomas": [
            {"name": d.graduate_full_name, "specialty": d.specialty_name, "count": d.cnt}
            for d in top_diplomas
        ],
        "recent_activity": [
            {
                "verifier_org": r.verifier_org_name,
                "verifier_type": r.verifier_type,
                "result": r.result,
                "verified_at": r.verified_at.isoformat(),
            }
            for r in recent
        ],
    }


@router.get("/profile", response_model=IssuerInfo)
def get_issuer_profile(
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    return issuer


@router.patch("/profile", response_model=IssuerInfo)
def update_issuer_profile(
    body: IssuerProfilePatch,
    db: Session = Depends(get_db),
    ctx: tuple[User, Issuer] = Depends(get_approved_university_staff),
):
    _, issuer = ctx
    if body.avatar_url is not None:
        issuer.avatar_url = body.avatar_url
    if body.banner_url is not None:
        issuer.banner_url = body.banner_url
    db.commit()
    db.refresh(issuer)
    return issuer
