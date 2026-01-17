from rest_framework import serializers

class DividendEventSerializer(serializers.Serializer):
    pf_id = serializers.IntegerField()
    symbol = serializers.CharField()
    ex_date = serializers.DateField()
    div_per_share = serializers.FloatField()
    shares = serializers.FloatField()
    exchange = serializers.CharField()
    total_dividend = serializers.FloatField()

class DividendConfirmSerializer(serializers.Serializer):
    events = serializers.ListField(
        child=serializers.DictField(), allow_empty=False
    )
