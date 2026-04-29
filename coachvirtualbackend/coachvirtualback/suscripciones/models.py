from django.db import models
from usuarios.models import Usuario


class TipoPlan(models.Model):
    """
    Modelo para definir tipos de planes disponibles.
    Los administradores pueden crear, editar y eliminar planes.
    """

    nombre = models.CharField(max_length=50, unique=True, help_text="Nombre del plan")
    clave = models.CharField(max_length=20, unique=True, help_text="Clave única del plan (ej: basico, premium)")
    descripcion = models.TextField(blank=True, help_text="Descripción del plan")
    precio = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Precio mensual en Bs.")
    duracion_dias = models.IntegerField(default=30, help_text="Duración del plan en días")

    # Características/Funciones del plan
    minutos_por_dia = models.IntegerField(default=15, help_text="Minutos de uso por día (-1 = ilimitado)")
    feedback_voz = models.BooleanField(default=False, help_text="Permite feedback con voz")
    analisis_angulos = models.BooleanField(default=False, help_text="Permite análisis de ángulos")
    historial_dias = models.IntegerField(default=0, help_text="Días de historial disponibles (-1 = ilimitado)")
    con_anuncios = models.BooleanField(default=True, help_text="Muestra anuncios")
    rutinas_personalizadas = models.BooleanField(default=False, help_text="Permite crear rutinas personalizadas")
    soporte_prioritario = models.BooleanField(default=False, help_text="Acceso a soporte prioritario")

    # Display
    icono = models.CharField(max_length=10, default="⭐", help_text="Emoji o icono del plan")
    color = models.CharField(max_length=50, default="from-gray-400 to-gray-500", help_text="Clase CSS de gradiente")
    orden = models.IntegerField(default=0, help_text="Orden de visualización")
    popular = models.BooleanField(default=False, help_text="Marcar como más popular")
    activo = models.BooleanField(default=True, help_text="Si el plan está disponible")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tipos_plan"
        ordering = ["orden", "precio"]
        verbose_name = "Tipo de Plan"
        verbose_name_plural = "Tipos de Plan"

    def __str__(self):
        return f"{self.nombre} - Bs. {self.precio}"

    def to_dict(self):
        """Convierte a diccionario para API"""
        return {
            "id": self.id,
            "nombre": self.nombre,
            "clave": self.clave,
            "descripcion": self.descripcion,
            "precio": float(self.precio),
            "duracion_dias": self.duracion_dias,
            "minutos_por_dia": self.minutos_por_dia,
            "feedback_voz": self.feedback_voz,
            "analisis_angulos": self.analisis_angulos,
            "historial_dias": self.historial_dias,
            "con_anuncios": self.con_anuncios,
            "rutinas_personalizadas": self.rutinas_personalizadas,
            "soporte_prioritario": self.soporte_prioritario,
            "icono": self.icono,
            "color": self.color,
            "orden": self.orden,
            "popular": self.popular,
            "activo": self.activo,
        }


class MetodoPago(models.Model):
    """
    Modelo para definir métodos de pago disponibles.
    """

    nombre = models.CharField(max_length=50, unique=True, help_text="Nombre del método de pago")
    clave = models.CharField(max_length=20, unique=True, help_text="Clave única (ej: stripe, qr, transferencia)")
    descripcion = models.TextField(blank=True, help_text="Descripción del método")
    icono = models.CharField(max_length=10, default="💳", help_text="Emoji o icono")
    color = models.CharField(max_length=20, default="bg-blue-500", help_text="Clase CSS de color")
    activo = models.BooleanField(default=True, help_text="Si el método está habilitado")
    orden = models.IntegerField(default=0, help_text="Orden de visualización")

    # Configuración (puede ser JSON para configuraciones específicas)
    requiere_referencia = models.BooleanField(default=False, help_text="Requiere número de referencia/transacción")
    instrucciones = models.TextField(blank=True, help_text="Instrucciones para el usuario")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "metodos_pago"
        ordering = ["orden", "nombre"]
        verbose_name = "Método de Pago"
        verbose_name_plural = "Métodos de Pago"

    def __str__(self):
        return self.nombre

    def to_dict(self):
        """Convierte a diccionario para API"""
        return {
            "id": self.id,
            "nombre": self.nombre,
            "clave": self.clave,
            "descripcion": self.descripcion,
            "icono": self.icono,
            "color": self.color,
            "activo": self.activo,
            "orden": self.orden,
            "requiere_referencia": self.requiere_referencia,
            "instrucciones": self.instrucciones,
        }


class HistorialSuscripcion(models.Model):
    """
    Tabla para guardar el historial de suscripciones de cada usuario.
    """

    usuario = models.ForeignKey(Usuario, on_delete=models.CASCADE, related_name="historial_suscripciones")
    tipo_plan = models.ForeignKey(
        TipoPlan, on_delete=models.SET_NULL, null=True, blank=True, related_name="suscripciones"
    )
    metodo_pago_obj = models.ForeignKey(
        MetodoPago, on_delete=models.SET_NULL, null=True, blank=True, related_name="suscripciones"
    )

    plan = models.CharField(
        max_length=20,
        choices=[("gratis", "Gratis"), ("basico", "Básico"), ("premium", "Premium")],
        help_text="Plan adquirido (legacy)",
    )

    # Fechas
    fecha_inicio = models.DateTimeField(auto_now_add=True, help_text="Fecha de inicio del plan")
    fecha_expiracion = models.DateTimeField(help_text="Fecha de expiración del plan")

    # Información de pago
    monto_pagado = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Monto pagado en Bs.")
    metodo_pago = models.CharField(max_length=50, blank=True, null=True, help_text="Método de pago utilizado (legacy)")
    referencia_pago = models.CharField(
        max_length=100, blank=True, null=True, help_text="ID de transacción o referencia de pago"
    )

    # Estado de pago
    estado_pago = models.CharField(
        max_length=20,
        choices=[
            ("pendiente", "Pendiente"),
            ("confirmado", "Confirmado"),
            ("rechazado", "Rechazado"),
            ("reembolsado", "Reembolsado"),
        ],
        default="pendiente",
        help_text="Estado del pago",
    )

    # Estado
    activo = models.BooleanField(default=False, help_text="Si esta suscripción está activa")
    cancelado = models.BooleanField(default=False, help_text="Si fue cancelado manualmente")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "historial_suscripciones"
        ordering = ["-fecha_inicio"]
        verbose_name = "Historial de Suscripción"
        verbose_name_plural = "Historial de Suscripciones"
        indexes = [
            models.Index(fields=["usuario", "-fecha_inicio"]),
            models.Index(fields=["activo"]),
            models.Index(fields=["estado_pago"]),
        ]

    def __str__(self):
        return f"{self.usuario.email} - {self.plan} ({self.fecha_inicio.strftime('%Y-%m-%d')})"
