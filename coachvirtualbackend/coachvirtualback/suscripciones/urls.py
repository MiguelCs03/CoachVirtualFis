from django.urls import path

from .controllers.catalogo_controller import (
    ActualizarMetodoPagoVista,
    ActualizarTipoPlanVista,
    CrearMetodoPagoVista,
    CrearTipoPlanVista,
    EliminarMetodoPagoVista,
    EliminarTipoPlanVista,
    ListarMetodosPagoVista,
    ListarTiposPlanVista,
)
from .controllers.plan_crud_controller import (
    CancelarPlanVista,
    ComprarPlanVista,
    ConfirmarPagoVista,
    HistorialSuscripcionesVista,
    ListarPlanesVista,
)
from .controllers.stripe import (
    cancelar_suscripcion,
    crear_checkout_session,
    verificar_estado_sesion,
)
from .controllers.stripe_webhook import stripe_webhook
from .controllers.suscripcion_controller import (
    ActualizarPlanVista,
    PlanActualVista,
    PlanesDisponiblesVista,
    VerificarPermisoVista,
)

urlpatterns = [
    # Configuración de planes (legacy, mantener por compatibilidad)
    path("planes/", PlanesDisponiblesVista.as_view(), name="planes-disponibles"),
    path("planes/actual/", PlanActualVista.as_view(), name="plan-actual"),
    path("planes/verificar/", VerificarPermisoVista.as_view(), name="verificar-permiso"),
    path("planes/actualizar/", ActualizarPlanVista.as_view(), name="actualizar-plan"),
    # CRUD de Planes (nuevo sistema)
    path("planes/lista/", ListarPlanesVista.as_view(), name="planes-lista"),
    path("planes/comprar/", ComprarPlanVista.as_view(), name="planes-comprar"),
    path("planes/confirmar-pago/", ConfirmarPagoVista.as_view(), name="planes-confirmar-pago"),
    path("planes/historial/", HistorialSuscripcionesVista.as_view(), name="planes-historial"),
    path("planes/cancelar/", CancelarPlanVista.as_view(), name="planes-cancelar"),
    # === CRUD Tipos de Plan ===
    path("tipos-plan/", ListarTiposPlanVista.as_view(), name="tipos-plan-listar"),
    path("tipos-plan/crear/", CrearTipoPlanVista.as_view(), name="tipos-plan-crear"),
    path("tipos-plan/<int:plan_id>/", ActualizarTipoPlanVista.as_view(), name="tipos-plan-actualizar"),
    path("tipos-plan/<int:plan_id>/eliminar/", EliminarTipoPlanVista.as_view(), name="tipos-plan-eliminar"),
    # === CRUD Métodos de Pago ===
    path("metodos-pago/", ListarMetodosPagoVista.as_view(), name="metodos-pago-listar"),
    path("metodos-pago/crear/", CrearMetodoPagoVista.as_view(), name="metodos-pago-crear"),
    path("metodos-pago/<int:metodo_id>/", ActualizarMetodoPagoVista.as_view(), name="metodos-pago-actualizar"),
    path("metodos-pago/<int:metodo_id>/eliminar/", EliminarMetodoPagoVista.as_view(), name="metodos-pago-eliminar"),
    # Stripe endpoints
    path("stripe/checkout/", crear_checkout_session, name="stripe_checkout"),
    path("stripe/status/", verificar_estado_sesion, name="stripe_status"),
    path("stripe/cancel/", cancelar_suscripcion, name="stripe_cancel"),
    path("stripe/webhook/", stripe_webhook, name="stripe_webhook"),
]
