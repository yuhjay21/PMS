from rest_framework import serializers

class BacktestRequestSerializer(serializers.Serializer):
    symbols = serializers.ListField(child=serializers.CharField())
    weights = serializers.DictField(child=serializers.FloatField())
    start = serializers.DateField()
    end = serializers.DateField()
    rebalance = serializers.ChoiceField(
        choices=["none", "monthly", "quarterly", "yearly"], default="none"
    )
