from rest_framework import serializers
from apps.dashboard.models import transaction

class TransactionSerializer(serializers.ModelSerializer):
    portfolio_name = serializers.CharField(read_only=True)

    class Meta:
        model = transaction
        fields = "__all__"   # or list fields explicitly