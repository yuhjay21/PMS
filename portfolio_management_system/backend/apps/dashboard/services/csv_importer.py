import csv
from datetime import datetime
from apps.dashboard.models import Portfolio, StockHolding, transaction, deposit
from apps.dashboard.services.holdings import update_holdings, buy_holding, sell_holding


def process_csv_rows(file_obj, pf_id):
    """
    Parses CSV and generates transactions.
    Expected CSV columns:
      symbol, date, price, qty, type, commission
    """
    #decoded = file_obj.read().decode("utf-8").splitlines()
    #reader = csv.DictReader(decoded)

    responses = []
    errors = []
    for index, row in file_obj.iterrows():
        try:
            symbol = row.get("Holding")
            exchange = row.get("Exchange")
            buy_price = float(row.get("Price", 0) or 0)
            qty = float(row.get("Quantity", 0))
            txn_type = row.get("Type", "").strip()
            commission = float(row.get("Brokerage", 0) or 0)
            date_txn = datetime.strptime(row.get("Date"), "%d/%m/%Y").date()
            # Find user portfolios
            portfolios = Portfolio.objects.filter(id=pf_id)
            if not portfolios.exists():
                errors.append(f"No portfolio for user, skipping {symbol}")
                continue

            portfolio = portfolios.first()
   
            # Create holding or load existing
            print(f"{symbol} | {txn_type} | {date_txn} | {portfolio.total_amount}")
            if txn_type == "Cash Deposit":
                if portfolio.currency.upper() != symbol.upper() or portfolio.platform.upper() != exchange.upper():
                    errors.append(f" Portfolio with Symbol ({symbol}) & Plateform ({exchange}) doesnt exist")
                    continue
                portfolio.total_amount += qty
                deposit.objects.create(
                    portfolio = portfolio,
                    currency = symbol,
                    plateform = exchange,
                    total_amount = qty,
                    date_transaction = date_txn
                )
                #print(f"{symbol} | {txn_type} | {date_txn} | {qty} | {portfolio.total_amount}")
                portfolio.save()
            else:
                holding, created = StockHolding.objects.get_or_create(
                    portfolio=portfolio,
                    company_symbol=symbol,
                    defaults={
                        "company_name": symbol,
                        "sector": "",
                        "Exchange": exchange,
                    }
                )
                Holding_Data = update_holdings(
                    holding,
                    {'p_id'      :pf_id,
                    'symbol'    :symbol,
                    'quantity'  :qty,
                    'commission':commission,
                    'exchange'  :exchange,
                    'trade_type':txn_type,
                    'price'     :buy_price}
                )
                
                Holding_Data.save()
                # Create transaction
                transaction.objects.create(
                    Holding=holding,
                    symbol=symbol,
                    date_transaction=date_txn,
                    Buy_Price=buy_price,
                    Quantity=qty,
                    Total=qty * buy_price,
                    transaction_type=txn_type,
                    Commission=commission,
                )

            responses.append(f"{symbol}-{date_txn} OK")

        except Exception as e:
            #print(row.get("Holding"), str(e))
            errors.append(str(e))
            break
    return responses, errors
