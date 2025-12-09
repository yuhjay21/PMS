from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.models import Portfolio, StockHolding, transaction, deposit
from apps.dashboard.api.serializers.holdings import HoldingSerializer
from apps.dashboard.utils.dates import weekday_dates
from apps.dashboard.services.pnl import annotate_realized_pnl
from apps.dashboard.services.market_data import get_prices

from django.db.models import Sum, Avg, F, FloatField, ExpressionWrapper
import math
from datetime import datetime, timedelta, date
import pandas as pd


class DashboardHoldingsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # --- Update historical data (side-effect as in original view) ---
        #check_update_historicaldata()

        # --- Get selected portfolio ID from GET params ---
        selected_portfolio_id = request.GET.get("portfolio")

        # --- Get all portfolios for user ---
        user_portfolios = Portfolio.objects.filter(user=request.user)

        # --- Determine if showing combined or single portfolio ---
        if selected_portfolio_id and selected_portfolio_id != "all":
            portfolios = user_portfolios.filter(id=selected_portfolio_id)
        else:
            portfolios = user_portfolios

        # --- Get all holdings for these portfolios (same aggregation as original) ---
        holding_companies = (
            StockHolding.objects
            .filter(portfolio__in=portfolios)
            .values('company_symbol', 'company_name', 'Exchange', 'sector', 'id')
            .annotate(
                total_shares=Sum('number_of_shares'),
                total_investment=Sum('investment_amount'),
                total_cost_sum=Sum('total_cost'),
                total_realized_pnl=Sum('Realized_PnL'),
                total_unrealized_pnl=Sum('UnRealized_PnL'),
                avg_ltp=Avg('LTP'),
                weighted_avg_buy_price=ExpressionWrapper(
                    Sum('total_cost') / Sum('number_of_shares'),
                    output_field=FloatField()
                ),
            )
        )

        # Unique symbols with > 0 shares
        symbols = list({c['company_symbol'] for c in holding_companies if c['total_shares'] > 0})

        # --- Dates & prices ---
        today, yesterday = weekday_dates()

        if symbols:
            try:
                latest_prices_df = get_prices(
                    symbols,
                    start=yesterday,
                    end=today + timedelta(days=1)
                )
                yesterday_prices = latest_prices_df.xs("Close", level=1, axis=1).iloc[0].to_dict()
                latest_prices = latest_prices_df.xs("Close", level=1, axis=1).iloc[-1].to_dict()
            except Exception:
                latest_prices = {symbol: 0 for symbol in symbols}
                yesterday_prices = {symbol: 0 for symbol in symbols}
        else:
            latest_prices = {}
            yesterday_prices = {}

        # --- Initialize aggregates (same vars as original view) ---
        holdings = []
        sectors = [[], []]
        sector_wise_investment = {}
        stocks = [[], []]

        uPnL = 0
        current_value = 0
        sum_investment_amount = 0
        sum_value = 0
        unrealized_PnL = 0  # not returned separately, but kept for parity
        y_unadjusted_PnL = 0
        unadjusted_PnL = 0
        Sum_Dividends = 0
        sum_final_total = 0

        # --- Portfolio-wise totals ---
        total_investment = portfolios.aggregate(Sum('total_investment'))['total_investment__sum'] or 0
        total_cash = portfolios.aggregate(Sum('total_amount'))['total_amount__sum'] or 0

        # --- Iterate through holdings (same as original logic) ---
        for c in holding_companies:
            company_symbol = c['company_symbol']
            company_name = c['company_name']
            exchange = c['Exchange']
            number_shares = c['total_shares'] or 0
            investment_amount = c['total_investment'] or 0
            total_cost = c['total_cost_sum'] or 0
            average_cost = c['weighted_avg_buy_price'] or 0
            pk = c['id']

            market_price = latest_prices.get(company_symbol, 0) or 0
            prev_market_price = yesterday_prices.get(company_symbol, 0) or 0

            # Query original individual holdings for LTP update
            holding_qs = StockHolding.objects.filter(
                portfolio__in=portfolios,
                company_symbol=company_symbol,
                Exchange=exchange,
                number_of_shares__gt=0
            )

            # Handle NaN and update LTP exactly like the original view
            try:
                if math.isnan(market_price) and (c['avg_ltp'] or 0) != 0:
                    if prev_market_price:
                        c['avg_ltp'] = prev_market_price
                        for each_holding in holding_qs:
                            each_holding.LTP = prev_market_price
                            each_holding.save()
                    market_price = c['avg_ltp'] or 0
                else:
                    c['avg_ltp'] = market_price
                    for each_holding in holding_qs:
                        try:
                            each_holding.LTP = market_price
                            each_holding.save()
                        except Exception:
                            each_holding.LTP = prev_market_price
                            each_holding.save()
            except TypeError:
                # market_price might not be float; fall back to avg_ltp or prev price
                market_price = c.get('avg_ltp') or prev_market_price or 0

            current_value += market_price * number_shares
            uPnL += c['total_realized_pnl'] or 0

            if number_shares > 0:
                # total_unrealized_pnl recomputed as in original
                c['total_unrealized_pnl'] = ((market_price * number_shares) - total_cost) + (c['total_realized_pnl'] or 0)

                # Unadjusted PnL excludes commissions from investment_amount
                unadjusted_PnL += ((market_price * number_shares) - investment_amount)
                y_unadjusted_PnL += ((prev_market_price * number_shares) - investment_amount)

                PnL = c['total_unrealized_pnl']
            else:
                PnL = c['total_realized_pnl'] or 0

            # --- Dividends aggregation ---
            dividends_qs = transaction.objects.filter(
                Holding__portfolio__in=portfolios,
                symbol=company_symbol,
                transaction_type__in=["Dividend Deposit", "Dividend Reinvestment"]
            )
            Total_dividends = dividends_qs.aggregate(Sum("Total"))['Total__sum'] or 0.0

            # Use base symbol (before dot) in response as original
            symbol_key = company_symbol.split('.')[0]

            holdings.append({
                'CompanySymbol': symbol_key,
                'CompanyName': company_name,
                'exchange': exchange,
                'LTP': market_price,
                'NumberShares': number_shares,
                "Dividends_total": Total_dividends,
                'InvestmentAmount': total_cost,
                'Total': Total_dividends + PnL,
                'Value': market_price * number_shares,
                "uPnL": ((market_price * number_shares) - total_cost),
                'PnL': PnL,
                'AverageCost': average_cost,
                'id': pk,
            })

            sum_investment_amount += investment_amount
            sum_value += market_price * number_shares
            sum_final_total += Total_dividends + PnL
            Sum_Dividends += Total_dividends

            # Stock allocation (percentages)
            if investment_amount > 0 and total_investment:
                stocks[0].append(round((investment_amount / total_investment) * 100, 2))
                stocks[1].append(company_symbol)

            # Sector-wise investment
            sector = c['sector']
            sector_wise_investment[sector] = sector_wise_investment.get(sector, 0) + investment_amount

        # --- Sector data (percentages + labels) ---
        for sec, invest in sector_wise_investment.items():
            if invest > 0 and total_investment:
                sectors[0].append(round((invest / total_investment) * 100, 2))
                sectors[1].append(sec)

        # --- Cash deposits aggregation ---
        total_initial_investment = deposit.objects.filter(
            portfolio__in=portfolios
        ).aggregate(total=Sum('total_amount'))['total'] or 0

        # --- Transactions + realized pnl annotation ---
        txns = (
            transaction.objects
            .filter(Holding__portfolio__in=portfolios)
            .select_related('Holding__portfolio')
            .annotate(portfolio_name=F('Holding__portfolio__name'))
            .order_by('date_transaction', 'id')
        )
        txns_dict = annotate_realized_pnl(list(txns))

        # --- Final metrics (mirror original context keys) ---
        context = {
            'holdings': holdings,
            'portfolioValue' : "",
            'cash': "",
            'unrealizedPnl':"",
            'unrealizedPnlPct' : 3.41225,
            'dayPnl':"",
            'dayPnlPct':"",
            'totalDividends':"",
            'dividendYieldPct':"",
            'totalReturns':"",
            'totalReturnsPct':"",
            'totalInvestment':"",
            'transactions': txns_dict,
            'Total_Value': sum_value,
            'total_cash': total_cash,
            'unadjusted_PnL': unadjusted_PnL,
            'current_growth': (unadjusted_PnL / sum_investment_amount) * 100 if sum_investment_amount else 0.0,
            'yesterday_PnL': unadjusted_PnL - y_unadjusted_PnL,
            'y_current_growth': ((unadjusted_PnL - y_unadjusted_PnL) / sum_investment_amount) * 100 if sum_investment_amount else 0.0,
            'realizedPnl': uPnL,
            'Total_dividends': Sum_Dividends,
            'Dividend_per': (Sum_Dividends / sum_investment_amount) * 100 if sum_investment_amount else 0.0,
            'Total_Returns': sum_final_total,
            'Total_Pnl_per': (sum_final_total / total_initial_investment * 100) if total_initial_investment else 0.0,
            'initial_investment': total_initial_investment,
            'overall_growth': (
                ((current_value + total_cash) - total_initial_investment) / total_initial_investment * 100
                if total_initial_investment else 0.0
            ),
            'overall_value': current_value + total_cash,
            'stocks': stocks,
            'sectors': sectors,
            'user_portfolios': [
                {'id': p.id, 'name': p.name} for p in user_portfolios
            ],
            'selected_portfolio_id': selected_portfolio_id or "all",
        }

        return Response(context, status=status.HTTP_200_OK)
