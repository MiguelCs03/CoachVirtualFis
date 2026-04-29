# musculos/serializers.py
from rest_framework import serializers
from .models import Musculo, DetalleMusculo, Ejercicio, EjercicioAsignado, Tipo


class TipoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tipo
        fields = ["id", "nombre", "estado"]
        read_only_fields = ["id"]


class MusculoSerializer(serializers.ModelSerializer):
    # ✅ para devolver el tipo completo además del id
    tipo_data = TipoSerializer(source="tipo", read_only=True)

    class Meta:
        model = Musculo
        fields = ["id", "nombre", "url", "tipo", "tipo_data"]
        read_only_fields = ["id", "tipo_data"]


class EjercicioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ejercicio
        fields = ["id", "nombre", "url", "estado"]
        read_only_fields = ["id"]


class EjercicioAsignadoSerializer(serializers.ModelSerializer):
    class Meta:
        model = EjercicioAsignado
        fields = ["id", "detalle_musculo", "series", "repeticiones"]
        read_only_fields = ["id"]


class DetalleMusculoSerializer(serializers.ModelSerializer):
    ejercicios_asignados = EjercicioAsignadoSerializer(many=True, read_only=True)

    # ✅ el tipo viene desde el musculo, no es FK directo acá
    tipo = TipoSerializer(source="musculo.tipo", read_only=True)

    # (opcional) si quieres devolver datos completos del musculo/ejercicio
    musculo_data = MusculoSerializer(source="musculo", read_only=True)
    ejercicio_data = EjercicioSerializer(source="ejercicio", read_only=True)

    class Meta:
        model = DetalleMusculo
        fields = [
            "id",
            "porcentaje",
            "musculo",
            "ejercicio",
            "musculo_data",
            "ejercicio_data",
            "tipo",
            "ejercicios_asignados",
        ]
        read_only_fields = ["id", "musculo_data", "ejercicio_data", "tipo", "ejercicios_asignados"]
