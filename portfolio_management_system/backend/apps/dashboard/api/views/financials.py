from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.api.serializers.financials import (
    FinancialsRequestSerializer,
    FinancialsResponseSerializer
)
from apps.dashboard.services.financials import fetch_company_financials


class FinancialsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = FinancialsRequestSerializer(data=request.GET)
        serializer.is_valid(raise_exception=True)

        symbol = serializer.validated_data["symbol"]

        data = fetch_company_financials(symbol)
        if not data:
            return Response(
                {"error": "Could not fetch financials"},
                status=status.HTTP_400_BAD_REQUEST
            )

        out = FinancialsResponseSerializer(data)
        return Response(out.data)
