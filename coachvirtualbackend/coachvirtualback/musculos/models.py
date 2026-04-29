# musculos/models.py
from django.db import models


class Tipo(models.Model):
    nombre = models.CharField(max_length=255)
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class Musculo(models.Model):
    nombre = models.CharField(max_length=255)
    url = models.URLField()

    # ✅ Relación Tipo -> Musculo (1 Tipo tiene muchos músculos)
    tipo = models.ForeignKey(
        Tipo,
        on_delete=models.CASCADE,
        related_name="musculos"
    )

    def __str__(self):
        return self.nombre


class Ejercicio(models.Model):
    nombre = models.CharField(max_length=255)
    url = models.URLField(blank=True, default="")
    estado = models.BooleanField(default=True)

    def __str__(self):
        return self.nombre


class DetalleMusculo(models.Model):
    porcentaje = models.CharField(max_length=255)

    # ✅ Musculo -> DetalleMusculo (1 musculo tiene muchos detalles)
    musculo = models.ForeignKey(
        Musculo,
        on_delete=models.CASCADE,
        related_name="detalles"
    )

    # ✅ Ejercicio -> DetalleMusculo (1 ejercicio aparece en muchos detalles)
    ejercicio = models.ForeignKey(
        Ejercicio,
        on_delete=models.CASCADE,
        related_name="detalles_musculo"
    )

    class Meta:
        # Evita duplicados del mismo musculo-ejercicio
        unique_together = ("musculo", "ejercicio")

    def __str__(self):
        return f"{self.musculo} - {self.ejercicio} ({self.porcentaje})"


class EjercicioAsignado(models.Model):
    # ✅ DetalleMusculo -> EjercicioAsignado (1 detalle tiene muchos asignados)
    detalle_musculo = models.ForeignKey(
        DetalleMusculo,
        on_delete=models.CASCADE,
        related_name="ejercicios_asignados",
    )
    series = models.IntegerField()
    repeticiones = models.IntegerField()

    def __str__(self):
        return f"{self.series}x{self.repeticiones} (Detalle {self.detalle_musculo_id})"