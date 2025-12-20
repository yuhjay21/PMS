from rest_framework import serializers
from apps.dashboard.models import Portfolio


class PortfolioSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    description = serializers.CharField()
    currency = serializers.CharField()
    platform = serializers.CharField()

