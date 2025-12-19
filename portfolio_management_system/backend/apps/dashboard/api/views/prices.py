from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.core.cache import cache
from apps.dashboard.services.market_data import get_prices
from apps.dashboard.services.market_schedule import schedule_market_refresh_if_needed
from apps.dashboard.tasks.price_tasks import update_symbol_prices_task
from apps.dashboard.models import StockHolding, Portfolio
from datetime import datetime, timedelta
import pandas as pd


class UpdatePricesAPI(APIView):
    """
    Trigger background price updates.
    
    Body:
    {
        "symbols": ["BHP.AX", "CBA.AX", "TLS.AX"]
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        symbols = request.data.get("symbols", [])
        if not symbols:
            return Response(
                {"error": "No symbols provided"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # send Celery task
        job = update_symbol_prices_task.delay(symbols, request.user.id)

        return Response({
            "status": "queued",
            "task_id": job.id,
            "message": f"Updating {len(symbols)} symbols"
        })



class PriceHistoryAPI(APIView):
    """
    GET /api/v1/dashboard/prices/history/?symbol=BHP.AX&range=1y
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        schedule_market_refresh_if_needed(
            trigger_reason="price-history",
            allow_closed_catch_up=True,
        )

        symbol = request.GET.get("symbol")
        range_ = request.GET.get("range", "1y")

        if not symbol:
            return Response({"error": "symbol required"}, status=400)

        # timeframe mapping
        ranges = {
            "1m": 30,
            "3m": 90,
            "6m": 180,
            "1y": 365,
            "5y": 1825,
        }

        days = ranges.get(range_, 365)
        start_date = datetime.today() - timedelta(days=days)

        cache_key = f"prices:{symbol}:{range_}"
        cached = cache.get(cache_key)

        if cached:
            return Response({"symbol": symbol, "prices": cached})

        df = get_prices([symbol], start=start_date, end=datetime.today())

        if df is None or df.empty:
            return Response({"error": "No price data found"}, status=400)

        df = df["Close"] if isinstance(df.columns, pd.MultiIndex) else df
        df_json = df.to_json()

        cache.set(cache_key, df_json, timeout=86400)  # 24 hours

        return Response({"symbol": symbol, "prices": df_json})
    


class UpdatePortfolioTickersAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        portfolios = Portfolio.objects.filter(user=request.user)
        symbols = list(
            StockHolding.objects.filter(portfolio__in=portfolios)
            .values_list("company_symbol", flat=True)
            .distinct()
        )
        
        if not symbols:
            return Response({"error": "No holdings found"}, status=400)

        job = update_symbol_prices_task.delay(symbols, request.user.id)

        return Response({
            "status": "queued",
            "task_id": job.id,
            "symbols": symbols
        })