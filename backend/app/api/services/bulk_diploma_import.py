import csv
import io
import re
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.services.diploma_ops import create_diploma_minimal
from app.db.models import University


def _norm_header(h: str) -> str:
    return re.sub(r"\s+", " ", (h or "").strip().lower())


def _row_get(row: dict[str, Any], *keys: str) -> str | None:
    lower = {_norm_header(k): v for k, v in row.items()}
    for key in keys:
        k = key.lower()
        if k in lower and lower[k] not in (None, ""):
            return str(lower[k]).strip()
    return None


def import_diplomas_from_csv_text(
    db: Session,
    university: University,
    text: str,
) -> dict[str, Any]:
    """Ожидаемые колонки (любой регистр): ФИО / full_name, год / year,
    специальность / specialty, номер / number / registration_number."""
    f = io.StringIO(text)
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample)
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(f, dialect=dialect)
    created = 0
    errors: list[str] = []

    for i, row in enumerate(reader, start=2):
        name = _row_get(row, "фио", "full_name", "fio", "name")
        year_s = _row_get(row, "год", "year", "issue_year")
        spec = _row_get(row, "специальность", "specialty", "speciality")
        num = _row_get(row, "номер", "number", "registration_number", "diploma_number", "serial")

        if not all([name, year_s, spec, num]):
            errors.append(f"Строка {i}: не хватает колонок (нужны ФИО, год, специальность, номер)")
            continue
        try:
            year = int(float(year_s))
        except ValueError:
            errors.append(f"Строка {i}: некорректный год")
            continue

        try:
            create_diploma_minimal(
                db,
                university=university,
                graduate_full_name=name,
                year=year,
                specialty_name=spec,
                diploma_number=num,
            )
            created += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"Строка {i}: {e!s}")

    return {"created": created, "errors": errors}


async def import_diplomas_from_upload(
    db: Session,
    university: University,
    file: UploadFile,
) -> dict[str, Any]:
    name = (file.filename or "").lower()
    raw = await file.read()

    if name.endswith((".xlsx", ".xls")):
        try:
            import openpyxl
        except ImportError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Для загрузки Excel установите пакет openpyxl",
            ) from e
        wb = openpyxl.load_workbook(io.BytesIO(raw), read_only=True, data_only=True)
        ws = wb.active
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            return {"created": 0, "errors": ["Пустой файл"]}
        headers = [str(c or "").strip() for c in rows[0]]
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=headers)
        w.writeheader()
        for line in rows[1:]:
            row_dict = {}
            for i, h in enumerate(headers):
                row_dict[h] = line[i] if i < len(line) else None
            w.writerow(row_dict)
        return import_diplomas_from_csv_text(db, university, buf.getvalue())

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("cp1251", errors="replace")
    return import_diplomas_from_csv_text(db, university, text)
