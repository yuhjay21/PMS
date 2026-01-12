from datetime import date, timedelta

import numpy as np
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from django.db.models import Sum

from apps.dashboard.models import Portfolio, transaction, deposit

from apps.dashboard.services.market_data import get_prices
from apps.dashboard.constants import Index_Symbol
pd.set_option('display.max_columns', None)

class PortfolioPerformanceAPI(APIView):
    """
    Returns portfolio performance time-series vs index.

    Query params:
      - timeframe: one of ['1m', '3m', '6m', '1y', '5y', 'max'] (default '3m')
      - portfolio: portfolio id or 'all' (default 'all')
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        global Index_Symbol

        loc_Index_Symbol = Index_Symbol
        selected_portfolio_id = request.GET.get("portfolio")
        timeframe = request.GET.get("timeframe", "3m")

        # --- Portfolios (same logic as original view) ---
        user_portfolios = Portfolio.objects.filter(user=request.user)

        if selected_portfolio_id and selected_portfolio_id != "all":
            portfolios = user_portfolios.filter(id=selected_portfolio_id)
        else:
            portfolios = user_portfolios

        txns_qs = transaction.objects.filter(
            Holding__portfolio__in=portfolios
        ).order_by("date_transaction")
        deposits_qs = deposit.objects.filter(portfolio__in=portfolios)

        if not txns_qs.exists():
            return Response({"error": "No transactions found"}, status=400)

        today = date.today()

        # --- Timeframe handling (same semantics as your function) ---
        if timeframe == "1m":
            start_date = today - timedelta(days=30)
            interval = "1d"
            freq = "B"
        elif timeframe == "3m":
            start_date = today - timedelta(days=90)
            interval = "1d"
            freq = "B"
        elif timeframe == "6m":
            start_date = today - timedelta(days=180)
            interval = "1wk"
            freq = "W"
        elif timeframe == "1y":
            start_date = today - timedelta(days=365)
            interval = "1mo"
            freq = "ME"
        elif timeframe == "5y":
            start_date = today - timedelta(days=1825)
            interval = "1mo"
            freq = "ME"
        else:  # 'max'
            start_date = txns_qs.order_by("date_transaction").first().date_transaction - timedelta(days=21)
            interval = "1wk"
            freq = "W"

        # --- Symbols (transactions + index) ---
        symbols = list(
            set(
                list(
                    txns_qs.values_list("symbol", flat=True).distinct()
                )
            )
        )
        symbols.append(loc_Index_Symbol)
        # --- Market data (reuses your get_prices helper) ---
        data = get_prices(
            symbols, start=start_date, end=today + timedelta(days=5), interval=interval
        )
        if data is None or data.empty:
            return Response({"error": "No market data available"}, status=400)

        full_dates = pd.date_range(
            start=start_date, end=today - timedelta(days=5), freq=freq
        )
        overlap = data.index.union(full_dates)

        index_name = data.index.name
        data = data.reindex(overlap)
        data.index.name = index_name

        #data.dropna(axis=0, how='all', inplace=True)
        prices = data.xs("Close", level=1, axis=1).bfill()
        prices = prices.infer_objects(copy=False)

        # --- Build daily portfolio value (CashValue, deposits, etc.) ---
        portfolio_value = pd.DataFrame(index=prices.index)
        portfolio_value["Value"] = 0.0
        portfolio_value["InitValue"] = 0.0
        portfolio_value["CashValue"] = 0.0
        portfolio_value["CashDeposits"] = 0.0

        PF_initial_date = txns_qs.order_by("date_transaction").first().date_transaction

        for current_date in prices.index:
            day_value = 0.0
            init_value = 0.0

            day_txns = txns_qs.filter(date_transaction__lte=current_date)
            cash_txns = deposits_qs.filter(date_transaction__lte=current_date)
            dividend_txns = txns_qs.filter(
                date_transaction__lte=current_date,
                transaction_type__in=["Dividend Reinvestment", "Dividend Deposit"],
            )

            cumulative_buy_cost = 0.0
            cumulative_sell_proceeds = 0.0
            holdings = {}

            # --- Rebuild holdings (same as original) ---
            for t in day_txns:
                sym = t.symbol
                if sym not in holdings:
                    holdings[sym] = {"quantity": 0, "initValue": 0}

                if t.transaction_type == "Buy":
                    holdings[sym]["quantity"] += t.Quantity
                    cumulative_buy_cost += (t.Quantity * t.Buy_Price) + t.Commission
                    holdings[sym]["initValue"] += (t.Quantity * t.Buy_Price) + t.Commission

                elif t.transaction_type == "Sell":
                    if holdings[sym]["quantity"] > 0:
                        avg = holdings[sym]["initValue"] / holdings[sym]["quantity"]
                    else:
                        avg = 0

                    holdings[sym]["quantity"] -= t.Quantity
                    cumulative_sell_proceeds += (t.Quantity * t.Buy_Price) - t.Commission

                    if holdings[sym]["quantity"] == 0:
                        holdings[sym]["initValue"] = 0
                    else:
                        holdings[sym]["initValue"] -= (t.Quantity * avg) + t.Commission

                elif t.transaction_type == "Dividend Reinvestment":
                    holdings[sym]["quantity"] += t.Quantity
                    holdings[sym]["initValue"] += (t.Quantity * t.Buy_Price)

            # --- Compute current portfolio value ---
            for sym, sym_data in holdings.items():
                if sym in prices.columns:
                    price_today = prices.loc[current_date, sym]
                    price_today = 0.0 if pd.isna(price_today) else float(price_today)

                    if sym != Index_Symbol:
                        day_value += price_today * sym_data["quantity"]
                        init_value += (
                            sym_data["initValue"] if sym_data["quantity"] > 0 else 0
                        )

            cash_sum = cash_txns.aggregate(Sum("total_amount"))["total_amount__sum"] or 0
            div_sum = (
                dividend_txns.aggregate(Sum("Total"))["Total__sum"] or 0
            )  # cash impact of dividends
            cash_on_hand = (cash_sum + cumulative_sell_proceeds ) - cumulative_buy_cost
            # Testing Values
            # portfolio_value.at[current_date, "OnHandCash"] = cash_on_hand
            # portfolio_value.at[current_date, "cash_sum"] = cash_sum
            # portfolio_value.at[current_date, "cumulative_sell_proceeds"] = cumulative_sell_proceeds
            #portfolio_value.at[current_date, "div_sum"] = div_sum
            # portfolio_value.at[current_date, "cumulative_buy_cost"] = cumulative_buy_cost
            
            
            portfolio_value.at[current_date, "Value"] = day_value
            portfolio_value.at[current_date, "InitValue"] = init_value
            portfolio_value.at[current_date, "CashValue"] = day_value + cash_on_hand
            portfolio_value.at[current_date, "CashDeposits"] = cash_sum

        portfolio_value["CashValue"] = portfolio_value["CashValue"].round(2)
        #portfolio_value["div_%"] = portfolio_value["div_sum"]/portfolio_value["CashDeposits"] * 100
        # --- Portfolio % performance ---
        portfolio_value["Portfolio"] = (
            portfolio_value["CashValue"] / portfolio_value["CashDeposits"] * 100 - 100
        ).fillna(0).round(2)

        # --- Index benchmark (^AXJO) ---
        # Initial index value near PF_initial_date

        idx_df = get_prices(
            loc_Index_Symbol,
            start=PF_initial_date,
            end=today + timedelta(days=5),
            interval=interval
        )
        Index_init_value = idx_df.iloc[0]["Open"]

        portfolio_value["pnl"] = (
            portfolio_value["CashValue"] - portfolio_value["CashDeposits"]
        ).diff().fillna(0).round(2)

        PF_initial_date_ts = pd.Timestamp(PF_initial_date)

        portfolio_value["Index_%"] = np.where(
            portfolio_value.index >= PF_initial_date_ts,
            ((prices[loc_Index_Symbol] / Index_init_value) * 100 - 100).round(2),
            0,
        )

        portfolio_value["Index_value"] = prices[loc_Index_Symbol]
        portfolio_value.ffill(inplace=True)
        portfolio_value["pnl_index"] = (
            portfolio_value["Index_value"]
        ).diff().fillna(0).round(2)

        portfolio_value = portfolio_value.reset_index()
        portfolio_value["Date"] = portfolio_value["Date"].astype(str)
        #print(portfolio_value)
        return Response(
            {
                "dates": portfolio_value["Date"].tolist(),
                "portfolio": portfolio_value["Portfolio"].tolist(),
                #"divper": portfolio_value["div_%"].tolist(),
                "pnl_index": portfolio_value["Date"].tolist(),
                "portfolio_value": portfolio_value["CashValue"].tolist(),
                "pnl": portfolio_value["pnl"].tolist(),
                "index": portfolio_value["Index_%"].tolist(),
            }
        )
