from datetime import date, datetime, timedelta

from celery import shared_task
from django.core.cache import cache

from apps.dashboard.services.market_data import get_prices
from apps.dashboard.services.ticker_sync import refresh_ticker_history, symbols_from_user_portfolios


@shared_task(bind=True)
def update_symbol_prices_task(self, symbols, user_id):
    """
    Runs asynchronously.
    Updates ticker metadata, stores historical OHLCV data, and caches recent prices.
    """
    target_symbols = list(symbols or symbols_from_user_portfolios(user_id) or [])
    today = date.today()

    sync_results = refresh_ticker_history(target_symbols)

    updated = [res.symbol for res in sync_results if res.updated]
    skipped = [res.symbol for res in sync_results if not res.updated and res.error is None]
    errors = [f"{res.symbol}: {res.error}" for res in sync_results if res.error]

    for sym in updated+skipped:
        try:
            df = get_prices(
                [sym],
                start=today - timedelta(days=365),
                end=today,
            )
            if df is None or df.empty:
                continue

            cache_key = f"prices:{sym}"
            cache.set(cache_key, df.to_json(), timeout=60*60)  # 12 hours cache
        except Exception as e:
            errors.append(f"{sym} cache: {str(e)}")

    return {
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "count": len(updated),
    }