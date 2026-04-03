import hashlib
import hmac
import json
from datetime import date
from uuid import UUID

from app.utils.config import SECRET_KEY


def _signing_key_for_university(university_id: UUID) -> bytes:
    return hashlib.sha256(
        f"{SECRET_KEY}:{university_id}".encode("utf-8"),
    ).digest()


def canonical_payload(
    *,
    university_id: UUID,
    registration_number: str,
    graduate_full_name: str,
    issue_date: date,
    serial_number: str,
) -> str:
    payload = {
        "university_id": str(university_id),
        "registration_number": registration_number.strip().lower(),
        "graduate_full_name": graduate_full_name.strip().lower(),
        "issue_date": issue_date.isoformat(),
        "serial_number": serial_number.strip(),
    }
    return json.dumps(payload, sort_keys=True, ensure_ascii=False)


def compute_data_hash(**kwargs) -> str:
    raw = canonical_payload(**kwargs)
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def issuer_signature_hmac(university_id: UUID, data_hash_hex: str) -> str:
    key = _signing_key_for_university(university_id)
    return hmac.new(key, data_hash_hex.encode("ascii"), hashlib.sha256).hexdigest()


def verify_issuer_signature(
    university_id: UUID, data_hash_hex: str, signature_hex: str
) -> bool:
    expected = issuer_signature_hmac(university_id, data_hash_hex)
    return hmac.compare_digest(expected, signature_hex)
