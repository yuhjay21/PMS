from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import json
from datetime import date, timedelta
from apps.dashboard.models import Portfolio, StockHolding, transaction
from apps.dashboard.api.serializers.dividends import (
    DividendEventSerializer,
    DividendConfirmSerializer,
)
from apps.dashboard.services.holdings import update_holdings
import yfinance as yf
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

        user_transactions = transaction.objects.filter(
            Holding__portfolio__in=portfolios
        )
        symbols = user_transactions.values_list("symbol","Holding__Exchange").distinct()
        
        symbols = [s+".AX" for s,e in symbols if e=="ASX"]
        eligible_dividends = []
        if not symbols:
            return Response([])
        
        tickers = yf.download(list(symbols),actions=True,period="1y")
        tickers=tickers['Dividends']

        for ticker_n in tickers.columns:
            ticker = tickers[ticker_n]
            ticker = ticker[ticker!=0].dropna()
            if ticker.empty:
                continue

            for idx, value in ticker.items():
                ex_date = idx.date()
                div_per_share = value

                symbol = ticker_n.split(".")[0]
                Exchange = "ASX" if ticker_n.split(".")[1]=="AX" else "N/A"

                already_recorded = user_transactions.filter(
                    symbol=symbol,
                    date_transaction__gte=ex_date,
                    date_transaction__lte=ex_date + timedelta(days=45),
                    Buy_Price=div_per_share,
                    transaction_type__in=[
                        "Dividend Reinvestment",
                        "Dividend Deposit",
                    ],
                ).exists()

                if already_recorded:
                    #print(f"Dividend for {symbol} with total {div_per_share} on {ex_date} already recorded")
                    continue

                buys = user_transactions.filter(
                    symbol=symbol,
                    transaction_type="Buy",
                    date_transaction__lte=ex_date,
                )
                sells = user_transactions.filter(
                    symbol=symbol,
                    transaction_type="Sell",
                    date_transaction__lte=ex_date,
                )
                net_shares = sum(t.Quantity for t in buys) - sum(
                    t.Quantity for t in sells
                )
                if net_shares <= 0:
                        #print(f"Dividend for {symbol} with total {div_per_share} on {ex_date} not eligible")
                        continue
                
                total_dividend = round(net_shares * div_per_share, 2)
                eligible_dividends.append(
                    {   "pf_id" : portfolio_id,
                        "symbol": symbol,
                        "ex_date": ex_date.strftime("%Y-%m-%d"),
                        "div_per_share": div_per_share,
                        "shares": net_shares,
                        "total_dividend": total_dividend,
                        "exchange" : Exchange
                    }
                )
                #print(f"Dividend for {symbol} with total {div_per_share} on {ex_date} is eligible")

        serializer = DividendEventSerializer(eligible_dividends, many=True)
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
            amount = evt["total_dividend"]
            ex_date = evt["ex_date"]
            exchange = evt['exchange']
            pf_id = evt["pf_id"]
            shares = evt["shares"]
            div_per_share = evt["div_per_share"]
            reinvest = evt.get("reinvest", False)
            price = evt.get("price", None)

            holding = StockHolding.objects.filter(
                portfolio__id=pf_id,
                company_symbol=symbol
            ).first()

            if not holding:
                continue
            print(holding)
            print({'p_id'      :int(pf_id),
                    'symbol'    :symbol,
                    'quantity'  :shares,
                    'commission': 0,
                    'exchange'  : exchange,
                    'trade_type':"Dividend Deposit",
                    'price'     :div_per_share})

            Holding_Data = update_holdings(
                    holding,
                    {'p_id'      :int(pf_id),
                    'symbol'    :symbol,
                    'quantity'  :shares,
                    'commission': 0,
                    'exchange'  : exchange,
                    'trade_type':"Dividend Deposit",
                    'price'     :div_per_share}
                )
            #print(f'p_id:{pf_id},symbol:{symbol},quantity:{shares},commission: {0},exchange: {0},trade_type:"Dividend Deposit",price :{div_per_share}')

            Holding_Data.save()
            # Deposit
            transaction.objects.create(
                Holding=holding,
                symbol=symbol,
                date_transaction=ex_date,
                Buy_Price=div_per_share,
                Quantity=shares,
                Total=amount,
                transaction_type="Dividend Deposit",
                Commission=0
            )

            # Reinvestment
            if reinvest and price:
                qty = float(amount) / float(price)
                # transaction.objects.create(
                #     Holding=holding,
                #     symbol=symbol,
                #     date_transaction=ex_date,
                #     Buy_Price=price,
                #     Quantity=qty,
                #     Total=amount,
                #     transaction_type="Dividend Reinvestment",
                #     Commission=0
                # )

        return Response({"success": True})
