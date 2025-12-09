from rest_framework import serializers
from apps.dashboard.models import StockHolding, Portfolio

class HoldingSerializer(serializers.Serializer):
    CompanySymbol = serializers.CharField()
    CompanyName = serializers.CharField()
    exchange = serializers.CharField()
    LTP = serializers.FloatField()
    NumberShares = serializers.IntegerField()
    Dividends_total = serializers.FloatField()
    InvestmentAmount = serializers.FloatField()
    Total = serializers.FloatField()
    Value = serializers.FloatField()
    uPnL = serializers.FloatField()
    PnL = serializers.FloatField()
    AverageCost = serializers.FloatField()
    id = serializers.IntegerField()
