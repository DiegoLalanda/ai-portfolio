"""Clasificación y logging de fallos al llamar a Gemini."""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

RATE_LIMIT_HINT = "Cuota o límite de Gemini alcanzado. Reintentá en unos segundos."


def error_summary(error: BaseException, *, max_len: int = 240) -> str:
    text = str(error).replace("\n", " ").strip()
    if len(text) > max_len:
        return text[: max_len - 3] + "..."
    return text


def is_rate_limit_error(error: BaseException) -> bool:
    text = str(error).casefold()
    if "resource_exhausted" in text or "quota exceeded" in text:
        return True
    code = getattr(error, "code", None)
    if code is not None and str(code).endswith("RESOURCE_EXHAUSTED"):
        return True
    status = getattr(error, "status", None)
    return status == "RESOURCE_EXHAUSTED"


def is_retriable_capacity_error(error: BaseException) -> bool:
    """429/cuota, 503 overloaded, alta demanda — candidato a API key fallback."""

    if is_rate_limit_error(error):
        return True
    text = str(error).casefold()
    markers = (
        "high demand",
        "alta demanda",
        "overloaded",
        "unavailable",
        "try again later",
        "intente de nuevo",
        "503",
    )
    if any(marker in text for marker in markers):
        return True
    code = getattr(error, "code", None)
    if code is not None and "UNAVAILABLE" in str(code).upper():
        return True
    return getattr(error, "status", None) == "UNAVAILABLE"


def log_llm_timeout(*, call_site: str, mode: str, limit_s: float) -> None:
    logger.warning(
        "LLM timeout call_site=%s mode=%s limit_s=%.1f",
        call_site or "unknown",
        mode,
        limit_s,
    )


def log_llm_failure(
    error: BaseException,
    *,
    call_site: str,
    mode: str,
    limit_s: float | None = None,
) -> None:
    extra = f" limit_s={limit_s:.1f}" if limit_s is not None else ""
    if is_retriable_capacity_error(error):
        logger.warning(
            "Gemini capacity limit call_site=%s mode=%s%s detail=%s",
            call_site or "unknown",
            mode,
            extra,
            error_summary(error),
        )
        return
    logger.error(
        "Gemini error call_site=%s mode=%s%s detail=%s",
        call_site or "unknown",
        mode,
        extra,
        error_summary(error),
        exc_info=True,
    )
