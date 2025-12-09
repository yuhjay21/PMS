from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.models import Portfolio, StockHolding, transaction
from apps.dashboard.api.serializers.dividends import (
    DividendEventSerializer,
    DividendConfirmSerializer,
)

from datetime import datetime
import pandas as pd


class CheckDividendsAPI(APIView):
    """
    Detect dividends based on:
    - holdings
    - ex-dividend dates
    - dividend amount per share

    In your original dashboard you used:
    - financials_api
    - yahoo finance
    - Tingo or Fierce APIs

    Here we keep API-compatible structure (no HTML).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio_id = request.GET.get("portfolio", "all")

        portfolios = Portfolio.objects.filter(user=request.user)
        if portfolio_id != "all":
            portfolios = portfolios.filter(id=portfolio_id)

        holdings = StockHolding.objects.filter(portfolio__in=portfolios)

        # Pseudo: Replace with your real dividend API logic
        dividend_events = []

        for h in holdings:
            # Example: Assume an external API call was already done
            # Use your existing helper if necessary
            dividend_amount = 0.0  # placeholder
            ex_date = "2025-01-01"
            pay_date = "2025-01-15"

            total_amount = dividend_amount * h.number_of_shares

            dividend_events.append({
                "symbol": h.company_symbol,
                "company_name": h.company_name,
                "sector": h.sector,
                "ex_date": ex_date,
                "pay_date": pay_date,
                "dividend": dividend_amount,
                "quantity": h.number_of_shares,
                "total_amount": total_amount,
            })

        serializer = DividendEventSerializer(dividend_events, many=True)
        return Response(serializer.data)
    

class ConfirmDividendAPI(APIView):
    """
    Confirms a single dividend:
    - Adds a `Dividend Deposit` transaction
    - (Optionally) handles dividend reinvestment (DRIP)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, symbol, ex_date):
        portfolios = Portfolio.objects.filter(user=request.user)
        holdings = StockHolding.objects.filter(
            portfolio__in=portfolios, company_symbol=symbol
        )

        if not holdings.exists():
            return Response({"error": "No such holding"}, status=404)

        h = holdings.first()
        amount = request.data.get("amount")
        reinvest = request.data.get("reinvest", False)
        price = request.data.get("price")  # for DRIP

        if not amount:
            return Response({"error": "Missing amount"}, status=400)

        # Dividend Deposit transaction
        transaction.objects.create(
            Holding=h,
            symbol=symbol,
            date_transaction=ex_date,
            Buy_Price=0,
            Quantity=0,
            Total=amount,
            transaction_type="Dividend Deposit",
            Commission=0
        )

        # Dividend reinvestment (DRIP)
        if reinvest and price:
            qty = float(amount) / float(price)
            transaction.objects.create(
                Holding=h,
                symbol=symbol,
                date_transaction=ex_date,
                Buy_Price=price,
                Quantity=qty,
                Total=amount,
                transaction_type="Dividend Reinvestment",
                Commission=0
            )

        return Response({"success": True, "message": "Dividend confirmed"})


class ConfirmMultipleDividendsAPI(APIView):
    """
    Confirms multiple dividends at once.
    Used when user selects many dividends in UI.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = DividendConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        events = serializer.validated_data["events"]

        portfolios = Portfolio.objects.filter(user=request.user)

        for evt in events:
            symbol = evt["symbol"]
            amount = evt["total_amount"]
            ex_date = evt["ex_date"]
            reinvest = evt.get("reinvest", False)
            price = evt.get("price", None)

            holding = StockHolding.objects.filter(
                portfolio__in=portfolios,
                company_symbol=symbol
            ).first()

            if not holding:
                continue

            # Deposit
            transaction.objects.create(
                Holding=holding,
                symbol=symbol,
                date_transaction=ex_date,
                Buy_Price=0,
                Quantity=0,
                Total=amount,
                transaction_type="Dividend Deposit",
                Commission=0
            )

            # Reinvestment
            if reinvest and price:
                qty = float(amount) / float(price)
                transaction.objects.create(
                    Holding=holding,
                    symbol=symbol,
                    date_transaction=ex_date,
                    Buy_Price=price,
                    Quantity=qty,
                    Total=amount,
                    transaction_type="Dividend Reinvestment",
                    Commission=0
                )

        return Response({"success": True})
