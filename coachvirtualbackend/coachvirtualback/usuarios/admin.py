from django.contrib import admin
from .models import (
    Usuario,
    Plan,
    Alertas,
    DetallePlan,
    Objetivo,
    TipoPrograma,
    ProgramaEntrenamiento,
    Dia,
    TipoEntrenamiento,
    DiasEntrenamiento,
    Mediciones,
    Sesion,
    Musculo,
    Ejercicios,
    DetalleMusculo,
    EjerciciosAsignados,
)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ["username", "first_name", "last_name", "email"]
    list_filter = ["is_staff", "is_active"]
    search_fields = ["username", "first_name", "last_name", "email"]


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ["nombre", "precio"]
    list_filter = ["precio"]
    search_fields = ["nombre"]


@admin.register(Alertas)
class AlertasAdmin(admin.ModelAdmin):
    list_display = ["mensaje", "fecha", "estado", "usuario", "created_at"]
    list_filter = ["estado", "fecha", "created_at"]
    search_fields = ["mensaje", "usuario__email", "usuario__username"]
    ordering = ("-created_at", "-id")  # más recientes primero


@admin.register(DetallePlan)
class DetallePlanAdmin(admin.ModelAdmin):
    list_display = ["usuario", "plan", "fecha_inicio", "fecha_final"]
    list_filter = ["plan", "fecha_inicio", "fecha_final"]
    search_fields = ["usuario__email", "usuario__username", "plan__nombre"]


@admin.register(Objetivo)
class ObjetivoAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(TipoPrograma)
class TipoProgramaAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(ProgramaEntrenamiento)
class ProgramaEntrenamientoAdmin(admin.ModelAdmin):
    list_display = [
        "nombre",
        "fecha_inicio",
        "fecha_final",
        "estado",
        "tipo_programa",
        "objetivo",
    ]
    list_filter = ["estado", "tipo_programa", "objetivo", "fecha_inicio", "fecha_final"]
    search_fields = ["nombre", "tipo_programa__nombre", "objetivo__nombre"]


@admin.register(Dia)
class DiaAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(TipoEntrenamiento)
class TipoEntrenamientoAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(DiasEntrenamiento)
class DiasEntrenamientoAdmin(admin.ModelAdmin):
    list_display = ["dia", "tipo_entrenamiento", "descripcion"]
    list_filter = ["dia", "tipo_entrenamiento"]
    search_fields = ["descripcion", "dia__nombre", "tipo_entrenamiento__nombre"]


@admin.register(Mediciones)
class MedicionesAdmin(admin.ModelAdmin):
    list_display = ["calorias", "cronometrio"]
    search_fields = ["cronometrio"]


@admin.register(Sesion)
class SesionAdmin(admin.ModelAdmin):
    list_display = ["fecha", "estado", "dias_entrenamiento"]
    list_filter = ["estado", "fecha", "dias_entrenamiento__dia"]
    search_fields = [
        "comentario",
        "dias_entrenamiento__dia__nombre",
        "dias_entrenamiento__tipo_entrenamiento__nombre",
    ]


@admin.register(Musculo)
class MusculoAdmin(admin.ModelAdmin):
    list_display = ["nombre"]
    search_fields = ["nombre"]


@admin.register(Ejercicios)
class EjerciciosAdmin(admin.ModelAdmin):
    list_display = ["nombre", "estado"]
    list_filter = ["estado"]
    search_fields = ["nombre"]


@admin.register(DetalleMusculo)
class DetalleMusculoAdmin(admin.ModelAdmin):
    list_display = ["ejercicio", "musculo", "porcentaje"]
    list_filter = ["musculo", "ejercicio"]
    search_fields = ["ejercicio__nombre", "musculo__nombre"]


@admin.register(EjerciciosAsignados)
class EjerciciosAsignadosAdmin(admin.ModelAdmin):
    list_display = ["ejercicio", "series", "repeticiones", "sesion"]
    list_filter = ["ejercicio"]
    search_fields = ["ejercicio__nombre", "sesion__comentario"]
