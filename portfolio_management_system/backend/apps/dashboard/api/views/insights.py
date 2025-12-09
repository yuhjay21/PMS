from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from apps.dashboard.services.insights import calculate_portfolio_insights
from apps.dashboard.api.serializers.insights import PortfolioInsightsResponseSerializer


class PortfolioInsightsAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        portfolio_id = request.GET.get("portfolio", "all")

        data = calculate_portfolio_insights(request.user, portfolio_id)
        if not data:
            return Response({"error": "No holdings"}, status=400)

        return Response(data)
