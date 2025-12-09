from rest_framework import serializers


class StakeFetchRequestSerializer(serializers.Serializer):
    # optional: filter by portfolio, 'all' = all portfolios
    portfolio = serializers.CharField(required=False, allow_blank=True, default="all")


class StakeTradeSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    price = serializers.FloatField()
    quantity = serializers.IntegerField()
    commission = serializers.FloatField()
    trade_type = serializers.CharField()
    trade_date = serializers.CharField()  # ISO date string


class ConfirmTradeSerializer(serializers.Serializer):
    portfolio_id = serializers.IntegerField()
    symbol = serializers.CharField()
    price = serializers.FloatField()
    quantity = serializers.IntegerField()
    trade_type = serializers.CharField()
    commission = serializers.FloatField(required=False, default=0)
    trade_date = serializers.CharField()  # ISO date string "YYYY-MM-DD"
