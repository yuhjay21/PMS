import pandas as pd
import numpy as np
from datetime import datetime
from apps.dashboard.services.market_data import get_prices


def rebalance_portfolio(df, weights, frequency):
    if frequency == "none":
        return weights

    df = df.copy()

    rebalanced_weights = pd.DataFrame(index=df.index, columns=weights.keys())

    last_rebalance = None
    for date in df.index:
        if last_rebalance is None:
            rebalanced_weights.loc[date] = weights
            last_rebalance = date
            continue

        if frequency == "monthly" and date.month != last_rebalance.month:
            rebalanced_weights.loc[date] = weights
            last_rebalance = date
        elif frequency == "quarterly" and (date.month - last_rebalance.month) % 3 == 0:
            rebalanced_weights.loc[date] = weights
            last_rebalance = date
        elif frequency == "yearly" and date.year != last_rebalance.year:
            rebalanced_weights.loc[date] = weights
            last_rebalance = date
        else:
            # carry forward previous weights
            rebalanced_weights.loc[date] = rebalanced_weights.loc[last_rebalance]

    return rebalanced_weights.astype(float)


def compute_backtest_metrics(portfolio_curve):
    returns = portfolio_curve.pct_change().dropna()

    cagr = (portfolio_curve.iloc[-1] / portfolio_curve.iloc[0]) ** (252 / len(portfolio_curve)) - 1

    volatility = returns.std() * np.sqrt(252)

    sharpe = (returns.mean() * 252) / volatility if volatility != 0 else 0

    running_max = portfolio_curve.cummax()
    drawdown = (portfolio_curve - running_max) / running_max
    max_drawdown = drawdown.min()

    return {
        "CAGR": round(cagr * 100, 2),
        "Volatility": round(volatility * 100, 2),
        "Sharpe": round(sharpe, 2),
        "MaxDrawdown": round(max_drawdown * 100, 2),
    }


def run_backtest(symbols, weights, start, end, rebalance):
    df = get_prices(symbols, start=start, end=end)
    if df is None or df.empty:
        return None

    df = df.xs("Close", level=1, axis=1).bfill()

    # Calc returns
    returns = df.pct_change().fillna(0)

    # Rebalance schedule
    weight_df = rebalance_portfolio(df, weights, rebalance)

    # Portfolio curve
    port_returns = (returns * weight_df).sum(axis=1)
    portfolio_curve = (1 + port_returns).cumprod()

    metrics = compute_backtest_metrics(portfolio_curve)

    return {
        "dates": df.index.astype(str).tolist(),
        "portfolio_curve": portfolio_curve.tolist(),
        "metrics": metrics,
        "symbols": symbols,
        "weights": weights,
    }
