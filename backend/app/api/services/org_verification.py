"""
Автоматическая верификация организаций при регистрации на платформе.

Уровни проверки (выполняются последовательно, каждый следующий — если предыдущий прошёл):

1. Формат ОГРН — проверка контрольной суммы по алгоритму ФНС (без сетевых запросов).
2. DaData API — поиск компании в ЕГРЮЛ/ЕГРИП, получение наименования, ИНН и статуса.
   Требует DADATA_API_KEY в конфигурации. Если ключа нет — этот шаг пропускается.
3. Ссылки для ручной проверки — формируются автоматически (ФНС, Рособрнадзор).
   Администратор видит прямые ссылки и подтверждает одним кликом.

Принцип: человек остаётся в финальном решении (одобрить / отклонить),
но рутинный поиск в реестрах полностью автоматизирован.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Optional

import httpx


# ---------------------------------------------------------------------------
# Результаты проверки
# ---------------------------------------------------------------------------

@dataclass
class OgrnCheckResult:
    """Результат проверки ОГРН."""
    checksum_valid: bool          # контрольная сумма верна математически
    found_in_egrul: bool = False  # найдена в ЕГРЮЛ через DaData
    company_name: Optional[str] = None
    inn: Optional[str] = None
    is_active: bool = False       # не ликвидирована / не банкрот
    dadata_used: bool = False     # был ли выполнен запрос к DaData
    error: Optional[str] = None


@dataclass
class OrgVerificationReport:
    """Итоговый отчёт для администратора."""
    ogrn: OgrnCheckResult
    # Ссылки для ручной финальной проверки
    fns_url: str                        # ФНС ЕГРЮЛ
    rosobr_license_url: str             # Рособрнадзор: реестр лицензий по ОГРН
    rosobr_accred_url: str              # Рособрнадзор: реестр аккредитаций
    # Итоговая рекомендация (не обязывает, только подсказка)
    recommendation: str = "manual_review"  # "approve" | "reject" | "manual_review"
    recommendation_reason: str = ""


# ---------------------------------------------------------------------------
# 1. Контрольная сумма ОГРН (алгоритм ФНС, без сетевых запросов)
# ---------------------------------------------------------------------------

def validate_ogrn_checksum(ogrn: str) -> bool:
    """
    Проверяет контрольную сумму ОГРН.
    - Юридическое лицо: 13 цифр, делитель 11
    - ИП: 15 цифр, делитель 13
    https://www.nalog.gov.ru/rn77/related_activities/statistics_and_analytics/forms/
    """
    ogrn = ogrn.strip()
    if not ogrn.isdigit():
        return False
    if len(ogrn) == 13:
        base = int(ogrn[:-1])
        expected = (base % 11) % 10
        return expected == int(ogrn[-1])
    if len(ogrn) == 15:  # ОГРНИП
        base = int(ogrn[:-1])
        expected = (base % 13) % 10
        return expected == int(ogrn[-1])
    return False


# ---------------------------------------------------------------------------
# 2. DaData API — поиск в ЕГРЮЛ/ЕГРИП
# ---------------------------------------------------------------------------

_DADATA_ENDPOINT = "https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party"


async def _lookup_dadata(ogrn: str, api_key: str) -> OgrnCheckResult:
    """
    Ищет организацию в ЕГРЮЛ через DaData.
    Возвращает OgrnCheckResult с данными из реестра.
    Свободный тариф: 10 000 запросов/мес.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                _DADATA_ENDPOINT,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Token {api_key}",
                    "Accept": "application/json",
                },
                json={"query": ogrn, "count": 1},
            )
    except httpx.TimeoutException:
        return OgrnCheckResult(
            checksum_valid=validate_ogrn_checksum(ogrn),
            dadata_used=True,
            error="DaData timeout — проверьте ОГРН вручную через ФНС",
        )
    except httpx.RequestError as exc:
        return OgrnCheckResult(
            checksum_valid=validate_ogrn_checksum(ogrn),
            dadata_used=True,
            error=f"DaData недоступна: {exc}",
        )

    if resp.status_code == 401:
        return OgrnCheckResult(
            checksum_valid=validate_ogrn_checksum(ogrn),
            dadata_used=True,
            error="Неверный DADATA_API_KEY",
        )

    if resp.status_code != 200:
        return OgrnCheckResult(
            checksum_valid=validate_ogrn_checksum(ogrn),
            dadata_used=True,
            error=f"DaData вернула {resp.status_code}",
        )

    suggestions = resp.json().get("suggestions", [])
    if not suggestions:
        return OgrnCheckResult(
            checksum_valid=validate_ogrn_checksum(ogrn),
            found_in_egrul=False,
            dadata_used=True,
        )

    s = suggestions[0]
    data = s.get("data", {})
    state = data.get("state", {})
    status = state.get("status", "")  # ACTIVE | LIQUIDATING | LIQUIDATED | BANKRUPT | REORGANIZING

    return OgrnCheckResult(
        checksum_valid=True,  # если нашли — формат точно верен
        found_in_egrul=True,
        company_name=s.get("value"),
        inn=data.get("inn"),
        is_active=status == "ACTIVE",
        dadata_used=True,
        error=None if status == "ACTIVE" else f"Статус в ЕГРЮЛ: {status}",
    )


# ---------------------------------------------------------------------------
# 3. Публичный интерфейс
# ---------------------------------------------------------------------------

async def verify_organization(
    ogrn: str,
    dadata_api_key: Optional[str] = None,
) -> OrgVerificationReport:
    """
    Запускает автоматическую проверку организации по ОГРН.

    Args:
        ogrn: ОГРН организации (13 или 15 цифр).
        dadata_api_key: API-ключ DaData. Если не задан — только контрольная сумма.

    Returns:
        OrgVerificationReport с результатами и рекомендацией для администратора.
    """
    ogrn_clean = ogrn.strip()

    # Шаг 1: математическая проверка
    checksum_ok = validate_ogrn_checksum(ogrn_clean)

    if not checksum_ok:
        ogrn_result = OgrnCheckResult(checksum_valid=False)
        recommendation = "reject"
        reason = "ОГРН не прошёл проверку контрольной суммы — скорее всего введён некорректно"
    elif dadata_api_key:
        # Шаг 2: поиск в ЕГРЮЛ через DaData
        ogrn_result = await _lookup_dadata(ogrn_clean, dadata_api_key)
        if ogrn_result.found_in_egrul and ogrn_result.is_active:
            recommendation = "approve"
            reason = f"ОГРН подтверждён в ЕГРЮЛ: {ogrn_result.company_name or ogrn_clean}"
        elif ogrn_result.found_in_egrul and not ogrn_result.is_active:
            recommendation = "reject"
            reason = f"Организация найдена в ЕГРЮЛ, но не активна ({ogrn_result.error})"
        elif ogrn_result.error:
            recommendation = "manual_review"
            reason = ogrn_result.error
        else:
            recommendation = "reject"
            reason = "ОГРН не найден в ЕГРЮЛ — организация не зарегистрирована"
    else:
        # DaData не настроен — только контрольная сумма
        ogrn_result = OgrnCheckResult(checksum_valid=True, dadata_used=False)
        recommendation = "manual_review"
        reason = "Контрольная сумма ОГРН верна. Добавьте DADATA_API_KEY для автоматической проверки в ЕГРЮЛ"

    return OrgVerificationReport(
        ogrn=ogrn_result,
        fns_url=f"https://egrul.nalog.ru/?query={ogrn_clean}",
        rosobr_license_url=f"https://islod.obrnadzor.gov.ru/licreestr/?ogrn={ogrn_clean}",
        rosobr_accred_url=f"https://islod.obrnadzor.gov.ru/accredreestr/?ogrn={ogrn_clean}",
        recommendation=recommendation,
        recommendation_reason=reason,
    )
