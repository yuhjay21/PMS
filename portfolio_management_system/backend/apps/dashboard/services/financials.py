import yfinance as yf

def fetch_company_financials(symbol):
    """
    Replaces your legacy get_financials view.
    Returns standardized financial metrics for API.
    """
    try:
        ticker = yf.Ticker(symbol)

        info = ticker.info or {}

        return {
            "symbol": symbol,
            "company_name": info.get("longName") or symbol,
            "sector": info.get("sector") or "",
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "pb_ratio": info.get("priceToBook"),
            "eps": info.get("trailingEps"),
            "dividend_yield": info.get("dividendYield"),
            "revenue": info.get("totalRevenue"),
            "net_income": info.get("netIncome"),
            "debt_to_equity": info.get("debtToEquity"),
            "roe": info.get("returnOnEquity"),
        }

    except Exception:
        return None
