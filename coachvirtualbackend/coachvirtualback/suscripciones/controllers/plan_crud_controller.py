from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from datetime import timedelta
from ..models import HistorialSuscripcion
from ..config import PLANES, get_plan_config


class ListarPlanesVista(APIView):
    """
    Lista todos los planes disponibles.
    GET: Retorna la configuración de todos los planes.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtiene todos los planes disponibles"""
        return Response({
            'planes': PLANES,
            'mensaje': 'Planes disponibles'
        })


class ComprarPlanVista(APIView):
    """
    Permite al usuario comprar/activar un plan.
    POST: Crea una suscripción PENDIENTE hasta que se confirme el pago.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Crea una suscripción pendiente de pago.
        
        Body esperado:
        {
            "plan": "basico" | "premium",
            "metodo_pago": "stripe" | "manual" | "qr",
            "referencia_pago": "stripe_session_id_xxx" (opcional),
            "duracion_dias": 30 (opcional, default 30)
        }
        """
        usuario = request.user
        plan_key = request.data.get('plan')
        metodo_pago = request.data.get('metodo_pago', 'manual')
        referencia_pago = request.data.get('referencia_pago', '')
        duracion_dias = request.data.get('duracion_dias', 30)
        
        # Validar plan
        if plan_key not in ['basico', 'premium']:
            return Response({
                'error': 'Plan inválido. Debe ser "basico" o "premium"'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener configuración del plan
        plan_config = get_plan_config(plan_key)
        
        # Calcular fechas
        fecha_inicio = timezone.now()
        fecha_expiracion = fecha_inicio + timedelta(days=duracion_dias)
        
        # Crear nuevo registro en historial (PENDIENTE de pago)
        historial = HistorialSuscripcion.objects.create(
            usuario=usuario,
            plan=plan_key,
            fecha_inicio=fecha_inicio,
            fecha_expiracion=fecha_expiracion,
            monto_pagado=plan_config['precio'],
            metodo_pago=metodo_pago,
            referencia_pago=referencia_pago,
            estado_pago='pendiente',  # PENDIENTE hasta confirmar pago
            activo=False  # NO activo hasta confirmar pago
        )
        
        return Response({
            'mensaje': f'Suscripción creada. Pendiente de confirmación de pago.',
            'plan': plan_key,
            'historial_id': historial.id,
            'estado_pago': 'pendiente',
            'fecha_expiracion': fecha_expiracion.isoformat(),
            'plan_config': plan_config,
            'requiere_confirmacion': True
        }, status=status.HTTP_201_CREATED)


class ConfirmarPagoVista(APIView):
    """
    Confirma el pago de una suscripción y la activa.
    POST: Marca el pago como confirmado y activa el plan.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Confirma el pago y activa la suscripción.
        
        Body esperado:
        {
            "historial_id": 123,
            "referencia_pago": "xxx" (opcional, actualiza referencia)
        }
        """
        historial_id = request.data.get('historial_id')
        referencia_pago = request.data.get('referencia_pago')
        
        if not historial_id:
            return Response({
                'error': 'Se requiere historial_id'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            historial = HistorialSuscripcion.objects.get(
                id=historial_id,
                usuario=request.user  # Solo el usuario dueño puede confirmar
            )
        except HistorialSuscripcion.DoesNotExist:
            return Response({
                'error': 'Suscripción no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if historial.estado_pago == 'confirmado':
            return Response({
                'mensaje': 'El pago ya fue confirmado anteriormente',
                'plan': historial.plan
            })
        
        # Desactivar suscripciones anteriores del usuario
        HistorialSuscripcion.objects.filter(
            usuario=request.user,
            activo=True
        ).update(activo=False)
        
        # Confirmar pago y activar plan
        historial.estado_pago = 'confirmado'
        historial.activo = True
        if referencia_pago:
            historial.referencia_pago = referencia_pago
        historial.save()
        
        # Actualizar plan del usuario
        usuario = request.user
        usuario.plan_actual = historial.plan
        usuario.fecha_expiracion_plan = historial.fecha_expiracion
        usuario.save()
        
        return Response({
            'mensaje': f'Pago confirmado. Plan {historial.plan} activado exitosamente.',
            'plan': historial.plan,
            'fecha_expiracion': historial.fecha_expiracion.isoformat(),
            'estado_pago': 'confirmado'
        })


class HistorialSuscripcionesVista(APIView):
    """
    Obtiene el historial de suscripciones del usuario.
    GET: Retorna todas las suscripciones del usuario.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Obtiene el historial de suscripciones del usuario"""
        usuario = request.user
        
        historial = HistorialSuscripcion.objects.filter(
            usuario=usuario
        ).order_by('-fecha_inicio')
        
        historial_data = [{
            'id': h.id,
            'plan': h.plan,
            'plan_nombre': PLANES.get(h.plan, {}).get('nombre', h.plan),
            'fecha_inicio': h.fecha_inicio.isoformat(),
            'fecha_expiracion': h.fecha_expiracion.isoformat(),
            'monto_pagado': float(h.monto_pagado),
            'metodo_pago': h.metodo_pago,
            'estado_pago': h.estado_pago,
            'activo': h.activo,
            'cancelado': h.cancelado,
        } for h in historial]
        
        return Response({
            'historial': historial_data,
            'total': len(historial_data)
        })


class CancelarPlanVista(APIView):
    """
    Cancela el plan activo del usuario y lo regresa a gratis.
    POST: Cancela la suscripción activa.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        """
        Cancela el plan actual del usuario.
        
        Body opcional:
        {
            "inmediato": true | false  (default: false, cancela al finalizar periodo)
        }
        """
        usuario = request.user
        inmediato = request.data.get('inmediato', False)
        
        # Buscar suscripción activa
        suscripcion_activa = HistorialSuscripcion.objects.filter(
            usuario=usuario,
            activo=True
        ).first()
        
        if not suscripcion_activa:
            return Response({
                'error': 'No tienes un plan activo para cancelar'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if inmediato:
            # Cancelación inmediata
            suscripcion_activa.activo = False
            suscripcion_activa.cancelado = True
            suscripcion_activa.save()
            
            usuario.plan_actual = 'gratis'
            usuario.fecha_expiracion_plan = None
            usuario.save()
            
            mensaje = 'Plan cancelado inmediatamente. Has vuelto al plan gratuito.'
        else:
            # Marcar para cancelar al final del periodo
            suscripcion_activa.cancelado = True
            suscripcion_activa.save()
            
            mensaje = f'Plan marcado para cancelación. Se desactivará el {suscripcion_activa.fecha_expiracion.strftime("%d/%m/%Y")}'
        
        return Response({
            'mensaje': mensaje,
            'plan_actual': usuario.plan_actual,
            'fecha_expiracion': usuario.fecha_expiracion_plan.isoformat() if usuario.fecha_expiracion_plan else None
        })
