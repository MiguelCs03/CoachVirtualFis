"""
Controlador para notificaciones automáticas.
Endpoints para disparar y gestionar alertas dinámicas.
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.utils import timezone

from ..services.notification_engine import NotificationEngine, run_notifications_for_all_users


class CheckNotificationsVista(APIView):
    """
    POST /api/alertas/check/
    Ejecuta verificaciones de notificaciones para el usuario actual.
    Útil para disparar al abrir la app o al completar acciones.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        engine = NotificationEngine(request.user)
        results = engine.run_all_checks()
        
        return Response({
            'success': True,
            'alerts_created': results['total'],
            'details': results['alerts_created'],
        }, status=status.HTTP_200_OK)


class NotifyRoutineCompleteVista(APIView):
    """
    POST /api/alertas/routine-complete/
    Notifica que se completó una rutina.
    Body: { "routine_name": "Día 1: Pecho", "duration_minutes": 45 }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        routine_name = request.data.get('routine_name', 'Rutina')
        duration = int(request.data.get('duration_minutes', 30))
        
        engine = NotificationEngine(request.user)
        alert = engine.notify_routine_completion(routine_name, duration)
        
        # También verificar hitos de progreso
        # TODO: Contar rutinas completadas del usuario
        
        return Response({
            'success': True,
            'alert_created': alert is not None,
            'message': alert.mensaje if alert else 'Ya notificado recientemente',
        }, status=status.HTTP_200_OK)


class NotifyExerciseLimitVista(APIView):
    """
    POST /api/alertas/exercise-limit/
    Verifica y notifica si se está acercando al límite de ejercicio.
    Body: { "current_minutes": 55, "limit_minutes": 60 }
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        current = int(request.data.get('current_minutes', 0))
        limit = int(request.data.get('limit_minutes', 60))
        
        engine = NotificationEngine(request.user)
        alert = engine.check_exercise_time_limit(current, limit)
        
        return Response({
            'success': True,
            'alert_created': alert is not None,
            'message': alert.mensaje if alert else None,
            'remaining_minutes': max(0, limit - current),
        }, status=status.HTTP_200_OK)


class NotificationStatsVista(APIView):
    """
    GET /api/alertas/stats/
    Obtiene estadísticas de notificaciones del usuario.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        from ..models import Alertas
        
        user = request.user
        today = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        week_ago = today - timezone.timedelta(days=7)
        
        total = Alertas.objects.filter(usuario=user).count()
        today_count = Alertas.objects.filter(usuario=user, created_at__gte=today).count()
        week_count = Alertas.objects.filter(usuario=user, created_at__gte=week_ago).count()
        unread = Alertas.objects.filter(usuario=user, estado=True).count()
        
        return Response({
            'total': total,
            'today': today_count,
            'this_week': week_count,
            'unread': unread,
            'plan_expiring': self._check_plan_expiring(user),
        }, status=status.HTTP_200_OK)
    
    def _check_plan_expiring(self, user):
        if not user.fecha_expiracion_plan:
            return None
        
        days_left = (user.fecha_expiracion_plan - timezone.now()).days
        
        if days_left <= 0:
            return {'status': 'expired', 'days': 0}
        elif days_left <= 7:
            return {'status': 'expiring_soon', 'days': days_left}
        else:
            return {'status': 'active', 'days': days_left}


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trigger_motivation(request):
    """
    POST /api/alertas/motivation/
    Genera un mensaje motivacional (si no se ha enviado hoy).
    """
    engine = NotificationEngine(request.user)
    alert = engine.generate_daily_motivation()
    
    return Response({
        'success': True,
        'alert_created': alert is not None,
        'message': alert.mensaje if alert else 'Ya recibiste motivación hoy 😊',
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_as_read(request, pk):
    """
    POST /api/alertas/{pk}/read/
    Marca una alerta como leída (estado=False).
    """
    from ..models import Alertas
    from django.shortcuts import get_object_or_404
    
    alerta = get_object_or_404(Alertas, pk=pk)
    
    if alerta.usuario_id != request.user.id and not request.user.is_superuser:
        return Response({'detail': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)
    
    alerta.estado = False
    alerta.save()
    
    return Response({'success': True, 'id': pk}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mark_all_read(request):
    """
    POST /api/alertas/mark-all-read/
    Marca todas las alertas del usuario como leídas.
    """
    from ..models import Alertas
    
    count = Alertas.objects.filter(usuario=request.user, estado=True).update(estado=False)
    
    return Response({
        'success': True,
        'marked_count': count,
    }, status=status.HTTP_200_OK)
