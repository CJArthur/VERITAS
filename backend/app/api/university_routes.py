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
    UniversityProfilePatch,
    UniversityInfo,
)
from app.api.services.bulk_diploma_import import import_diplomas_from_upload
from app.api.services.diploma_ops import create_diploma_minimal, revoke_diploma
from app.api.services.diploma_crypto import verify_issuer_signature
from app.db.models import Diploma, DiplomaStatus, University, User, VerificationLog
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
        birth_year=body.birth_year,
        year=body.year,
        specialty_name=body.specialty_name,
        diploma_number=body.diploma_number,
        qualification=body.qualification,
        document_type=body.document_type,
        issuer_name=body.issuer_name,
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
        .options(joinedload(Diploma.university))
        .filter(Diploma.id == diploma_id, Diploma.university_id == uni.id)
        .first()
    )
    if not d or not d.issuer_signature:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    ok = verify_issuer_signature(uni.id, d.data_hash, d.issuer_signature)
    return {"signature_valid": ok, "data_hash": d.data_hash}


@router.get("/diplomas", response_model=list[DiplomaListItem])
def list_diplomas(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    rows = (
        db.query(Diploma)
        .filter(Diploma.university_id == uni.id)
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
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    d = (
        db.query(Diploma)
        .options(
            joinedload(Diploma.subjects),
            joinedload(Diploma.logs),
            joinedload(Diploma.university),
        )
        .filter(Diploma.id == diploma_id, Diploma.university_id == uni.id)
        .first()
    )
    if not d:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    sig_ok = False
    if d.issuer_signature:
        sig_ok = verify_issuer_signature(uni.id, d.data_hash, d.issuer_signature)

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
        university_name=d.university.name if d.university else "",
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
    )


@router.get("/analytics", summary="University verification analytics")
def university_analytics(
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    now = datetime.now(timezone.utc)
    thirty_days_ago = now - timedelta(days=30)
    week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)

    # Daily verification counts (last 30 days) — fill gaps with zero
    daily_rows = (
        db.query(
            cast(VerificationLog.verified_at, Date).label("day"),
            func.count(VerificationLog.id).label("cnt"),
        )
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(
            Diploma.university_id == uni.id,
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

    # This week vs last week
    this_week = (
        db.query(func.count(VerificationLog.id))
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.university_id == uni.id, VerificationLog.verified_at >= week_start)
        .scalar() or 0
    )
    last_week = (
        db.query(func.count(VerificationLog.id))
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(
            Diploma.university_id == uni.id,
            VerificationLog.verified_at >= last_week_start,
            VerificationLog.verified_at < week_start,
        )
        .scalar() or 0
    )
    growth = round((this_week - last_week) / max(last_week, 1) * 100) if last_week else None

    # Top verifying organizations (from employer API keys)
    top_verifiers = (
        db.query(
            VerificationLog.verifier_org_name,
            func.count(VerificationLog.id).label("cnt"),
        )
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(
            Diploma.university_id == uni.id,
            VerificationLog.verifier_org_name.isnot(None),
        )
        .group_by(VerificationLog.verifier_org_name)
        .order_by(func.count(VerificationLog.id).desc())
        .limit(8)
        .all()
    )

    # Total all time
    total = (
        db.query(func.count(VerificationLog.id))
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.university_id == uni.id)
        .scalar() or 0
    )

    # Recent activity feed (last 15)
    recent = (
        db.query(VerificationLog)
        .join(Diploma, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.university_id == uni.id)
        .order_by(VerificationLog.verified_at.desc())
        .limit(15)
        .all()
    )

    # Most verified diplomas
    top_diplomas = (
        db.query(
            Diploma.graduate_full_name,
            Diploma.specialty_name,
            func.count(VerificationLog.id).label("cnt"),
        )
        .join(VerificationLog, VerificationLog.diploma_id == Diploma.id)
        .filter(Diploma.university_id == uni.id)
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
        "top_verifiers": [
            {"org_name": v.verifier_org_name, "count": v.cnt} for v in top_verifiers
        ],
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


@router.get("/profile", response_model=UniversityInfo)
def get_university_profile(
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    return uni


@router.patch("/profile", response_model=UniversityInfo)
def update_university_profile(
    body: UniversityProfilePatch,
    db: Session = Depends(get_db),
    ctx: tuple[User, University] = Depends(get_approved_university_staff),
):
    _, uni = ctx
    if body.avatar_url is not None:
        uni.avatar_url = body.avatar_url
    if body.banner_url is not None:
        uni.banner_url = body.banner_url
    db.commit()
    db.refresh(uni)
    return uni
