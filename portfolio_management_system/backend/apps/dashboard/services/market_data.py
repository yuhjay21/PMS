# dashboard/services/market_data.py

from datetime import date
from typing import Iterable, List, Union, Optional

import pandas as pd

from ..models import Ticker, TickerData


SymbolLike = Union[str, Iterable[str]]


def normalize_symbols(symbols: SymbolLike) -> List[str]:
    """
    Ensure we always work with a clean list of symbols.
    """
    if isinstance(symbols, str):
        symbols = [symbols]

    # Remove duplicates + None/empty
    cleaned: List[str] = []
    for s in symbols:
        if not s:
            continue
        if s not in cleaned:
            cleaned.append(s)
    return cleaned


def get_prices(
    symbols: SymbolLike,
    start: Optional[date] = None,
    end: Optional[date] = None,
    interval: str = "1d",
) -> pd.DataFrame:
    """
    Drop-in replacement for `yf.download` that reads from the local TickerData table.

    Args:
        symbols:
            Single symbol (str) or list/iterable of symbols (e.g. ['ABC.AX', 'XYZ.AX']).
        start:
            Start date (datetime.date). Defaults to 2000-01-01 if not provided.
        end:
            End date (datetime.date). Defaults to today if not provided.
        interval:
            Price interval. Currently supports:
                - "1d"  → daily (no resampling)
                - "1wk" → weekly resample
                - "1mo" → monthly resample

    Returns:
        pandas.DataFrame structured like `yfinance.download` output:

        - For a single symbol: index=Date, columns = ["Open","High","Low","Close","Volume"]
        - For multiple symbols: index=Date, columns = MultiIndex
          (symbol, field) where field in ["Open","High","Low","Close","Volume"].
    """
    symbols_list = normalize_symbols(symbols)
    if not symbols_list:
        # Nothing to fetch
        return pd.DataFrame(
            columns=["Open", "High", "Low", "Close", "Volume"]
        )

    if end is None:
        end = date.today()
    if start is None:
        # default start 2000-01-01
        start = date(2000, 1, 1)

    # Fetch tickers for the requested symbols
    tickers = Ticker.objects.filter(symbol__in=symbols_list)

    if not tickers.exists():
        # No tickers in DB yet → return empty in the expected shape
        if len(symbols_list) == 1:
            return pd.DataFrame(
                columns=["Open", "High", "Low", "Close", "Volume"]
            )
        else:
            return pd.DataFrame(
                columns=pd.MultiIndex.from_product(
                    [symbols_list, ["Open", "High", "Low", "Close", "Volume"]]
                )
            )

    # Query historical data
    data_qs = (
        TickerData.objects.filter(
            ticker__in=tickers,
            date__gte=start,
            date__lte=end,
        )
        .order_by("ticker", "date")
    )

    # Convert queryset to DataFrame
    records = []
    for d in data_qs:
        records.append(
            {
                "symbol": d.ticker.symbol,
                "Date": d.date,
                "Open": d.open,
                "High": d.high,
                "Low": d.low,
                "Close": d.close,
                "Volume": d.volume,
            }
        )

    df = pd.DataFrame(records)

    # -----------------------------
    # No data returned → empty DF
    # -----------------------------
    if df.empty:
        if len(symbols_list) == 1:
            # Return empty DataFrame for single symbol
            return pd.DataFrame(
                columns=["Open", "High", "Low", "Close", "Volume"]
            )
        else:
            # Return empty multi-index
            return pd.DataFrame(
                columns=pd.MultiIndex.from_product(
                    [symbols_list, ["Open", "High", "Low", "Close", "Volume"]]
                )
            )

    # -----------------------------
    # Interval Resampling
    # -----------------------------
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.set_index("Date")

    # Only apply resampling if interval != daily
    if interval != "1d":
        # Map your interval values to pandas rules
        rule = {"1wk": "W", "1mo": "M"}.get(interval)
        if rule is None:
            raise ValueError(
                f"Unsupported interval '{interval}'. "
                "Use: '1d', '1wk', '1mo'."
            )

        def resample_group(g: pd.DataFrame) -> pd.DataFrame:
            return g.resample(rule).agg(
                {
                    "Open": "first",
                    "High": "max",
                    "Low": "min",
                    "Close": "last",
                    "Volume": "sum",
                }
            )

        df = (
            df.groupby("symbol", group_keys=True)[
                ["Open", "High", "Low", "Close", "Volume"]
            ]
            .apply(resample_group)
            .reset_index()
        )
        df = df.set_index("Date")

    # -----------------------------
    # Format Output (yfinance style)
    # -----------------------------
    if len(symbols_list) == 1:
        symbol = symbols_list[0]
        # Defensive: handle case where symbol has no rows in df
        sym_df = df[df["symbol"] == symbol] if "symbol" in df.columns else df
        out = sym_df[["Open", "High", "Low", "Close", "Volume"]]
        return out.sort_index()

    else:
        # Multiple symbols → MultiIndex columns (symbol, field)
        frames = []
        for s in symbols_list:
            if "symbol" in df.columns:
                sub = df[df["symbol"] == s]
            else:
                # If symbol col was lost somehow, just use df as-is
                sub = df

            # If no data for this symbol, create empty frame with matching index
            if sub.empty:
                empty = pd.DataFrame(
                    index=df.index.unique(),
                    columns=["Open", "High", "Low", "Close", "Volume"],
                )
                frames.append(empty)
            else:
                frames.append(
                    sub[["Open", "High", "Low", "Close", "Volume"]]
                )

        multi_df = pd.concat(frames, axis=1, keys=symbols_list)
        return multi_df.sort_index()
