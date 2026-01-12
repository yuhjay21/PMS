from datetime import date

from django.db.models import Sum, F
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView

from apps.dashboard.models import Portfolio, transaction, deposit
from apps.dashboard.services.pnl import annotate_realized_pnl


def financial_years_since(start_date):
    if not start_date:
        return []

    if start_date.month >= 7:
        start_year = start_date.year
    else:
        start_year = start_date.year - 1

    today = date.today()
    if today.month >= 7:
        end_start_year = today.year
    else:
        end_start_year = today.year - 1

    years = []
    for year in range(start_year, end_start_year + 1):
        end_suffix = str(year + 1)[-2:]
        years.append(f"FY{year}-{end_suffix}")

    return years


def safe_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


class TaxOverviewAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        selected_portfolio_id = request.GET.get("portfolio") or "all"
        selected_fy = request.GET.get("fy") or "max"

        user_portfolios = Portfolio.objects.filter(user=request.user)
        if not user_portfolios.exists():
            return Response({"detail": "No Portfolio Exist for this user"}, status=status.HTTP_404_NOT_FOUND)

        if selected_portfolio_id != "all":
            portfolios = user_portfolios.filter(id=selected_portfolio_id)
            if not portfolios.exists():
                return Response({"detail": "Portfolio not found."}, status=status.HTTP_404_NOT_FOUND)
        else:
            portfolios = user_portfolios

        txns_qs = (
            transaction.objects
            .filter(Holding__portfolio__in=portfolios)
            .select_related("Holding__portfolio")
            .annotate(portfolio_name=F("Holding__portfolio__name"))
            .order_by("date_transaction", "id")
        )

        if not txns_qs.exists():
            return Response({"detail": "No transactions found"}, status=status.HTTP_404_NOT_FOUND)

        pf_start_date = txns_qs.order_by("date_transaction").first().date_transaction
        financial_years = financial_years_since(pf_start_date)

        if not financial_years:
            return Response({"detail": "No financial years available"}, status=status.HTTP_404_NOT_FOUND)

        if selected_fy == "max":
            start_year = int(financial_years[0].replace("FY", "").strip().split("-")[0])
            end_suffix = financial_years[-1].replace("FY", "").strip().split("-")[1]
            end_year = int(f"20{end_suffix}")
        else:
            fy = selected_fy.replace("FY", "").strip()
            start_year, end_suffix = fy.split("-")
            start_year = int(start_year)
            end_year = int(f"20{end_suffix}")

        start_date = date(start_year, 7, 1)
        end_date = date(end_year, 6, 30)

        txns_data = list(
            txns_qs.values(
                "id",
                "symbol",
                "date_transaction",
                "Buy_Price",
                "Quantity",
                "Total",
                "transaction_type",
                "Commission",
                "portfolio_name",
            )
        )

        txns_dict = annotate_realized_pnl(txns_data)
        txns_filtered = [
            t for t in txns_dict
            if start_date <= t["date_transaction"] <= end_date
        ]

        deposits_sum = deposit.objects.filter(
            portfolio__in=portfolios,
            date_transaction__range=[start_date, end_date],
        ).aggregate(total=Sum("total_amount"))["total"] or 0

        capital_growth = 0
        dividends_paid = 0
        for txn in txns_filtered:
            capital_growth += txn.get("realized_pnl") or 0
            dividends_paid += txn.get("dividends_paid") or 0

        capital_growth = safe_float(capital_growth)
        dividends_paid = safe_float(dividends_paid)

        response = {
            "financial_years": financial_years,
            "selected_fy": selected_fy,
            "deposits": safe_float(deposits_sum),
            "capital_growth": capital_growth,
            "dividends": dividends_paid,
            "total": safe_float(capital_growth + dividends_paid),
            "transactions": txns_filtered,
            "user_portfolios": [
                {"id": portfolio.id, "name": portfolio.name}
                for portfolio in user_portfolios
            ],
            "selected_portfolio_id": selected_portfolio_id or "all",
        }

        return Response(response, status=status.HTTP_200_OK)