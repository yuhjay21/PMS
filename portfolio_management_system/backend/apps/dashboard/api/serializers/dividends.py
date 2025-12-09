from rest_framework import serializers

class DividendEventSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    company_name = serializers.CharField()
    sector = serializers.CharField()
    ex_date = serializers.CharField()
    pay_date = serializers.CharField()
    dividend = serializers.FloatField()
    quantity = serializers.IntegerField()
    total_amount = serializers.FloatField()


class DividendConfirmSerializer(serializers.Serializer):
    events = serializers.ListField(
        child=serializers.DictField(), allow_empty=False
    )
