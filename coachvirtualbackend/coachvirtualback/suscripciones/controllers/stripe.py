from datetime import timedelta

"""Integracion con Stripe para suscripciones."""

import json
import logging

import stripe
from decouple import config
from django.http import HttpRequest, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from usuarios.models import Usuario

from ..models import HistorialSuscripcion, TipoPlan

logger = logging.getLogger(__name__)

# Configuración de Stripe
stripe.api_key = config("STRIPE_SECRET_KEY", default="")

# URL base del frontend (configurable desde .env)
FRONTEND_URL = config("FRONTEND_URL", default="https://coach-virtual.netlify.app")


def get_user_from_request(request: HttpRequest) -> Usuario | None:
    """
    Obtiene el usuario desde el token JWT en el header Authorization.
    Funciona independientemente del middleware de Django.
    """
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    token = auth_header.split(" ")[1]

    try:
        jwt_auth = JWTAuthentication()
        validated_token = jwt_auth.get_validated_token(token)
        user = jwt_auth.get_user(validated_token)
        return user
    except (InvalidToken, TokenError) as e:
        logger.warning("Error validando token: %s", e)
        return None


@csrf_exempt
@require_http_methods(["POST"])
def crear_checkout_session(request: HttpRequest) -> JsonResponse:
    """
    Crea una sesión de checkout de Stripe para suscripción.

    1. Valida usuario desde JWT
    2. Crea registro pendiente en la base de datos
    3. Crea sesión de Stripe
    4. Retorna URL para redirigir al usuario
    """
    try:
        # Verificar que Stripe esté configurado
        if not stripe.api_key:
            return JsonResponse(
                {"error": "Stripe no está configurado. Agregue STRIPE_SECRET_KEY en el archivo .env"},
                status=500,
            )

        # Obtener usuario desde token JWT
        usuario = get_user_from_request(request)

        if not usuario:
            return JsonResponse({"error": "Debe estar autenticado para realizar un pago"}, status=401)

        # Obtener datos del request
        body = {}
        if request.body:
            try:
                body = json.loads(request.body)
            except json.JSONDecodeError:
                pass

        plan_clave = body.get("plan", "")

        if not plan_clave:
            return JsonResponse({"error": "Debe especificar un plan"}, status=400)

        # Buscar plan en la base de datos
        try:
            tipo_plan = TipoPlan.objects.get(clave=plan_clave, activo=True)
        except TipoPlan.DoesNotExist:
            return JsonResponse(
                {"error": f'Plan "{plan_clave}" no encontrado o no está activo'},
                status=404,
            )

        # Validar que el plan tenga precio > 0
        if tipo_plan.precio <= 0:
            return JsonResponse({"error": "Este plan es gratuito y no requiere pago"}, status=400)

        # Calcular fechas
        fecha_inicio = timezone.now()
        fecha_expiracion = fecha_inicio + timedelta(days=tipo_plan.duracion_dias)

        # Crear registro PENDIENTE en la base de datos
        historial = HistorialSuscripcion.objects.create(
            usuario=usuario,
            tipo_plan=tipo_plan,
            plan=plan_clave,  # Legacy field
            fecha_inicio=fecha_inicio,
            fecha_expiracion=fecha_expiracion,
            monto_pagado=tipo_plan.precio,
            metodo_pago="stripe",
            estado_pago="pendiente",
            activo=False,
        )

        # URLs de retorno - redirige a la página de planes para verificación
        success_url = f"{FRONTEND_URL}/planes?success=true&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{FRONTEND_URL}/planes?canceled=true"

        # Crear sesión de checkout con precio dinámico
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="payment",
            customer_email=usuario.email,
            line_items=[
                {
                    "price_data": {
                        "currency": "usd",
                        "product_data": {
                            "name": f"Plan {tipo_plan.nombre} - Coach Virtual",
                            "description": tipo_plan.descripcion
                            or f"Suscripción de {tipo_plan.duracion_dias} días al plan {tipo_plan.nombre}",
                        },
                        "unit_amount": int(float(tipo_plan.precio) * 100),  # Stripe usa centavos
                    },
                    "quantity": 1,
                }
            ],
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "plan": plan_clave,
                "historial_id": str(historial.id),
                "usuario_id": str(usuario.id),
                "tipo_plan_id": str(tipo_plan.id),
            },
        )

        # Guardar session_id en el historial
        historial.referencia_pago = checkout_session.id
        historial.save()

        return JsonResponse(
            {
                "url": checkout_session.url,
                "session_id": checkout_session.id,
                "historial_id": historial.id,
            }
        )

    except stripe.error.AuthenticationError:
        return JsonResponse(
            {"error": "Error de autenticación con Stripe. Verifique STRIPE_SECRET_KEY."},
            status=500,
        )
    except stripe.error.StripeError as e:
        return JsonResponse({"error": f"Error de Stripe: {str(e)}"}, status=400)
    except Exception as e:
        logger.exception("Error Stripe checkout: %s", e)
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["GET"])
def verificar_estado_sesion(request: HttpRequest) -> JsonResponse:
    """
    Verifica el estado de una sesión de checkout.
    Puede ser llamado después del redirect de Stripe.
    """
    session_id = request.GET.get("session_id")

    if not session_id:
        return JsonResponse({"error": "session_id requerido"}, status=400)

    try:
        session = stripe.checkout.Session.retrieve(session_id)

        response_data = {
            "status": session.status,
            "payment_status": session.payment_status,
        }

        # Si el pago fue exitoso, actualizar la base de datos
        if session.payment_status == "paid":
            metadata = session.get("metadata", {})
            historial_id = metadata.get("historial_id")

            if historial_id:
                try:
                    historial = HistorialSuscripcion.objects.get(id=historial_id)

                    if historial.estado_pago != "confirmado":
                        # Desactivar otros planes
                        HistorialSuscripcion.objects.filter(usuario=historial.usuario, activo=True).exclude(
                            id=historial.id
                        ).update(activo=False)

                        # Activar este plan
                        historial.estado_pago = "confirmado"
                        historial.activo = True
                        historial.save()

                        # Actualizar usuario
                        historial.usuario.plan_actual = historial.plan
                        historial.usuario.fecha_expiracion_plan = historial.fecha_expiracion
                        historial.usuario.save()

                        # *** CREAR ALERTA DE FELICITACIÓN ***
                        try:
                            from usuarios.models import Alertas

                            # Obtener información del plan
                            plan_nombre = historial.tipo_plan.nombre if historial.tipo_plan else historial.plan.upper()
                            plan_minutos = historial.tipo_plan.minutos_por_dia if historial.tipo_plan else 60
                            plan_feedback = historial.tipo_plan.feedback_voz if historial.tipo_plan else False
                            plan_angulos = historial.tipo_plan.analisis_angulos if historial.tipo_plan else False

                            # Construir mensaje con beneficios
                            beneficios = []
                            if plan_minutos == -1:
                                beneficios.append("⏰ Tiempo ilimitado de ejercicio")
                            elif plan_minutos > 0:
                                beneficios.append(f"⏰ {plan_minutos} minutos por día")
                            if plan_feedback:
                                beneficios.append("🗣️ Feedback con voz")
                            if plan_angulos:
                                beneficios.append("📐 Análisis de ángulos")

                            beneficios_texto = ", ".join(beneficios) if beneficios else "todas las funciones premium"

                            mensaje = f"🎉 ¡Felicidades! Has activado el plan {plan_nombre}. Ahora tienes acceso a: {beneficios_texto}. ¡Disfruta tu entrenamiento! 💪"

                            Alertas.objects.create(
                                usuario=historial.usuario, mensaje=mensaje, estado=True, fecha=timezone.now()
                            )
                            logger.info("Alerta de pago creada para %s", historial.usuario.email)
                        except Exception as alert_error:
                            logger.exception("Error creando alerta de pago: %s", alert_error)

                        response_data["plan_activated"] = True
                        response_data["plan"] = historial.plan
                except HistorialSuscripcion.DoesNotExist:
                    pass

        if session.subscription:
            subscription = stripe.Subscription.retrieve(session.subscription)
            response_data["subscription"] = {
                "id": subscription.id,
                "status": subscription.status,
                "current_period_end": subscription.current_period_end,
            }

        return JsonResponse(response_data)

    except Exception as e:
        logger.exception("Error verificando estado de sesion: %s", e)
        return JsonResponse({"error": str(e)}, status=400)


@csrf_exempt
@require_http_methods(["POST"])
def cancelar_suscripcion(request: HttpRequest) -> JsonResponse:
    """
    Cancela la suscripción activa del usuario.
    """
    try:
        body = json.loads(request.body)
        subscription_id = body.get("subscription_id")

        if not subscription_id:
            return JsonResponse({"error": "subscription_id requerido"}, status=400)

        subscription = stripe.Subscription.modify(subscription_id, cancel_at_period_end=True)

        return JsonResponse(
            {
                "status": "canceled",
                "cancel_at": subscription.cancel_at,
                "current_period_end": subscription.current_period_end,
            }
        )

    except Exception as e:
        logger.exception("Error cancelando suscripcion: %s", e)
        return JsonResponse({"error": str(e)}, status=500)
