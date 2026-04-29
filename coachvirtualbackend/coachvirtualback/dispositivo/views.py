"""
Endpoints del módulo dispositivo
 - Fitness local (simulador sin Google Cloud)
 - Google Fit (solo si está configurado)
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from decouple import config

from .local_fitness import get_local_fitness_stats
import logging

logger = logging.getLogger(__name__)


@api_view(["GET"])
@permission_classes([AllowAny])  # Permitir sin autenticación para simplificar
def googlefit_stats(request):
    """
    GET /api/dispositivo/googlefit/
    
    Retorna estadísticas de fitness del día.
    - Si Google Fit está configurado (GOOGLE_FIT_ACCESS_TOKEN), usa Google Fit
    - Si no, usa el simulador local con datos realistas
    """
    # Verificar si Google Fit está configurado
    google_fit_token = config("GOOGLE_FIT_ACCESS_TOKEN", default="")
    
    if google_fit_token:
        # Intentar usar Google Fit real
        try:
            from .googlefit import GoogleFitClient
            client = GoogleFitClient()
            data = client.get_today_stats()
            data["source"] = "google_fit"
            return Response(data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.warning("Google Fit no disponible, usando simulador local: %s", e)
    
    # Usar simulador local
    try:
        # Obtener user_id si está autenticado
        user_id = getattr(request.user, 'id', None) or 1
        data = get_local_fitness_stats(user_id)
        data["source"] = "local_simulator"
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        logger.exception("Error en simulador local")
        return Response(
            {"error": f"Error obteniendo estadísticas: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@permission_classes([AllowAny])
def record_exercise(request):
    """
    POST /api/dispositivo/exercise/
    
    Registra una sesión de ejercicio para bonus de pasos/calorías.
    Body: { "type": "cardio", "duration": 30 }
    """
    try:
        from .local_fitness import LocalFitnessSimulator
        
        user_id = getattr(request.user, 'id', None) or 1
        exercise_type = request.data.get("type", "general")
        duration = int(request.data.get("duration", 30))
        
        simulator = LocalFitnessSimulator(user_id)
        result = simulator.record_exercise(exercise_type, duration)
        
        return Response({
            "success": True,
            "exercise": result,
            "message": f"Ejercicio '{exercise_type}' de {duration} min registrado"
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
