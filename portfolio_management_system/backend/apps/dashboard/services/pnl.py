# dashboard/services/pnl.py

from collections import defaultdict
from decimal import Decimal
from typing import Iterable, List


def annotate_realized_pnl(txns: Iterable) -> List:
    """
    Adds `realized_pnl` and `dividends_paid` attributes to each transaction
    in a queryset or list, using FIFO matching of buys to sells.

    Behaviour (same as original in dashboard.views):
      - For Buy transactions:
            t.realized_pnl = None
            t.dividends_paid = None
      - For Sell transactions:
            t.realized_pnl = FIFO realized PnL (Decimal, rounded to 2 dp)
            t.dividends_paid = None
      - For Dividend Deposit / Dividend Reinvestment:
            t.realized_pnl = None
            t.dividends_paid = Total (rounded to 2 dp)
      - Else:
            both set to None

    The function mutates the transaction objects and also returns them
    as a list sorted by (date_transaction, id).

    Expected transaction fields:
        t.symbol
        t.date_transaction
        t.id
        t.Quantity
        t.Buy_Price
        t.Commission
        t.transaction_type
        t.Total (for dividend transactions)
    """
    # Sort by symbol + date to ensure FIFO order
    txns = sorted(txns, key=lambda t: (t["symbol"], t["date_transaction"], t["id"]))

    # FIFO buy lots per symbol
    buys = defaultdict(list)

    for t in txns:
        qty = Decimal(t["Quantity"])
        price = Decimal(t["Buy_Price"])
        commission = Decimal(t["Commission"] or 0)

        if t["transaction_type"] == "Buy":
            # store buy lots
            buys[t["symbol"]].append(
                {
                    "qty": qty,
                    "price": price,
                    "commission": commission,
                }
            )
            t["realized_pnl"] = None  # empty for buys
            t["dividends_paid"] = None  # empty for buys

        elif t["transaction_type"] == "Sell":
            remaining_to_sell = qty
            sell_price = price
            sell_commission = commission
            pnl = Decimal(0)

            # FIFO matching
            while remaining_to_sell > 0 and buys[t["symbol"]]:
                buy_lot = buys[t["symbol"]][0]

                sell_qty = min(remaining_to_sell, buy_lot["qty"])

                cost_basis = (sell_qty * buy_lot["price"]) + buy_lot["commission"]
                sell_value = sell_qty * sell_price
                pnl += (sell_value - cost_basis)

                buy_lot["qty"] -= sell_qty
                # After first use, remaining commission is effectively consumed
                buy_lot["commission"] = 0
                remaining_to_sell -= sell_qty

                if buy_lot["qty"] <= 0:
                    buys[t["symbol"]].pop(0)

            # subtract sell commission
            pnl -= sell_commission

            t["realized_pnl"]= round(pnl, 2)
            t["dividends_paid"] = None  # empty for sells

        elif t["transaction_type"] in ("Dividend Deposit", "Dividend Reinvestment"):
            t["realized_pnl"] = None
            t["dividends_paid"] = round(Decimal(t["Total"]), 2)

        else:
            t["realized_pnl"] = None
            t["dividends_paid"] = None

    # Sort back into date order for reporting
    txns = sorted(txns, key=lambda t: (t["date_transaction"], t["id"]))
    return txns
