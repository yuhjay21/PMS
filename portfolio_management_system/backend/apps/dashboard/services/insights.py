from apps.dashboard.models import StockHolding, Portfolio
from collections import defaultdict


def calculate_portfolio_insights(user, portfolio_id):
    portfolios = Portfolio.objects.filter(user=user)
    if portfolio_id != "all":
        portfolios = portfolios.filter(id=portfolio_id)

    holdings = StockHolding.objects.filter(portfolio__in=portfolios)

    if not holdings.exists():
        return None

    total_value = sum([h.market_value for h in holdings if h.market_value])

    sectors = defaultdict(float)
    holdings_map = {}
    growth_score = 0
    dividend_score = 0

    for h in holdings:
        if not h.market_value:
            continue

        weight = h.market_value / total_value

        sectors[h.sector] += weight

        holdings_map[h.company_symbol] = weight

        # You probably have better scoring logic. This is placeholder:
        growth_score += weight * h.beta if hasattr(h, "beta") else 0
        dividend_score += weight * (h.dividend_yield or 0)

    diversification_score = 1 - max(holdings_map.values())

    top_positions = sorted(
        [{"symbol": k, "weight": v} for k, v in holdings_map.items()],
        key=lambda x: x["weight"],
        reverse=True,
    )[:5]

    return {
        "sectors": sectors,
        "holdings": holdings_map,
        "diversification_score": round(diversification_score * 100, 2),
        "growth_score": round(growth_score, 2),
        "dividend_score": round(dividend_score, 2),
        "top_positions": top_positions
    }
