from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.schemas import RejectUniversityBody
from app.db.models import University, UniversityApprovalStatus, User
from app.db.postgres import get_db
from app.utils.role_deps import require_super_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/universities/pending")
def list_pending_universities(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    rows = (
        db.query(University)
        .filter(University.approval_status == UniversityApprovalStatus.pending)
        .order_by(University.created_at.asc())
        .all()
    )
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "ogrn": r.ogrn,
            "license_number": r.license_number,
            "accreditation_number": r.accreditation_number,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.post("/universities/{university_id}/approve")
def approve_university(
    university_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if uni.approval_status != UniversityApprovalStatus.pending:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Not pending")
    uni.approval_status = UniversityApprovalStatus.approved
    uni.rejection_reason = None
    db.commit()
    return {"status": "approved", "university_id": str(uni.id)}


@router.post("/universities/{university_id}/reject")
def reject_university(
    university_id: UUID,
    body: RejectUniversityBody,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    uni.approval_status = UniversityApprovalStatus.rejected
    uni.rejection_reason = body.reason
    db.commit()
    return {"status": "rejected", "university_id": str(uni.id)}
