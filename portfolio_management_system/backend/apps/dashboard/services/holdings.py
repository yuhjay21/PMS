# dashboard/services/holdings.py

import yfinance as yf
from apps.dashboard.models import Portfolio, StockHolding


def buy_holding(holding, portfolio_id, price, quantity, commission):
    """Refactored Buy_holding logic from views.py"""
    total_cost = holding.average_buy_price * holding.number_of_shares + (price * quantity) + commission
    new_quantity = holding.number_of_shares + quantity
    new_avg_price = total_cost / new_quantity if new_quantity else 0.0

    holding.number_of_shares = new_quantity
    holding.average_buy_price = new_avg_price
    holding.total_cost += (price * quantity + commission)
    holding.investment_amount = holding.total_cost
    holding.LTP = price
    holding.save()

    # Update cash portfolio
    cash = Portfolio.objects.get(id=portfolio_id, currency="AUD", plateform="STAKE")
    cash.total_amount -= (price * quantity)
    cash.total_amount -= commission
    cash.total_investment += (price * quantity)
    cash.save()

    return holding


def sell_holding(holding, portfolio_id, price, quantity, commission):
    """Refactored Sell_holding logic from views.py"""
    if quantity > holding.number_of_shares:
        raise ValueError(f"Cannot sell {quantity} — only {holding.number_of_shares} available.")

    total_cost = (holding.average_buy_price * holding.number_of_shares) - (price * quantity)
    holding.number_of_shares -= quantity

    new_quantity = holding.number_of_shares
    new_avg_price = total_cost / new_quantity if new_quantity else 0.0

    holding.total_cost -= (price * quantity)
    holding.total_cost += commission
    holding.LTP = price

    if new_quantity <= 0:
        holding.Realized_PnL += holding.total_cost * -1
        holding.UnRealized_PnL = 0
        holding.investment_amount = 0
        holding.total_cost = 0
        holding.average_buy_price = 0
    else:
        holding.investment_amount = total_cost
        holding.average_buy_price = new_avg_price

    holding.save()

    # Update cash portfolio
    cash = Portfolio.objects.get(id=portfolio_id, currency="AUD", plateform="STAKE")
    cash.total_amount += (price * quantity)
    cash.total_amount -= commission
    cash.total_investment -= (price * quantity)
    cash.save()

    return holding


def update_holdings(user, holding_data):
    """
    Clean service-layer replacement for update_holdings() originally located in views.py.
    Source logic from:
      - update_holdings in views.py lines 44–76 
      - continuation lines 15–72  

    Parameters:
        user: request.user (passed from API)
        holding_data: {
            "p_id": int,
            "symbol": "BHP.AX",
            "quantity": float,
            "commission": float,
            "exchange": "ASX",
            "trade_type": "Buy" or "Sell" or "Dividend Reinvestment",
            "price": float
        }
    """

    portfolio_id = holding_data["p_id"]
    portfolio = Portfolio.objects.get(id=portfolio_id)

    symbol = holding_data["symbol"]
    quantity = holding_data["quantity"]
    price = holding_data["price"]
    commission = holding_data["commission"]
    exchange = holding_data["exchange"]
    trade_type = holding_data["trade_type"]

    holdings = StockHolding.objects.filter(portfolio=portfolio)

    # 1️⃣ Check existing holding
    for holding in holdings:
        if holding.company_symbol == symbol:
            if trade_type in ("Buy", "Dividend Reinvestment"):
                return buy_holding(holding, portfolio_id, price, quantity, commission)
            elif trade_type == "Sell":
                return sell_holding(holding, portfolio_id, price, quantity, commission)

    # 2️⃣ Create NEW holding (from retrieved logic)
    info = yf.Ticker(symbol).info
    sector = info.get("sector", "N/A")
    company_name = info.get("longName", symbol)

    holding = StockHolding.objects.create(
        portfolio=portfolio,
        company_symbol=symbol,
        company_name=company_name,
        sector=sector,
        Exchange=exchange,
        number_of_shares=quantity,
        investment_amount=quantity * price,
        average_buy_price=price,
        LTP=price,
        total_cost=(quantity * price) + commission,
    )

    # Update cash for new holding purchase
    cash = Portfolio.objects.get(id=portfolio_id, currency="AUD")
    cash.total_amount -= (price * quantity)
    cash.total_amount -= commission
    cash.total_investment += (price * quantity)
    cash.save()

    return holding
