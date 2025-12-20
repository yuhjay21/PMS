"""Ticker synchronization utilities.

Populate the Ticker and TickerData tables from existing holdings/transactions
and keep them refreshed with the latest market data.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import date, timedelta
from typing import Iterable, List, Optional, Tuple
import datetime

import pandas as pd
import yfinance as yf
from django.core.cache import cache
from django.db.models import Max, Min, Sum
from django.utils import timezone

from apps.dashboard.models import StockHolding, Ticker, TickerData, transaction as StockTransaction


@dataclass
class SyncResult:
    symbol: str
    updated: bool
    start: Optional[date]
    end: Optional[date]
    rows_written: int = 0
    error: Optional[str] = None


# ---------------------------------------------------------------------------
# Symbol helpers
# ---------------------------------------------------------------------------

def _derive_symbol_parts(raw_symbol: str) -> tuple[str, str, str]:
    """
    Returns ticker (base), exchange, and fully qualified symbol.

    Examples:
        "BHP.AX" -> ("BHP", "ASX", "BHP.AX")
        "OGDC.PSX" -> ("OGDC", "PSX", "OGDC.PSX")
        "AAPL" -> ("AAPL", "ASX", "AAPL.AX")
    """

    if not raw_symbol:
        return "", "ASX", ""

    symbol_upper = raw_symbol.upper()

    if symbol_upper.endswith(".AX"):
        return raw_symbol[:-3], "ASX", raw_symbol
    if symbol_upper.endswith(".PSX"):
        return raw_symbol[:-4], "PSX", raw_symbol

    # Default to ASX if no suffix is provided
    return raw_symbol, "ASX", f"{raw_symbol}.AX"


def symbols_from_user_portfolios(user_id: int) -> List[str]:
    """Collect distinct symbols from all holdings across a user's portfolios."""

    return list(
        StockHolding.objects.filter(portfolio__user_id=user_id)
        .values_list("company_symbol", flat=True)
        .distinct()
    )


def _normalize_date(value):
    # already a date (but not datetime)
    if isinstance(value, datetime.date) and not isinstance(value, datetime.datetime):
        return value
    # datetime -> date
    if isinstance(value, datetime.datetime):
        return value.date()
    # pandas timestamp -> date
    if isinstance(value, pd.Timestamp):
        return value.date()
    # string -> parse ISO
    if isinstance(value, str):
        # accept "YYYY-MM-DD" or "YYYY-MM-DDTHH:MM:SS"
        return datetime.date.fromisoformat(value[:10])

    # fallback: try pandas conversion
    try:
        return pd.to_datetime(value).date()
    except Exception:
        raise TypeError(f"Unsupported date type: {type(value)} value={value!r}")

# ---------------------------------------------------------------------------
# Ticker lifecycle
# ---------------------------------------------------------------------------

def ensure_ticker(symbol: str) -> Optional[Ticker]:
    """
    Create or update a Ticker record for the provided symbol.

    Also stores the earliest and latest transaction dates for the symbol if
    transactions exist.
    """

    ticker_code, exchange, normalized_symbol = _derive_symbol_parts(symbol)

    if not ticker_code:
        return None

    ticker_obj, _ = Ticker.objects.get_or_create(
        symbol=normalized_symbol,
        defaults={
            "ticker": ticker_code,
            "exchange": exchange,
        },
    )

    # Update missing ticker/exchange metadata
    ticker_obj.ticker = ticker_obj.ticker or ticker_code
    ticker_obj.exchange = ticker_obj.exchange or exchange

    # Derive transaction boundaries for this symbol
    txn_bounds = StockTransaction.objects.filter(symbol__in=[symbol, normalized_symbol]).aggregate(
        first=Min("date_transaction"),
        last=Max("date_transaction"),
    )

    open_qty = StockHolding.objects.filter(company_symbol__in=[symbol, normalized_symbol]).aggregate(
                                total_qty=Sum("number_of_shares")   # change "quantity" to your actual shares field name if different
                            )["total_qty"] or 0

    if txn_bounds["first"]:
        ticker_obj.first_txn = txn_bounds["first"]
    if open_qty > 0:
        ticker_obj.last_txn = date.today()
    elif txn_bounds["last"]:
        ticker_obj.last_txn = txn_bounds["last"]

    ticker_obj.save()
    return ticker_obj

def _is_market_open_day(d: date) -> bool:
    # Simple weekday rule (Mon-Fri). Replace with your exchange calendar if needed.
    return d.weekday() < 5

def _window_for_refresh(ticker_obj: "Ticker", today: date) -> Tuple[Optional[date], Optional[date]]:
    # Refresh txn bounds from DB (in case caller has stale instance)
    tkr = type(ticker_obj).objects.get(symbol=ticker_obj.symbol)

    first_txn = tkr.first_txn
    last_txn = tkr.last_txn

    # Expected historical range:
    expected_start = first_txn or (today - timedelta(days=365))
    expected_end = last_txn or today

    # If expected_end is before expected_start (bad data), do nothing
    if expected_end and expected_start and expected_end < expected_start:
        return None, None

    qs = ticker_obj.historical_data.all()

    first_row = qs.order_by("date").first()
    last_row = qs.order_by("-date").first()

    # 1) No historical rows -> fetch full expected historical range
    if not last_row:
        return expected_start, expected_end

    # ---- Helper: find first missing contiguous block inside [expected_start, expected_end] ----
    def first_missing_block(start_d: date, end_d: date) -> Tuple[Optional[date], Optional[date]]:
        if end_d < start_d:
            return None, None

        stored = set(
            qs.filter(date__gte=start_d, date__lte=end_d).values_list("date", flat=True)
        )

        # Scan calendar days but only consider market-open days as "required"
        d = start_d
        while d <= end_d:
            if _is_market_open_day(d) and d not in stored:
                block_start = d
                block_end = d
                d2 = d + timedelta(days=1)
                while d2 <= end_d:
                    if _is_market_open_day(d2) and d2 not in stored:
                        block_end = d2
                        d2 += timedelta(days=1)
                        continue
                    break
                return block_start, block_end
            d += timedelta(days=1)

        return None, None

    # 2) If data exists but starts after first_txn (or expected_start), backfill head
    if first_row and expected_start < first_row.date:
        head_end = min(expected_end, first_row.date - timedelta(days=1))
        if expected_start <= head_end:
            # Avoid already-stored past days: only fetch missing days in this head window
            s, e = first_missing_block(expected_start, head_end)
            if s and e:
                return s, e

    # 3) If data is missed between expected_start and expected_end, fill gaps (avoid stored past days)
    gap_start = max(expected_start, first_row.date if first_row else expected_start)
    gap_end = min(expected_end, last_row.date if last_row else expected_end)
    s, e = first_missing_block(gap_start, gap_end)
    if s and e:
        return s, e

    # 4) If today is market open day and latest stored date is before today, fetch forward to today
    latest_date = last_row.date
    if _is_market_open_day(today) and latest_date < today:
        # Avoid already-stored past days by starting at next day after latest_date
        forward_start = max(latest_date + timedelta(days=1), expected_start)
        forward_end = today
        if forward_start <= forward_end:
            return forward_start, forward_end

    # 5) If latest stored row is today, allow same-day refresh window (intraday updates)
    if latest_date == today:
        return today, today

    return None, None


# ---------------------------------------------------------------------------
# Historical data sync
# ---------------------------------------------------------------------------

def _store_history(ticker_obj: Ticker, df: pd.DataFrame) -> int:
    """Persist yfinance DataFrame rows into TickerData."""

    if df.empty:
        return 0

    df = df.reset_index()
    rows_written = 0

    for _, row in df.iterrows():
        trade_date = row["Date"].dt.date
        date = _normalize_date(trade_date.iloc[0])
        defaults = {
            "open": round(row["Open"].iloc[0],2),
            "high": round(row["High"].iloc[0],2),
            "low": round(row["Low"].iloc[0],2),
            "close": round(row["Close"].iloc[0],2),
            "volume": round(row["Volume"].iloc[0],2),
            "datetime": getattr(row["Date"], "to_pydatetime", lambda: None)(),
        }

        _, created = TickerData.objects.update_or_create(
            ticker=ticker_obj,
            date=date,
            defaults=defaults,
        )
        rows_written += 1 if created else 0

    return rows_written


def refresh_ticker_history(symbols: Iterable[str]) -> List[SyncResult]:
    """
    Ensure Ticker and TickerData tables are populated for the provided symbols.
    """
    today = date.today()
    results: List[SyncResult] = []
    seen = set()

    for symbol in symbols:
        if symbol in seen:
            continue
        seen.add(symbol)

        ticker_obj = ensure_ticker(symbol)
        if ticker_obj is None:
            results.append(
                SyncResult(symbol=symbol, updated=False, start=None, end=None, error="invalid symbol")
            )
            continue

        start, end = _window_for_refresh(ticker_obj, today)
        print(f"Accessing Values for {symbol} from {start} to {end}")
        if start is None or end is None or start > end:
            results.append(
                SyncResult(symbol=ticker_obj.symbol, updated=False, start=start, end=end)
            )
            continue

        df = yf.download(
            ticker_obj.symbol,
            start=start,
            end=end + timedelta(days=1),  # inclusive end date
            progress=False,
            auto_adjust=True,
        )

        if df is None or df.empty:
            results.append(
                SyncResult(symbol=ticker_obj.symbol, updated=False, start=start, end=end, error="no data returned")
            )
            continue

        rows_written = _store_history(ticker_obj, df)

        results.append(
            SyncResult(
                symbol=ticker_obj.symbol,
                updated=True,
                start=start,
                end=end,
                rows_written=rows_written,
            )
        )

    return results