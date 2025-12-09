import csv
from datetime import datetime
from apps.dashboard.models import Portfolio, StockHolding, transaction


def process_csv_rows(file_obj, user):
    """
    Parses CSV and generates transactions.
    Expected CSV columns:
      symbol, date, price, qty, type, commission
    """
    print("Test in Row Processing")
    decoded = file_obj.read().decode("utf-8").splitlines()
    reader = csv.DictReader(decoded)

    responses = []
    errors = []

    for row in reader:
        try:
            print(row)
            symbol = row.get("symbol")
            buy_price = float(row.get("price", 0))
            qty = float(row.get("qty", 0))
            txn_type = row.get("type", "").strip()
            commission = float(row.get("commission", 0))
            date_txn = datetime.strptime(row.get("date"), "%Y-%m-%d").date()

            # Find user portfolios
            portfolios = Portfolio.objects.filter(user=user)
            if not portfolios.exists():
                errors.append(f"No portfolio for user, skipping {symbol}")
                continue

            portfolio = portfolios.first()

            # Create holding or load existing
            holding, created = StockHolding.objects.get_or_create(
                portfolio=portfolio,
                company_symbol=symbol,
                defaults={
                    "company_name": symbol,
                    "sector": "",
                    "Exchange": "ASX",
                }
            )

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

            responses.append(f"{symbol} OK")

        except Exception as e:
            errors.append(str(e))

    return responses, errors
