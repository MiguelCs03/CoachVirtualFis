import json
import logging

import stripe
from decouple import config
from django.http import HttpRequest, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from usuarios.models import Usuario

from ..config import get_plan_config
from ..models import HistorialSuscripcion

logger = logging.getLogger(__name__)

# Configuración de Stripe
stripe.api_key = config("STRIPE_SECRET_KEY", default="")
STRIPE_WEBHOOK_SECRET = config("STRIPE_WEBHOOK_SECRET", default="")


@csrf_exempt
@require_http_methods(["POST"])
def stripe_webhook(request: HttpRequest) -> HttpResponse:
    """
    Webhook endpoint para recibir eventos de Stripe.

    Eventos manejados:
    - checkout.session.completed: Cuando un pago se completa exitosamente
    - customer.subscription.updated: Cuando se actualiza una suscripción
    - customer.subscription.deleted: Cuando se cancela una suscripción
    """
    payload = request.body
    sig_header = request.META.get("HTTP_STRIPE_SIGNATURE", "")

    # Si no hay webhook secret configurado, procesar sin verificación (desarrollo)
    if STRIPE_WEBHOOK_SECRET:
        try:
            event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
        except ValueError as e:
            logger.warning("Webhook error - Invalid payload: %s", e)
            return HttpResponse(status=400)
        except stripe.error.SignatureVerificationError as e:
            logger.warning("Webhook error - Invalid signature: %s", e)
            return HttpResponse(status=400)
    else:
        # Modo desarrollo - parsear sin verificar firma
        try:
            event = json.loads(payload)
        except json.JSONDecodeError:
            return HttpResponse(status=400)

    # Manejar el evento
    event_type = event.get("type", "")

    if event_type == "checkout.session.completed":
        handle_checkout_completed(event["data"]["object"])
    elif event_type == "customer.subscription.updated":
        handle_subscription_updated(event["data"]["object"])
    elif event_type == "customer.subscription.deleted":
        handle_subscription_deleted(event["data"]["object"])

    return HttpResponse(status=200)


def handle_checkout_completed(session: dict) -> None:
    """
    Procesa un checkout completado.
    Activa la suscripción del usuario en la base de datos.
    """
    try:
        # Obtener metadata de la sesión
        metadata = session.get("metadata", {})
        plan = metadata.get("plan", "basico")
        historial_id = metadata.get("historial_id")
        session_id = session.get("id")
        customer_email = session.get("customer_email", "")

        # Buscar usuario por email
        if customer_email:
            try:
                usuario = Usuario.objects.get(email=customer_email)
            except Usuario.DoesNotExist:
                logger.warning("Webhook: Usuario no encontrado con email %s", customer_email)
                return
        else:
            logger.warning("Webhook: No se recibió email del customer")
            return

        # Buscar el historial pendiente si existe
        historial = None
        if historial_id:
            try:
                historial = HistorialSuscripcion.objects.get(id=historial_id, usuario=usuario)
            except HistorialSuscripcion.DoesNotExist:
                pass

        # Si no hay historial pendiente, buscar por referencia
        if not historial:
            historial = HistorialSuscripcion.objects.filter(
                usuario=usuario,
                estado_pago="pendiente",
            ).first()

        if historial:
            # Actualizar historial existente
            historial.estado_pago = "confirmado"
            historial.activo = True
            historial.referencia_pago = session_id
            historial.save()
        else:
            # Crear nuevo historial si no existe
            from datetime import timedelta

            from django.utils import timezone

            plan_config = get_plan_config(plan)
            fecha_expiracion = timezone.now() + timedelta(days=30)

            historial = HistorialSuscripcion.objects.create(
                usuario=usuario,
                plan=plan,
                fecha_expiracion=fecha_expiracion,
                monto_pagado=plan_config["precio"],
                metodo_pago="stripe",
                referencia_pago=session_id,
                estado_pago="confirmado",
                activo=True,
            )

        # Desactivar otros planes activos del usuario
        HistorialSuscripcion.objects.filter(usuario=usuario, activo=True).exclude(id=historial.id).update(activo=False)

        # Actualizar el usuario
        usuario.plan_actual = plan
        usuario.fecha_expiracion_plan = historial.fecha_expiracion
        usuario.save()

        logger.info("Webhook: Plan %s activado para %s", plan, usuario.email)

    except Exception as e:
        logger.exception("Webhook error en checkout completed: %s", e)


def handle_subscription_updated(subscription: dict) -> None:
    """
    Maneja actualizaciones de suscripción.
    """
    try:
        subscription_id = subscription.get("id")
        status = subscription.get("status")

        # Buscar historial por referencia
        historial = HistorialSuscripcion.objects.filter(referencia_pago__contains=subscription_id).first()

        if historial:
            if status == "active":
                historial.estado_pago = "confirmado"
                historial.activo = True
            elif status in {"canceled", "past_due"}:
                historial.activo = False
                historial.cancelado = True

            historial.save()

            # Actualizar usuario
            usuario = historial.usuario
            if historial.activo:
                usuario.plan_actual = historial.plan
            else:
                usuario.plan_actual = "gratis"
                usuario.fecha_expiracion_plan = None
            usuario.save()

    except Exception as e:
        logger.exception("Webhook error en subscription updated: %s", e)


def handle_subscription_deleted(subscription: dict) -> None:
    """
    Maneja la cancelación de una suscripción.
    """
    try:
        subscription_id = subscription.get("id")

        historial = HistorialSuscripcion.objects.filter(referencia_pago__contains=subscription_id).first()

        if historial:
            historial.activo = False
            historial.cancelado = True
            historial.save()

            # Revertir usuario a plan gratis
            usuario = historial.usuario
            usuario.plan_actual = "gratis"
            usuario.fecha_expiracion_plan = None
            usuario.save()

    except Exception as e:
        logger.exception("Webhook error en subscription deleted: %s", e)
