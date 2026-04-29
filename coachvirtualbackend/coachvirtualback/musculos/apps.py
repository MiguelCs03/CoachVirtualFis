from django.apps import AppConfig

from django.apps import AppConfig


class MusculosConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "musculos"
    verbose_name = "Musculos"

    def ready(self):
        """
        Se ejecuta cuando la aplicación se inicia.
        Crea los tipos por defecto: Gimnasio y Fisioterapia
        """
        # Importamos aquí para evitar problemas de importación circular
        from .models import Tipo
        
        # Crear tipos por defecto solo si no existen
        tipos_default = ['Gimnasio', 'Fisioterapia']
        
        try:
            for nombre_tipo in tipos_default:
                # get_or_create crea el registro solo si no existe
                Tipo.objects.get_or_create(
                    nombre=nombre_tipo,
                    defaults={'estado': True}
                )
        except Exception as e:
            # Esto puede fallar si la tabla aún no existe (primera migración)
            # En ese caso, simplemente ignoramos el error
            pass