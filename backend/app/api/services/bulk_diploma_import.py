import csv
import io
import re
from datetime import date
from typing import Any

from fastapi import HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.api.services.diploma_ops import create_diploma_minimal
from app.db.models import Issuer


def _norm_header(h: str) -> str:
    return re.sub(r"\s+", " ", (h or "").strip().lower())


def _row_get(row: dict[str, Any], *keys: str) -> str | None:
    lower = {_norm_header(k): v for k, v in row.items()}
    for key in keys:
        k = key.lower()
        if k in lower and lower[k] not in (None, ""):
            return str(lower[k]).strip()
    return None


def _parse_iso_date(s: str, row_num: int, field: str) -> date | None:
    """Parse ISO date string YYYY-MM-DD. Returns None and adds no error — caller decides."""
    try:
        return date.fromisoformat(s)
    except ValueError:
        return None


def import_diplomas_from_csv_text(
    db: Session,
    issuer: Issuer,
    text: str,
) -> dict[str, Any]:
    """Ожидаемые колонки (любой регистр): ФИО / full_name, birth_date (ISO) / birth_year (int,
    backward-compat), study_end_year / year, специальность / specialty, номер / number /
    registration_number, gpa (optional), specialty_code (optional), issue_date (optional ISO)."""
    f = io.StringIO(text)
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample)
    except csv.Error:
        dialect = csv.excel
    reader = csv.DictReader(f, dialect=dialect)
    created = 0
    errors: list[str] = []
    warnings: list[str] = []

    for i, row in enumerate(reader, start=2):
        name = _row_get(row, "фио", "full_name", "fio", "name")
        spec = _row_get(row, "специальность", "specialty", "speciality")
        num = _row_get(row, "номер", "number", "registration_number", "diploma_number", "serial")

        # study_end_year: prefer study_end_year, fall back to year
        year_s = _row_get(row, "study_end_year", "год", "year", "issue_year")

        # birth_date: prefer birth_date (ISO), fall back to birth_year (int, backward compat)
        birth_date_s = _row_get(row, "birth_date", "дата_рождения")
        birth_year_s = _row_get(row, "birth_year", "год_рождения")

        # gpa (optional)
        gpa_s = _row_get(row, "gpa", "средний_балл")

        # specialty_code (optional)
        specialty_code_s = _row_get(row, "specialty_code", "код_специальности") or ""

        # issue_date (optional ISO)
        issue_date_s = _row_get(row, "issue_date", "дата_выдачи")

        if not all([name, year_s, spec, num]):
            errors.append(f"Строка {i}: не хватает колонок (нужны ФИО, год/study_end_year, специальность, номер)")
            continue

        # Parse study_end_year
        try:
            study_end_year = int(float(year_s))
        except ValueError:
            errors.append(f"Строка {i}: некорректный год окончания")
            continue

        # Parse birth_date
        birth_date: date | None = None
        if birth_date_s:
            birth_date = _parse_iso_date(birth_date_s, i, "birth_date")
            if birth_date is None:
                errors.append(f"Строка {i}: некорректный формат birth_date (ожидается YYYY-MM-DD)")
                continue
        elif birth_year_s:
            try:
                birth_year = int(float(birth_year_s))
                birth_date = date(birth_year, 1, 1)
                warnings.append(f"Строка {i}: использован устаревший столбец birth_year, преобразован в {birth_date.isoformat()}")
            except (ValueError, OverflowError):
                errors.append(f"Строка {i}: некорректный birth_year")
                continue
        else:
            errors.append(f"Строка {i}: не хватает birth_date или birth_year")
            continue

        # Parse gpa
        gpa: float = 0.0
        if gpa_s:
            try:
                gpa = float(gpa_s)
            except ValueError:
                warnings.append(f"Строка {i}: некорректный gpa '{gpa_s}', использовано 0.0")
        else:
            warnings.append(f"Строка {i}: отсутствует gpa, использовано 0.0")

        # Parse issue_date (optional)
        issue_date: date | None = None
        if issue_date_s:
            issue_date = _parse_iso_date(issue_date_s, i, "issue_date")
            if issue_date is None:
                warnings.append(f"Строка {i}: некорректный формат issue_date '{issue_date_s}', поле проигнорировано")

        try:
            create_diploma_minimal(
                db,
                issuer=issuer,
                graduate_full_name=name,
                birth_date=birth_date,
                study_end_year=study_end_year,
                specialty_name=spec,
                specialty_code=specialty_code_s,
                diploma_number=num,
                gpa=gpa,
                issue_date=issue_date,
            )
            created += 1
        except Exception as e:  # noqa: BLE001
            errors.append(f"Строка {i}: {e!s}")

    return {"created": created, "errors": errors, "warnings": warnings}


async def import_diplomas_from_upload(
    db: Session,
    issuer: Issuer,
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
            return {"created": 0, "errors": ["Пустой файл"], "warnings": []}
        headers = [str(c or "").strip() for c in rows[0]]
        buf = io.StringIO()
        w = csv.DictWriter(buf, fieldnames=headers)
        w.writeheader()
        for line in rows[1:]:
            row_dict = {}
            for i, h in enumerate(headers):
                row_dict[h] = line[i] if i < len(line) else None
            w.writerow(row_dict)
        return import_diplomas_from_csv_text(db, issuer, buf.getvalue())

    try:
        text = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        text = raw.decode("cp1251", errors="replace")
    return import_diplomas_from_csv_text(db, issuer, text)
