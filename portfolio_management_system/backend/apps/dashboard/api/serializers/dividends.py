from rest_framework import serializers

class DividendEventSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    ex_date = serializers.DateField()
    div_per_share = serializers.FloatField()
    shares = serializers.FloatField()
    total_dividend = serializers.FloatField()

class DividendConfirmSerializer(serializers.Serializer):
    events = serializers.ListField(
        child=serializers.DictField(), allow_empty=False
    )
