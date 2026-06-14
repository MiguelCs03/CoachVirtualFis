from rest_framework import serializers
from .models import Rutina


class RutinaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rutina
        fields = "__all__"
        read_only_fields = ["usuario", "created_at", "updated_at"]
