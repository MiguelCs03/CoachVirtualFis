from rest_framework import serializers
from .models import Usuario, Alertas


class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    is_superuser = serializers.BooleanField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    # Campos de suscripción (solo lectura para usuarios normales)
    tiene_plan_activo = serializers.BooleanField(read_only=True)
    puede_entrenar = serializers.BooleanField(read_only=True)

    class Meta:
        model = Usuario
        fields = [
            "id",
            "email",
            "username",
            "first_name",
            "last_name",
            "fecha_nacimiento",
            "genero",
            "altura",
            "peso",
            "password",
            "is_superuser",
            "is_staff",
            # Campos de suscripción
            "plan_actual",
            "fecha_expiracion_plan",
            "tiene_plan_activo",
            "puede_entrenar",
        ]
        extra_kwargs = {"email": {"required": True}}

    def create(self, validated_data):
        password = validated_data.pop("password", None)
        user = Usuario(**validated_data)
        user.set_password(password or Usuario.objects.make_random_password())
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class AlertasSerializer(serializers.ModelSerializer):
    """Usuario común: usuario=request.user; superusuario puede especificar `usuario` en el payload."""

    class Meta:
        model = Alertas
        fields = ["id", "mensaje", "fecha", "estado", "usuario", "created_at"]
        read_only_fields = ["usuario", "created_at"]
        extra_kwargs = {"estado": {"required": False}}

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if request.user.is_superuser and "usuario" in self.initial_data:
                validated_data["usuario_id"] = self.initial_data.get("usuario")
            else:
                validated_data["usuario"] = request.user
        return super().create(validated_data)
