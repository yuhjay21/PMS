from rest_framework import serializers

class CSVUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        print(value)
        if value is None: return None
        try:
            print(value)
            return int(value)
        except (ValueError, TypeError):
            raise serializers.ValidationError("Must be a valid Integer")
        

    class Meta:
        fields = ('file',)
