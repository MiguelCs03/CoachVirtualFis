from django.urls import path
from .controllers.usuario_controller import (
    UsuarioListaCrearVista, UsuarioDetalleVista, MeView,
)
from .controllers.alerta_controller import (
    AlertasListaCrearVista, AlertasDetalleVista,
    MisAlertasVista, MisAlertasUltimasVista,
)
from .controllers.auto_alerts_controller import (
    CheckNotificationsVista, NotifyRoutineCompleteVista,
    NotifyExerciseLimitVista, NotificationStatsVista,
    trigger_motivation, mark_as_read, mark_all_read,
)

urlpatterns = [
    # Usuario
    path("usuarios/me/", MeView.as_view(), name="me"),
    path("usuarios/", UsuarioListaCrearVista.as_view(), name="usuario-lista-crear"),
    path("usuarios",  UsuarioListaCrearVista.as_view()),
    path("usuarios/<int:pk>/", UsuarioDetalleVista.as_view(), name="usuario-detalle"),
    path("usuarios/<int:pk>",  UsuarioDetalleVista.as_view()),

    # Alertas - CRUD básico
    path("alertas/mis-alertas/", MisAlertasVista.as_view(), name="mis-alertas"),
    path("alertas/mis-alertas/ultimas/", MisAlertasUltimasVista.as_view(), name="mis-alertas-ultimas"),
    path("alertas/",  AlertasListaCrearVista.as_view(), name="alerta-lista-crear"),
    path("alertas",   AlertasListaCrearVista.as_view()),
    path("alertas/<int:pk>/", AlertasDetalleVista.as_view(), name="alerta-detalle"),
    path("alertas/<int:pk>",  AlertasDetalleVista.as_view()),
    
    # Alertas - Notificaciones automáticas
    path("alertas/check/", CheckNotificationsVista.as_view(), name="alertas-check"),
    path("alertas/routine-complete/", NotifyRoutineCompleteVista.as_view(), name="alertas-routine-complete"),
    path("alertas/exercise-limit/", NotifyExerciseLimitVista.as_view(), name="alertas-exercise-limit"),
    path("alertas/stats/", NotificationStatsVista.as_view(), name="alertas-stats"),
    path("alertas/motivation/", trigger_motivation, name="alertas-motivation"),
    path("alertas/<int:pk>/read/", mark_as_read, name="alertas-mark-read"),
    path("alertas/mark-all-read/", mark_all_read, name="alertas-mark-all-read"),
]
