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
from apps.dashboard.constants import Index_Symbol
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
    if symbol==Index_Symbol:
        txn_bounds = StockTransaction.objects.aggregate(
        first=Min("date_transaction"),
        last=Max("date_transaction"),
        )
        open_qty = 1000
    else:
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
    # Refresh txn bounds from DB (avoid stale instance)
    tkr = type(ticker_obj).objects.get(symbol=ticker_obj.symbol)

    expected_start = tkr.first_txn
    expected_end = tkr.last_txn

    # If bounds unknown or invalid, do nothing (or set defaults if you prefer)
    if not expected_start or not expected_end:
        
        return None, None
    if expected_end < expected_start:
        
        return None, None

    qs = tkr.historical_data.all()

    last_date = qs.aggregate(last=Max("date"))["last"]

    # 1) No historical rows -> fetch full expected historical range
    if not last_date:
        
        return expected_start, min(expected_end, today)

    # 2) Only fetch forward from the day after last stored date
    start = last_date + timedelta(days=1)

    # Never fetch before expected_start (safety)
    if start < expected_start:
        start = expected_start

    # Never fetch after today or after expected_end
    end = min(expected_end, today)
    if start > end:
        # 3) Optional: same-day refresh window (intraday updates)
        if expected_end == today and _is_market_open_day(today):
            
            return today, today
        
        return None, None

    # If you only want to fetch when there's at least one market-open day in [start, end],
    # advance start forward to the next market-open day and trim end back similarly.
    while start <= end and not _is_market_open_day(start):
        start += timedelta(days=1)

    while end >= start and not _is_market_open_day(end):
        end -= timedelta(days=1)

    if start > end:
        
        return None, None
    
    return start, end


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

def yahooFinance_Download(ticker_symbol, start, end, progress, auto_adjust):
    df = yf.download(
            ticker_symbol,
            start=start - timedelta(days=1),
            end=end + timedelta(days=1),  # inclusive end date
            progress=progress,
            auto_adjust=auto_adjust,
        )
    # print(df)
    sector = df
    return df, sector

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
        if symbol == Index_Symbol:
            df, sector = yahooFinance_Download(
            ticker_obj.ticker,
            start=start - timedelta(days=1),
            end=end + timedelta(days=1),  # inclusive end date
            progress=False,
            auto_adjust=True,
        )
        else:
            df, sector = yahooFinance_Download(
                ticker_obj.symbol,
                start=start - timedelta(days=1),
                end=end + timedelta(days=1),  # inclusive end date
                progress=False,
                auto_adjust=True,
            )
        # hldng_obj = StockHolding.objects.get(company_symbol=ticker_obj.ticker, Exchange=ticker_obj.exchange)
        # hldng_obj.sector = 
 
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