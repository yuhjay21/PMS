from rest_framework import serializers


class PortfolioInsightsResponseSerializer(serializers.Serializer):
    sectors = serializers.DictField(child=serializers.FloatField())
    holdings = serializers.DictField(child=serializers.FloatField())
    diversification_score = serializers.FloatField()
    growth_score = serializers.FloatField()
    dividend_score = serializers.FloatField()
    top_positions = serializers.ListField()
