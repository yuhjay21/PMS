from django.db import transaction as db_transaction
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import status

import csv, io
import pandas as pd
from datetime import datetime

from apps.dashboard.api.serializers.csv_import import CSVUploadSerializer
from apps.dashboard.models import Portfolio, StockHolding, transaction as TxnModel, deposit as DepositModel
from apps.dashboard.services.csv_importer import process_csv_rows  # recommended to move logic here


class CSVUploadAPI(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser)
    
    def post(self, request):
        serializer = CSVUploadSerializer(data=request.data, context={"request": request})

        serializer.is_valid(raise_exception=True)
        csv_file = serializer.validated_data["file"]
        portfolio_id = serializer.validated_data["portfolio_id"]
        reset_portfolio = serializer.validated_data["reset_portfolio"]

        # IMPORTANT: scope portfolio to the user
        portfolio = get_object_or_404(Portfolio, id=portfolio_id, user=request.user)
        # Read file safely
        try:
            decoded = csv_file.read().decode("utf-8-sig")  # utf-8-sig handles BOM
        except Exception as e:
            return Response(
                {"success": False, "message": "Could not read CSV file", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Parse CSV -> DataFrame
        try:
            io_string = io.StringIO(decoded)
            rows = list(csv.DictReader(io_string))

            if not rows:
                return Response(
                    {"success": False, "message": "CSV contains no data rows"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            df = pd.DataFrame(rows)
            df.columns = df.columns.str.strip()

            if "Date" not in df.columns:
                return Response(
                    {"success": False, "message": "CSV missing required column: Date"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            df["Date"] = pd.to_datetime(df["Date"], dayfirst=True, format="mixed", errors="coerce")
            if df["Date"].isna().any():
                bad = df[df["Date"].isna()].head(5).to_dict(orient="records")
                return Response(
                    {"success": False, "message": "Some Date values could not be parsed", "examples": bad},
                    status=status.HTTP_400_BAD_REQUEST
                )

            df = df.sort_values(by="Date", ignore_index=True)
            df["Date"] = df["Date"].dt.strftime("%d/%m/%Y")

        except Exception as e:
            return Response(
                {"success": False, "message": "CSV parsing failed", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        # ✅ Atomic: either all imports apply, or none do
        try:
            with db_transaction.atomic():

                if reset_portfolio:
                    # Only wipe AFTER we know parsing worked
                    portfolio.total_investment = 0
                    portfolio.total_amount = 0
                    portfolio.save(update_fields=["total_investment", "total_amount"])

                    StockHolding.objects.filter(portfolio__id=portfolio_id).delete()
                    DepositModel.objects.filter(portfolio__id=portfolio_id).delete()
                    TxnModel.objects.filter(Holding__portfolio__id=portfolio_id).delete()  # if txn has portfolio FK
                # Prefer to move this into services/csv_importer.py
                result = process_csv_rows(
                    file_obj=df,
                    pf_id=portfolio_id,
                )

            return Response(
                {"success": True, "message": "CSV File successfully added", "result": result},
                status=status.HTTP_201_CREATED
            )

        except Exception as e:
            return Response(
                {"success": False, "message": "Process failed", "error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class TransactionFormAPI(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = (JSONParser, FormParser)

    def post(self, request):
        data = request.data
        portfolio_id = data.get("p_id")
        symbol = data.get("symbol")
        exchange = data.get("exchange")
        transaction_type = data.get("transaction_type")
        price = data.get("price", 0)
        quantity = data.get("quantity", 0)
        brokerage = data.get("brokerage", 0)
        date_str = data.get("date_transaction")

        if not portfolio_id:
            return Response({"success": False, "message": "Portfolio ID is required"}, status=400)

        portfolio = get_object_or_404(Portfolio, id=portfolio_id, user=request.user)

        try:
            parsed_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        except (TypeError, ValueError):
            return Response(
                {"success": False, "message": "Invalid transaction date"},
                status=400,
            )

        row = {
            "Holding": symbol,
            "Exchange": exchange,
            "Price": price,
            "Quantity": quantity,
            "Type": transaction_type,
            "Brokerage": brokerage,
            "Date": parsed_date.strftime("%d/%m/%Y"),
        }
        df = pd.DataFrame([row])
        responses, errors = process_csv_rows(file_obj=df, pf_id=portfolio.id)

        if errors:
            return Response(
                {"success": False, "message": "Transaction import failed", "errors": errors},
                status=400,
            )

        return Response(
            {"success": True, "message": "Transaction added", "result": responses},
            status=status.HTTP_201_CREATED,
        )


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