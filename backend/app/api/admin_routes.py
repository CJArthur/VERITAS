import hashlib
import secrets
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func as sqlfunc
from sqlalchemy.orm import Session

from app.api.schemas import RejectUniversityBody
from app.api.services.org_verification import validate_ogrn_checksum, verify_organization
from app.db.models import Diploma, EmployerApiKey, University, UniversityApprovalStatus, User, VerificationLog
from app.db.postgres import get_db
from app.settings import SETTINGS
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


@router.get("/universities/{university_id}/verify", summary="Auto-verify organization via OGRN registries")
async def auto_verify_university(
    university_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    """
    Автоматически проверяет ОГРН организации:
    1. Контрольная сумма (без сетевых запросов)
    2. Поиск в ЕГРЮЛ через DaData (если настроен DADATA_API_KEY)
    3. Возвращает ссылки на Рособрнадзор для проверки лицензии и аккредитации.
    """
    uni = db.query(University).filter(University.id == university_id).first()
    if not uni:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    report = await verify_organization(
        ogrn=uni.ogrn,
        dadata_api_key=SETTINGS.DADATA_API_KEY,
    )

    return {
        "university_id": str(uni.id),
        "university_name": uni.name,
        "ogrn": uni.ogrn,
        "license_number": uni.license_number,
        "accreditation_number": uni.accreditation_number,
        # --- ОГРН ---
        "ogrn_checksum_valid": report.ogrn.checksum_valid,
        "ogrn_found_in_egrul": report.ogrn.found_in_egrul,
        "ogrn_verified_name": report.ogrn.company_name,
        "ogrn_inn": report.ogrn.inn,
        "ogrn_is_active": report.ogrn.is_active,
        "ogrn_dadata_used": report.ogrn.dadata_used,
        "ogrn_error": report.ogrn.error,
        # --- Ссылки для ручной проверки ---
        "fns_url": report.fns_url,
        "rosobr_license_url": report.rosobr_license_url,
        "rosobr_accred_url": report.rosobr_accred_url,
        # --- Итог ---
        "recommendation": report.recommendation,
        "recommendation_reason": report.recommendation_reason,
    }


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
    if not validate_ogrn_checksum(uni.ogrn):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Невозможно одобрить: ОГРН не прошёл проверку контрольной суммы по алгоритму ФНС. Свяжитесь с организацией для уточнения данных.",
        )
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


@router.post("/employer-keys", summary="Generate employer API key")
def create_employer_api_key(
    org_name: str,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    raw_key = secrets.token_urlsafe(32)
    key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
    api_key = EmployerApiKey(org_name=org_name, key_hash=key_hash)
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    # Return raw key ONCE — not stored, cannot be recovered
    return {
        "id": str(api_key.id),
        "org_name": api_key.org_name,
        "api_key": raw_key,
        "warning": "Save this key now. It will not be shown again.",
        "created_at": api_key.created_at.isoformat() if api_key.created_at else None,
    }


@router.get("/employer-keys", summary="List employer API keys")
def list_employer_api_keys(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    keys = (
        db.query(EmployerApiKey)
        .order_by(EmployerApiKey.created_at.desc())
        .all()
    )
    return [
        {
            "id": str(k.id),
            "org_name": k.org_name,
            "is_active": k.is_active,
            "created_at": k.created_at.isoformat() if k.created_at else None,
            "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
        }
        for k in keys
    ]


@router.get("/universities", summary="List all universities")
def list_all_universities(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    rows = db.query(University).order_by(University.created_at.desc()).all()
    return [
        {
            "id": str(r.id),
            "name": r.name,
            "ogrn": r.ogrn,
            "license_number": r.license_number,
            "accreditation_number": r.accreditation_number,
            "approval_status": r.approval_status.value,
            "rejection_reason": r.rejection_reason,
            "avatar_url": r.avatar_url,
            "diploma_count": len(r.diplomas),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.get("/stats", summary="Platform statistics")
def platform_stats(
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    total_unis = db.query(sqlfunc.count(University.id)).scalar() or 0
    approved_unis = (
        db.query(sqlfunc.count(University.id))
        .filter(University.approval_status == UniversityApprovalStatus.approved)
        .scalar() or 0
    )
    total_diplomas = db.query(sqlfunc.count(Diploma.id)).scalar() or 0
    total_verifications = db.query(sqlfunc.count(VerificationLog.id)).scalar() or 0
    return {
        "total_universities": total_unis,
        "approved_universities": approved_unis,
        "total_diplomas": total_diplomas,
        "total_verifications": total_verifications,
    }


@router.delete("/employer-keys/{key_id}", summary="Revoke employer API key")
def revoke_employer_api_key(
    key_id: UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_super_admin),
):
    key = db.query(EmployerApiKey).filter(EmployerApiKey.id == key_id).first()
    if not key:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Key not found")
    key.is_active = False
    db.commit()
    return {"status": "revoked", "org_name": key.org_name}
