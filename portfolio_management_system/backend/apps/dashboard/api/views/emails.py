from datetime import datetime

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.models import Portfolio, StockHolding, transaction
from apps.dashboard.api.serializers.emails import (
    StakeFetchRequestSerializer,
    StakeTradeSerializer,
    ConfirmTradeSerializer,
)
from apps.dashboard.services.stake_emails import fetch_stake_trades_for_user
from apps.dashboard.services.secrets import get_secret
from apps.dashboard.services.holdings import update_holdings


class FetchStakeEmailsAPI(APIView):
    """
    Fetch Stake trade emails from Gmail and return parsed trades.
    Expects Gmail credentials stored as AppSecret with type='Gmail'
    and portfolio relationships, same as your existing get_secret() usage.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        req_serializer = StakeFetchRequestSerializer(data=request.data)
        req_serializer.is_valid(raise_exception=True)
        selected_portfolio_id = req_serializer.validated_data["portfolio"]

        # Get Gmail credentials via your existing helper (AppSecret/portfolio-based)
        gmail_secrets = get_secret(request, "Gmail")
        if not gmail_secrets:
            return Response(
                {"error": "No Gmail credentials configured"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        trades = fetch_stake_trades_for_user(
            user=request.user,
            selected_portfolio_id=selected_portfolio_id,
            gmail_secrets=gmail_secrets,
        )

        out_serializer = StakeTradeSerializer(trades, many=True)
        return Response(
            {
                "trades": out_serializer.data,
                "selected_portfolio_id": selected_portfolio_id,
            }
        )


class ConfirmStakeTransactionAPI(APIView):
    """
    Confirm a single parsed Stake trade and insert it as:
      - updated holding (via update_holdings)
      - transaction record
    Mirrors your confirm_transaction() logic but as JSON API.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ConfirmTradeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        portfolio_id = serializer.validated_data["portfolio_id"]
        symbol = serializer.validated_data["symbol"] + ".AX"
        price = serializer.validated_data["price"]
        quantity = serializer.validated_data["quantity"]
        trade_type = serializer.validated_data["trade_type"]
        commission = serializer.validated_data["commission"]
        trade_date_str = serializer.validated_data["trade_date"]

        try:
            trade_date = datetime.strptime(trade_date_str, "%Y-%m-%d").date()
        except ValueError:
            return Response(
                {"status": "error", "message": "Invalid date format"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prevent duplicates (same logic as your original confirm_transaction)
        exists = transaction.objects.filter(
            Holding__portfolio__id=portfolio_id,
            Holding__company_symbol=symbol,
            date_transaction=trade_date,
            Buy_Price=price,
            Quantity=quantity,
            transaction_type=trade_type,
            Commission=commission,
        ).exists()

        if exists:
            return Response({"status": "duplicate", "message": "Already exists"})

        # Update / create holding
        holding = update_holdings(
            request,
            {
                "p_id": portfolio_id,
                "symbol": symbol,
                "quantity": float(quantity),
                "commission": float(commission),
                "exchange": "ASX",
                "trade_type": trade_type,
                "price": float(price),
            },
        )

        # Create transaction
        transaction.objects.create(
            Holding=StockHolding.objects.get(
                portfolio__id=portfolio_id, company_symbol=symbol
            ),
            symbol=symbol,
            date_transaction=trade_date,
            Buy_Price=price,
            Quantity=quantity,
            Total=price * quantity + commission,
            transaction_type=trade_type,
            Commission=commission,
        )

        return Response({"status": "success", "message": "Transaction added"})
