from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.api.serializers.csv_import import CSVUploadSerializer
from apps.dashboard.services.csv_importer import process_csv_rows
from apps.dashboard.models import Portfolio


class CSVUploadAPI(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        serializer = CSVUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        print("Testing before")

        file_obj = serializer.validated_data["file"]

        responses, errors = process_csv_rows(file_obj, request.user)

        return Response({
            "success": True,
            "processed": responses,
            "errors": errors,
        }, status=200)


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
