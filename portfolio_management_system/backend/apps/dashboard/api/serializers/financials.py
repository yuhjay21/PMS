from rest_framework import serializers


class FinancialsRequestSerializer(serializers.Serializer):
    symbol = serializers.CharField()


class FinancialsResponseSerializer(serializers.Serializer):
    symbol = serializers.CharField()
    company_name = serializers.CharField()
    sector = serializers.CharField()
    market_cap = serializers.FloatField(allow_null=True)
    pe_ratio = serializers.FloatField(allow_null=True)
    pb_ratio = serializers.FloatField(allow_null=True)
    eps = serializers.FloatField(allow_null=True)
    dividend_yield = serializers.FloatField(allow_null=True)
    revenue = serializers.FloatField(allow_null=True)
    net_income = serializers.FloatField(allow_null=True)
    debt_to_equity = serializers.FloatField(allow_null=True)
    roe = serializers.FloatField(allow_null=True)
