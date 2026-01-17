# dashboard/services/holdings.py

import yfinance as yf
from apps.dashboard.models import Portfolio, StockHolding
from django.db import transaction

def buy_holding(holding, portfolio_id, price, quantity, commission):
    """Refactored Buy_holding logic from views.py"""
    old_qty = float(holding.number_of_shares or 0)
    old_cost = float(holding.total_cost or 0)

    added_cost = (price * quantity) + commission
    new_cost = old_cost + added_cost
    new_qty = old_qty + quantity
    new_avg = (new_cost / new_qty) if new_qty else 0.0

    holding.number_of_shares = new_qty
    holding.total_cost = new_cost
    holding.investment_amount = new_cost
    holding.average_buy_price = new_avg
    holding.LTP = price
    holding.save()

    cash = Portfolio.objects.get(id=portfolio_id, currency="AUD", platform="STAKE")
    cash.total_amount -= added_cost
    cash.total_investment += (price * quantity)
    cash.save()
    
    return holding


def sell_holding(holding, portfolio_id, price, quantity, commission):
    """Refactored Sell_holding logic from views.py"""
    if quantity > holding.number_of_shares:
        raise ValueError(f"Cannot sell {quantity} — only {holding.number_of_shares} available.")

    old_qty = float(holding.number_of_shares)
    avg = float(holding.average_buy_price or 0)

    # Cost basis removed for the sold shares
    cost_removed = avg * quantity

    # Sale proceeds (minus commission)
    proceeds = (price * quantity) - commission

    # Realized PnL = proceeds - cost_removed
    realized = proceeds - cost_removed

    # Update shares
    new_qty = old_qty - quantity
    holding.number_of_shares = new_qty
    holding.LTP = price

    # Update totals
    holding.total_cost = max(float(holding.total_cost or 0) - cost_removed, 0)
    holding.investment_amount = holding.total_cost

    holding.Realized_PnL = float(getattr(holding, "Realized_PnL", 0) or 0) + realized

    if new_qty <= 0:
        holding.average_buy_price = 0
        holding.UnRealized_PnL = 0
        holding.total_cost = 0
        holding.investment_amount = 0

    holding.save()

    cash = Portfolio.objects.get(id=portfolio_id, currency="AUD", platform="STAKE")
    cash.total_amount += proceeds
    # If your "total_investment" means "net capital invested", reduce by cost basis removed (not proceeds)
    cash.total_investment = float(cash.total_investment or 0) - cost_removed
    cash.save()

    return holding


def update_holdings(holding, holding_data):
    portfolio_id = holding_data["p_id"]
    portfolio = Portfolio.objects.get(id=portfolio_id)

    symbol = holding_data["symbol"]
    quantity = float(holding_data["quantity"])
    price = float(holding_data["price"])
    commission = float(holding_data.get("commission") or 0)
    exchange = holding_data["exchange"] if holding_data["exchange"]!= 0 else 0
    trade_type = holding_data["trade_type"]

    # Fast path: existing holding object passed in
    # if holding and holding.company_symbol == symbol:
    #     if trade_type in ("Buy", "Dividend Reinvestment"):
    #         return buy_holding(holding, portfolio_id, price, quantity, commission)
    #     if trade_type == "Sell":
    #         return sell_holding(holding, portfolio_id, price, quantity, commission)
    #     # Dividend Deposit falls through (cash-only)

    with transaction.atomic():
        holding_obj, created = StockHolding.objects.select_for_update().get_or_create(
            portfolio=portfolio,
            company_symbol=symbol,
            Exchange=exchange,
            defaults={
                "company_name": symbol,
                "sector": "",
                "number_of_shares": 0,
                "average_buy_price": 0,
                "total_cost": 0,
                "investment_amount": 0,
                "LTP": price,
            },
        )

        # Only enrich metadata if missing (never overwrite with "")
        if not holding_obj.sector or not holding_obj.company_name or holding_obj.company_name == symbol:
            try:
                if exchange=="ASX":
                    info = yf.Ticker(symbol+".AX").info or {}
                else:
                    info = yf.Ticker(symbol).info or {}
                holding_obj.sector = info.get("sector") or holding_obj.sector or "N/A"
                holding_obj.company_name = info.get("longName") or holding_obj.company_name or symbol
            except Exception:
                holding_obj.sector = holding_obj.sector or "N/A"
                holding_obj.company_name = holding_obj.company_name or symbol

        # Keep cash selection consistent with your buy/sell functions
        cash = Portfolio.objects.select_for_update().get(
            id=portfolio_id, currency="AUD", platform="STAKE"
        )
        holding_obj.save()
        if trade_type in ("Buy", "Dividend Reinvestment"):
            #print(f"{symbol} | {trade_type} | {(quantity*price) + commission} | {portfolio.total_amount}")
            return buy_holding(holding_obj, portfolio_id, price, quantity, commission)

        if trade_type == "Sell":
            #print(f"{symbol} | {trade_type} | {(quantity*price) - commission} | {portfolio.total_amount}")
            return sell_holding(holding_obj, portfolio_id, price, quantity, commission)

        if trade_type == "Dividend Deposit":
            # Here: amount = price * qty (as you confirmed)
            amount = (price * quantity)

            # commission usually shouldn't apply to dividends, but if you do have it:
            amount_after_commission = amount - commission

            cash.total_amount += amount_after_commission
            cash.save()

            # Optional: track dividends on holding (if you have a field)
            if hasattr(holding_obj, "Total_dividends"):
                holding_obj.Total_dividends = float(holding_obj.Total_dividends or 0) + amount_after_commission

            # Do NOT change shares/avg price/cost basis
            return holding_obj

        raise ValueError(f"Unsupported trade_type: {trade_type}")
