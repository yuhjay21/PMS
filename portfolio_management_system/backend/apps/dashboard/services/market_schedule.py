"""Utilities for scheduling intraday market refreshes.

These helpers keep ASX data current during open hours and recover
cleanly after downtime.
"""
from __future__ import annotations

from datetime import datetime, time, timedelta
from typing import Optional
from zoneinfo import ZoneInfo

from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

MARKET_TZ = ZoneInfo(settings.TIME_ZONE)
MARKET_OPEN = time(hour=10, minute=0)
MARKET_CLOSE = time(hour=16, minute=10)

LAST_REFRESH_CACHE_KEY = "market:last_refresh"
REFRESH_LOCK_CACHE_KEY = "market:refresh:lock"
REFRESH_LOCK_SECS = 60
DEFAULT_MAX_AGE_MINUTES = 15


def market_now() -> datetime:
    """Return the current time in the configured market timezone."""
    return timezone.now().astimezone(MARKET_TZ)


def _as_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).astimezone(MARKET_TZ)
    except Exception:
        return None


def last_trading_day(reference: datetime) -> datetime.date:
    """Return the most recent weekday (Mon-Fri) for the given timestamp."""
    day = reference.date()
    while day.weekday() >= 5:  # 5=Saturday, 6=Sunday
        day -= timedelta(days=1)
    return day


def market_open_dt(reference: datetime) -> datetime:
    return reference.replace(
        hour=MARKET_OPEN.hour,
        minute=MARKET_OPEN.minute,
        second=0,
        microsecond=0,
    )


def market_close_dt(reference: datetime) -> datetime:
    return reference.replace(
        hour=MARKET_CLOSE.hour,
        minute=MARKET_CLOSE.minute,
        second=0,
        microsecond=0,
    )


def is_trading_day(moment: Optional[datetime] = None) -> bool:
    moment = moment or market_now()
    return moment.weekday() < 5


def is_market_open(moment: Optional[datetime] = None) -> bool:
    moment = moment or market_now()
    if not is_trading_day(moment):
        return False

    return market_open_dt(moment) <= moment <= market_close_dt(moment)


def get_last_refresh() -> Optional[datetime]:
    return _as_datetime(cache.get(LAST_REFRESH_CACHE_KEY))


def record_last_refresh(moment: Optional[datetime] = None) -> None:
    moment = moment or market_now()
    cache.set(LAST_REFRESH_CACHE_KEY, moment.isoformat(), timeout=None)


def should_refresh_market_data(
    last_refresh: Optional[datetime],
    now: Optional[datetime] = None,
    max_age_minutes: int = DEFAULT_MAX_AGE_MINUTES,
    allow_closed_catch_up: bool = False,
) -> bool:
    """
    Decide if a refresh is required.

    - During open hours: refresh if stale or never run.
    - Outside open hours: optionally catch up if the last refresh was
      before the most recent trading close (covers server downtime).
    """
    now = now or market_now()
    last_refresh = last_refresh.astimezone(MARKET_TZ) if last_refresh else None

    if allow_closed_catch_up:
        most_recent_trading_day = last_trading_day(now)
        if last_refresh is None or last_refresh.date() < most_recent_trading_day:
            return True
        if (
            last_refresh.date() == most_recent_trading_day
            and now >= market_close_dt(now)
            and last_refresh < market_close_dt(now)
        ):
            return True

    if not is_market_open(now):
        return False

    if last_refresh is None:
        return True

    return (now - last_refresh) >= timedelta(minutes=max_age_minutes)


def schedule_market_refresh_if_needed(
    *,
    trigger_reason: str,
    max_age_minutes: int = DEFAULT_MAX_AGE_MINUTES,
    allow_closed_catch_up: bool = False,
):
    """
    Queue a background market refresh if conditions require it.

    Uses a short-lived cache lock to avoid flooding Celery when multiple
    requests arrive simultaneously.
    """
    now = market_now()
    last_refresh = get_last_refresh()

    if not should_refresh_market_data(
        last_refresh,
        now=now,
        max_age_minutes=max_age_minutes,
        allow_closed_catch_up=allow_closed_catch_up,
    ):
        return None

    if not cache.add(REFRESH_LOCK_CACHE_KEY, trigger_reason, REFRESH_LOCK_SECS):
        return None

    # Avoid import cycles by importing the task lazily
    from apps.dashboard.tasks.market_tasks import capture_asx_market_snapshot

    result = capture_asx_market_snapshot.apply_async(
        kwargs={"trigger_reason": trigger_reason}
    )
    return result