from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..config import PLANES, SUBSCRIPTIONS_ENABLED, get_plan_config


class PlanesDisponiblesVista(APIView):
    """
    Vista para obtener información de los planes disponibles.
    GET: Retorna todos los planes con sus características y precios.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtiene la lista de planes disponibles"""
        return Response({
            'subscriptions_enabled': SUBSCRIPTIONS_ENABLED,
            'planes': PLANES,
            'mensaje': 'Sistema de suscripciones en preparación' if not SUBSCRIPTIONS_ENABLED else None
        })


class PlanActualVista(APIView):
    """
    Vista para obtener el plan actual del usuario autenticado.
    GET: Retorna el plan actual y sus límites/permisos.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtiene el plan actual del usuario"""
        usuario = request.user
        plan_config = get_plan_config(usuario.plan_actual)
        
        return Response({
            'plan_actual': usuario.plan_actual,
            'plan_nombre': plan_config['nombre'],
            'fecha_expiracion': usuario.fecha_expiracion_plan,
            'tiene_plan_activo': usuario.tiene_plan_activo,
            'configuracion': plan_config,
            'subscriptions_enabled': SUBSCRIPTIONS_ENABLED
        })


class VerificarPermisoVista(APIView):
    """
    Vista para verificar si el usuario tiene permiso para una característica.
    GET: Verifica permisos para una feature específica.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Verifica si el usuario puede usar una característica.
        Query params: feature (nombre de la característica)
        """
        feature = request.query_params.get('feature')
        
        if not feature:
            return Response(
                {'error': 'Se requiere el parámetro "feature"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        usuario = request.user
        plan_config = get_plan_config(usuario.plan_actual)
        
        # Si el sistema no está activo, todo es permitido
        if not SUBSCRIPTIONS_ENABLED:
            return Response({
                'permitido': True,
                'motivo': 'Sistema de suscripciones no activado',
                'plan_actual': usuario.plan_actual
            })
        
        permitido = plan_config.get(feature, False)
        
        return Response({
            'permitido': permitido,
            'feature': feature,
            'plan_actual': usuario.plan_actual,
            'plan_requerido': 'premium' if not permitido else None,
            'mensaje': f'Se requiere plan Premium' if not permitido else 'Acceso permitido'
        })


# TODO: Implementar cuando se integre la pasarela de pago
class ActualizarPlanVista(APIView):
    """
    Vista para actualizar el plan de un usuario (después del pago).
    POST: Actualiza el plan del usuario.
    
    NOTA: Esta vista debe ser llamada desde el webhook de la pasarela de pago.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Actualiza el plan del usuario.
        Body esperado: {plan: 'basico'|'premium', duracion_dias: 30}
        
        TODO: Implementar validación de pago antes de actualizar
        """
        return Response({
            'error': 'Endpoint en desarrollo - requiere integración con pasarela de pago',
            'mensaje': 'Por favor contacte al administrador'
        }, status=status.HTTP_501_NOT_IMPLEMENTED)
