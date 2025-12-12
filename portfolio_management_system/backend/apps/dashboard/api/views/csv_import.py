from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
import csv, io
import pandas as pd
from datetime import datetime

from apps.dashboard.api.serializers.csv_import import CSVUploadSerializer
from apps.dashboard.services.csv_importer import process_csv_rows
from apps.dashboard.models import Portfolio, StockHolding, transaction,deposit, AppSecret, Ticker, TickerData


class CSVUploadAPI(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        csv_file = request.FILES['csv_file']

        try:
            decoded_file = csv_file.read().decode('utf-8')
            io_string = io.StringIO(decoded_file)
            csv_reader = list(csv.DictReader(io_string))

            df  = pd.DataFrame(csv_reader)
            df.columns = df.columns.str.replace('\ufeff', '').str.strip()
            df['Date'] = pd.to_datetime(df['Date'],dayfirst=True,format='mixed')
            df = df.sort_values(by="Date",ignore_index=0)
            df['Date'] = df['Date'].dt.strftime("%d/%m/%Y")
            for index, row in df.iterrows():
                # try:  
                symbol = row['Holding'] # String
                if symbol is None or symbol=="" :
                    continue
                trade_type = row['Type']  # String (e.g., 'buy' or 'sell')
                Exchange = row['Exchange']
                if Exchange == "AX" or Exchange =="ASX":
                    symbol = symbol + ".AX"
                quantity = float(row['Quantity'])  # Integer
                # Convert date string to Python datetime object (assuming format 'YYYY-MM-DD')
                date_str = str(row['Date'])

                date = datetime.strptime(date_str, '%d/%m/%Y') if date_str else None

                if trade_type == "Cash Deposit":

                    # cash = add_deposit(request,{
                    # 'p_id' : portfolio_id,
                    # 'currency':symbol,
                    # 'amount':quantity,
                    # 'plateform': Exchange,
                    # 'date_transaction' :date
                    # })
                    # cash.save()
                    "nothing"
                else:
                    commission = float(row['Brokerage'])  # Float
                    price = float(row['Price'])  # Float
                    # holding = update_holdings(request,{
                    # 'p_id' : portfolio_id,
                    # 'symbol':symbol,
                    # 'quantity':quantity,
                    # 'commission':commission,
                    # 'exchange': Exchange,
                    # 'trade_type':trade_type,
                    # 'price':price
                    # })
                    new_transaction = transaction.objects.create(Holding="holding", 
                                                                symbol = symbol,
                                                                date_transaction = date, 
                                                                Buy_Price = price, 
                                                                Quantity = quantity, 
                                                                Total = (price * quantity + commission) if trade_type!="sell" else price * quantity - commission,
                                                                transaction_type = trade_type, 
                                                                Commission = commission)

            return Response({
                "success": True,
                "message" : "CSV File successfully added"
            }, status=200)
        except:
            Response({
                "success": False,
                "message" : "Process failed.",
                "errors": ValueError,
            }, status=303)


class UpdateHoldingsAPI(APIView):
    """
    Triggers recalculation of investment totals.
    (Equivalent to your `portfolio.update_investment()` logic)
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        portfolios = Portfolio.objects.filter(user=request.user)
        if not portfolios.exists():
            return Response({"error": "No portfolios found"}, status=404)

        for p in portfolios:
            p.update_investment()

        return Response({"success": True, "message": "Holdings updated"})
