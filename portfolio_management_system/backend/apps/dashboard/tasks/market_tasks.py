from __future__ import annotations

from typing import Iterable, List

from celery import shared_task
from django.core.cache import cache
from django.db.models import Q

from apps.dashboard.models import StockHolding, Ticker
from apps.dashboard.services.market_schedule import (
    REFRESH_LOCK_CACHE_KEY,
    get_last_refresh,
    market_now,
    record_last_refresh,
    schedule_market_refresh_if_needed,
    should_refresh_market_data,
)
from apps.dashboard.services.ticker_sync import refresh_ticker_history


@shared_task(bind=True, name="apps.dashboard.tasks.market_tasks.capture_asx_market_snapshot")
def capture_asx_market_snapshot(self, trigger_reason: str = "manual"):
    """
    Refresh ASX market data for all tracked symbols.

    Includes safeguards to avoid duplicate concurrent updates and records the
    timestamp of the last successful run for catch-up scheduling.
    """
    now = market_now()
    last_refresh = get_last_refresh()

    if not should_refresh_market_data(
        last_refresh,
        now=now,
        allow_closed_catch_up=True,
    ):
        return {
            "skipped": True,
            "reason": "data is fresh",
            "last_refresh": last_refresh.isoformat() if last_refresh else None,
        }

    if not cache.add(REFRESH_LOCK_CACHE_KEY, trigger_reason, timeout=120):
        return {"skipped": True, "reason": "another refresh is already running"}

    try:
        symbols = _tracked_asx_symbols()
        if not symbols:
            return {"skipped": True, "reason": "no ASX symbols configured"}

        results = refresh_ticker_history(symbols)
        updated = [res.symbol for res in results if res.updated]
        skipped = [res.symbol for res in results if not res.updated and res.error is None]
        errors = [f"{res.symbol}: {res.error}" for res in results if res.error]

        record_last_refresh(now)

        return {
            "trigger": trigger_reason,
            "updated": updated,
            "skipped": skipped,
            "errors": errors,
            "last_refresh": now.isoformat(),
        }
    finally:
        cache.delete(REFRESH_LOCK_CACHE_KEY)


def _tracked_asx_symbols() -> List[str]:
    """Return the list of ASX symbols we actively track."""
    holding_symbols: Iterable[str] = (
        StockHolding.objects.filter(number_of_shares__gt=0)
        .filter(Q(company_symbol__iendswith=".AX") | Q(Exchange="ASX"))
        .values_list("company_symbol", flat=True)
        .distinct()
    )

    ticker_symbols: Iterable[str] = (
        Ticker.objects.filter(Q(symbol__iendswith=".AX") | Q(exchange="ASX"))
        .values_list("symbol", flat=True)
        .distinct()
    )

    merged = list({*holding_symbols, *ticker_symbols})
    return [s for s in merged if s]


@shared_task(bind=True)
def schedule_asx_market_check(self):
    """
    Periodic task run by Celery beat.

    Decides if a refresh is necessary (including catch-up after downtime)
    and queues the snapshot task when appropriate.
    """
    schedule_market_refresh_if_needed(
        trigger_reason="celery-beat",
        allow_closed_catch_up=True,
    )