from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from ..models import HistorialEntrenamiento

class LogrosView(APIView):
    """
    Controlador para gestionar la gamificación del usuario (HU-9).
    Calcula racha de días consecutivos y estado de medallas obtenidas.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        hoy = timezone.now().date()
        
        # 1. Obtener todas las fechas en que entrenó
        entrenamientos = HistorialEntrenamiento.objects.filter(usuario=user, completado=True)
        fechas = entrenamientos.values_list("fecha", flat=True)
        
        # Filtrar fechas únicas ordenadas de la más reciente a la más antigua
        fechas_unicas = sorted(list(set([f.date() for f in fechas])), reverse=True)
        
        # 2. Calcular racha exacta
        racha = 0
        if fechas_unicas:
            ultimo_entrenamiento = fechas_unicas[0]
            # La racha continúa si el último entrenamiento fue hoy o ayer
            if ultimo_entrenamiento == hoy or ultimo_entrenamiento == hoy - timedelta(days=1):
                racha = 1
                fecha_anterior = ultimo_entrenamiento
                for f in fechas_unicas[1:]:
                    if fecha_anterior - f == timedelta(days=1):
                        racha += 1
                        fecha_anterior = f
                    else:
                        break

        # 3. Métricas para medallas
        total_sesiones = entrenamientos.count()
        max_precision = 0.0
        if total_sesiones > 0:
            import django.db.models as db_models
            max_precision = entrenamientos.aggregate(db_models.Max("precision_porcentaje"))["precision_porcentaje__max"] or 0.0

        # 4. Definición de medallas y comprobación de estado
        medallas = [
            {
                "id": "primer_paso",
                "titulo": "Primer Paso",
                "descripcion": "Completa tu primer ejercicio en el historial.",
                "tipo": "bronce",
                "icono": "🥉",
                "desbloqueado": total_sesiones >= 1,
                "progreso": min(total_sesiones, 1),
                "meta": 1
            },
            {
                "id": "esfuerzo_constante",
                "titulo": "Esfuerzo Constante",
                "descripcion": "Completa 5 ejercicios en el historial.",
                "tipo": "plata",
                "icono": "🥈",
                "desbloqueado": total_sesiones >= 5,
                "progreso": min(total_sesiones, 5),
                "meta": 5
            },
            {
                "id": "racha_inicial",
                "titulo": "Racha Activa",
                "descripcion": "Mantén una racha de 3 días consecutivos.",
                "tipo": "plata",
                "icono": "🔥",
                "desbloqueado": racha >= 3,
                "progreso": min(racha, 3),
                "meta": 3
            },
            {
                "id": "guerrero_acero",
                "titulo": "Guerrero de Acero",
                "descripcion": "Mantén una racha de 7 días consecutivos.",
                "tipo": "oro",
                "icono": "🥇",
                "desbloqueado": racha >= 7,
                "progreso": min(racha, 7),
                "meta": 7
            },
            {
                "id": "precision_perfecta",
                "titulo": "Técnica Perfecta",
                "descripcion": "Realiza un ejercicio con una precisión del 90% o más.",
                "tipo": "esmeralda",
                "icono": "💎",
                "desbloqueado": max_precision >= 90.0,
                "progreso": 1 if max_precision >= 90.0 else 0,
                "meta": 1
            }
        ]

        return Response({
            "racha": racha,
            "total_ejercicios": total_sesiones,
            "max_precision": round(max_precision, 1),
            "medallas": medallas
        })
