from django.db import models
from django.conf import settings
from django.utils import timezone


class Rutina(models.Model):
    OBJETIVO_CHOICES = [
        ("fuerza", "Fuerza"),
        ("hipertrofia", "Hipertrofia"),
        ("perdida_peso", "Pérdida de Peso"),
        ("resistencia", "Resistencia"),
        ("movilidad", "Movilidad"),
        ("rehabilitacion", "Rehabilitación"),
    ]
    NIVEL_CHOICES = [
        ("principiante", "Principiante"),
        ("intermedio", "Intermedio"),
        ("avanzado", "Avanzado"),
    ]
    CATEGORIA_CHOICES = [
        ("gimnasio", "Gimnasio"),
        ("fisioterapia", "Fisioterapia"),
    ]

    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="rutinas")
    nombre = models.CharField(max_length=255)
    descripcion = models.TextField(blank=True)
    objetivo = models.CharField(max_length=50, choices=OBJETIVO_CHOICES, default="fuerza")
    nivel = models.CharField(max_length=20, choices=NIVEL_CHOICES, default="intermedio")
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES, default="gimnasio")
    parte_cuerpo = models.CharField(max_length=100, default="cuerpo completo")
    dias_por_semana = models.IntegerField(default=3)
    duracion_minutos = models.IntegerField(default=45)
    progreso = models.IntegerField(default=0)
    datos_rutina = models.JSONField(blank=True, null=True)
    generada_por_ia = models.BooleanField(default=False)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Rutina"
        verbose_name_plural = "Rutinas"
        db_table = "rutinas"
        ordering = ["-created_at"]

    def __str__(self):
        return self.nombre


class SesionEntrenamiento(models.Model):
    usuario = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sesiones")
    rutina = models.ForeignKey(Rutina, on_delete=models.CASCADE, related_name="sesiones", blank=True, null=True)
    fecha = models.DateTimeField(default=timezone.now)
    fecha_fin = models.DateTimeField(blank=True, null=True)
    duracion_minutos = models.IntegerField(default=0)
    calorias_quemadas = models.IntegerField(default=0)
    ejercicios_completados = models.IntegerField(default=0)
    notas = models.TextField(blank=True)
    datos_sesion = models.JSONField(blank=True, null=True)
    estado = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Sesión de Entrenamiento"
        verbose_name_plural = "Sesiones de Entrenamiento"
        db_table = "sesiones_entrenamiento"
        ordering = ["-fecha"]

    def __str__(self):
        return f"Sesión {self.fecha} - {self.usuario.email}"


class EstadisticasUsuario(models.Model):
    usuario = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="estadisticas")
    entrenamientos_semanales = models.IntegerField(default=0)
    minutos_totales_semana = models.IntegerField(default=0)
    calorias_quemadas_semana = models.IntegerField(default=0)
    racha_dias = models.IntegerField(default=0)
    ultima_actualizacion_racha = models.DateField(blank=True, null=True)
    datos_grafica_semanal = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Estadísticas de Usuario"
        verbose_name_plural = "Estadísticas de Usuarios"
        db_table = "estadisticas_usuario"

    def __str__(self):
        return f"Estadísticas - {self.usuario.email}"
