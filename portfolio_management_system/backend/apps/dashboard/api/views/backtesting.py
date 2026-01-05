from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.api.serializers.backtesting import BacktestRequestSerializer
from apps.dashboard.services.backtest import run_backtest


class BacktestingAPI(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self,request):

        return Response("Test Done")
    
    def post(self, request):
        serializer = BacktestRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        symbols = serializer.validated_data["symbols"]
        weights = serializer.validated_data["weights"]
        start = serializer.validated_data["start"]
        end = serializer.validated_data["end"]
        rebalance = serializer.validated_data["rebalance"]

        if abs(sum(weights.values()) - 1.0) > 0.001:
            return Response(
                {"error": "Weights must sum to 1.0"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = run_backtest(symbols, weights, start, end, rebalance)

        if not data:
            return Response(
                {"error": "Could not fetch price data"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(data)
