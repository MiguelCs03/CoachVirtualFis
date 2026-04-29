from django.contrib import admin
from .models import PoseTrainingData

@admin.register(PoseTrainingData)
class PoseTrainingDataAdmin(admin.ModelAdmin):
    list_display = ['id', 'ejercicio', 'etiqueta', 'created_at']
    list_filter = ['ejercicio', 'etiqueta', 'created_at']
    search_fields = ['ejercicio']
    readonly_fields = ['created_at']
    ordering = ['-created_at']
