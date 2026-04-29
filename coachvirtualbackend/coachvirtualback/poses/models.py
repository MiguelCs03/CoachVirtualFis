from django.db import models

class PoseTrainingData(models.Model):
    """
    Modelo para almacenar datos de entrenamiento de poses.
    Guarda ejemplos de posturas correctas e incorrectas para entrenar modelos ML.
    Soporta tanto snapshots individuales como secuencias completas de movimiento.
    """
    ejercicio = models.CharField(max_length=50, help_text="Tipo de ejercicio (flexion, sentadilla, etc.)")
    
    # Tipo de dato: 'snapshot' (una sola pose) o 'secuencia' (múltiples frames)
    tipo = models.CharField(
        max_length=20, 
        choices=[('snapshot', 'Snapshot'), ('secuencia', 'Secuencia')],
        default='snapshot',
        help_text="Tipo de dato: snapshot individual o secuencia continua"
    )
    
    # Para snapshots individuales
    landmarks = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Array de puntos clave detectados por BlazePose (solo para snapshots)"
    )
    angulos = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Diccionario de ángulos calculados (solo para snapshots)"
    )
    
    # Para secuencias continuas
    frames = models.JSONField(
        null=True, 
        blank=True, 
        help_text="Array de frames con landmarks y ángulos a lo largo del tiempo"
    )
    duracion_segundos = models.FloatField(
        null=True, 
        blank=True, 
        help_text="Duración total de la secuencia en segundos"
    )
    fps = models.FloatField(
        null=True, 
        blank=True, 
        help_text="Frames por segundo de la grabación"
    )
    total_frames = models.IntegerField(
        null=True, 
        blank=True, 
        help_text="Número total de frames en la secuencia"
    )
    
    # Etiqueta común para ambos tipos
    etiqueta = models.CharField(
        max_length=20, 
        choices=[('correcto', 'Correcto'), ('incorrecto', 'Incorrecto')],
        help_text="Etiqueta de la postura/movimiento"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'pose_training_data'
        ordering = ['-created_at']
        verbose_name = 'Dato de Entrenamiento de Pose'
        verbose_name_plural = 'Datos de Entrenamiento de Poses'
        indexes = [
            models.Index(fields=['ejercicio', 'tipo', 'etiqueta']),
            models.Index(fields=['tipo']),
        ]
    
    def __str__(self):
        tipo_str = "📸" if self.tipo == "snapshot" else "🎬"
        frames_info = f" ({self.total_frames} frames)" if self.tipo == "secuencia" else ""
        return f"{tipo_str} {self.ejercicio} - {self.etiqueta}{frames_info} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
