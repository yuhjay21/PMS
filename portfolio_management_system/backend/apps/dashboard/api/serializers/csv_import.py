from rest_framework import serializers
from apps.dashboard.models import Portfolio

class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    portfolio_id = serializers.IntegerField()
    reset_portfolio = serializers.BooleanField(default=True)

    def validate_file(self, file):
        # Validate extension

        if not file.name.lower().endswith(".csv"):
            raise serializers.ValidationError("Only CSV files are allowed.")

        # Validate content type (best-effort)
        if file.content_type not in [
            "text/csv",
            "application/vnd.ms-excel",
        ]:
            raise serializers.ValidationError("Invalid CSV file type.")
        return file


    def validate_portfolio_id(self, portfolio_id):
        request = self.context.get("request")
        if not Portfolio.objects.filter(
            id=portfolio_id,
            user=request.user
        ).exists():
            raise serializers.ValidationError("Invalid portfolio_id.")

        return portfolio_id
    
    
    class Meta:
        fields = ('file',)
