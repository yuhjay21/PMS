from django.urls import path
from apps.dashboard.api.views.portfolio import DashboardHoldingsAPI
from apps.dashboard.api.views.performance import PortfolioPerformanceAPI
from apps.dashboard.api.views.dividends import CheckDividendsAPI,ConfirmDividendAPI,ConfirmMultipleDividendsAPI
from apps.dashboard.api.views.csv_import import CSVUploadAPI,UpdateHoldingsAPI
from apps.dashboard.api.views.emails import FetchStakeEmailsAPI,ConfirmStakeTransactionAPI
from apps.dashboard.api.views.prices import UpdatePricesAPI,PriceHistoryAPI, UpdatePortfolioTickersAPI
from apps.dashboard.api.views.financials import FinancialsAPI
from apps.dashboard.api.views.insights import PortfolioInsightsAPI
from apps.dashboard.api.views.backtesting import BacktestingAPI

urlpatterns = [
    path("holdings/", DashboardHoldingsAPI.as_view(), name="dashboard_holdings"),
    path("performance/", PortfolioPerformanceAPI.as_view(), name="dashboard_performance"),

    # Dividends
    path("dividends/check/", CheckDividendsAPI.as_view(), name="dividends_check"),
    path(
        "dividends/confirm/<str:symbol>/<str:ex_date>/",
        ConfirmDividendAPI.as_view(),
        name="dividends_confirm"
    ),
    path(
        "dividends/confirm-multiple/",
        ConfirmMultipleDividendsAPI.as_view(),
        name="dividends_confirm_multiple"
    ),

    #CSV Import
    path("csv/upload/", CSVUploadAPI.as_view(), name="csv_upload"),
    path("csv/update-holdings/", UpdateHoldingsAPI.as_view(), name="csv_update_holdings"),

    #Emails
    path("emails/fetch-stake/", FetchStakeEmailsAPI.as_view(), name="emails_fetch_stake"),
    path("emails/confirm-transaction/", ConfirmStakeTransactionAPI.as_view(), name="emails_confirm_transaction"),

    #Prices
    path("prices/update/", UpdatePricesAPI.as_view(), name="prices_update"),
    path("prices/history/", PriceHistoryAPI.as_view(), name="prices_history"),
    path("prices/update-portfolio/", UpdatePortfolioTickersAPI.as_view(), name="update_portfolio_tickers"),


    #Insights + Financials
    path("financials/", FinancialsAPI.as_view(), name="financials"),
    path("insights/", PortfolioInsightsAPI.as_view(), name="portfolio_insights"),

    #Backtesting
    path("backtesting/", BacktestingAPI.as_view(), name="backtesting_api"),
]