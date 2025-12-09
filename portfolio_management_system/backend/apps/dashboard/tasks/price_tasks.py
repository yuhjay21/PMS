from celery import shared_task
from django.core.cache import cache
import pandas as pd
from datetime import datetime, timedelta

from apps.dashboard.services.market_data import get_prices
from apps.dashboard.models import StockHolding, Portfolio


@shared_task(bind=True)
def update_symbol_prices_task(self, symbols, user_id):
    """
    Runs asynchronously.
    Updates and caches prices for each symbol.
    """
    updated = []
    errors = []

    for sym in symbols:
        try:
            df = get_prices([sym], start=datetime.today() - timedelta(days=365), end=datetime.today())
            if df is None or df.empty:
                errors.append(sym)
                continue

            cache_key = f"prices:{sym}"
            cache.set(cache_key, df.to_json(), timeout=60 * 60 * 12)  # 12 hours cache

            updated.append(sym)

        except Exception as e:
            errors.append(f"{sym}: {str(e)}")

    return {
        "updated": updated,
        "errors": errors,
        "count": len(updated)
    }
