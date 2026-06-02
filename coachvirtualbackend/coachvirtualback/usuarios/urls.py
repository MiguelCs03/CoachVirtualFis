from django.urls import path

from .controllers.alerta_controller import (
    AlertasDetalleVista,
    AlertasListaCrearVista,
    MisAlertasUltimasVista,
    MisAlertasVista,
)
from .controllers.auto_alerts_controller import (
    CheckNotificationsVista,
    NotificationStatsVista,
    NotifyExerciseLimitVista,
    NotifyRoutineCompleteVista,
    mark_all_read,
    mark_as_read,
    trigger_motivation,
)
from .controllers.usuario_controller import (
    MeView,
    UsuarioDetalleVista,
    UsuarioListaCrearVista,
)
from .controllers.dashboard_controller import DashboardStatsView
from .controllers.perfil_clinico_controller import PerfilClinicoView
from .controllers.historial_controller import HistorialPaginadoView

urlpatterns = [
    # Perfil Clínico y Historial Paginado (HUs)
    path("usuarios/perfil-clinico/", PerfilClinicoView.as_view(), name="perfil-clinico"),
    path("usuarios/historial-paginado/", HistorialPaginadoView.as_view(), name="historial-paginado"),

    # Usuario
    path("usuarios/me/", MeView.as_view(), name="me"),
    path("usuarios/", UsuarioListaCrearVista.as_view(), name="usuario-lista-crear"),
    path("usuarios", UsuarioListaCrearVista.as_view()),
    path("usuarios/<int:pk>/", UsuarioDetalleVista.as_view(), name="usuario-detalle"),
    path("usuarios/<int:pk>", UsuarioDetalleVista.as_view()),
    # Alertas - CRUD básico
    path("alertas/mis-alertas/", MisAlertasVista.as_view(), name="mis-alertas"),
    path("alertas/mis-alertas/ultimas/", MisAlertasUltimasVista.as_view(), name="mis-alertas-ultimas"),
    path("alertas/", AlertasListaCrearVista.as_view(), name="alerta-lista-crear"),
    path("alertas", AlertasListaCrearVista.as_view()),
    path("alertas/<int:pk>/", AlertasDetalleVista.as_view(), name="alerta-detalle"),
    path("alertas/<int:pk>", AlertasDetalleVista.as_view()),
    # Alertas - Notificaciones automáticas
    path("alertas/check/", CheckNotificationsVista.as_view(), name="alertas-check"),
    path("alertas/routine-complete/", NotifyRoutineCompleteVista.as_view(), name="alertas-routine-complete"),
    path("alertas/exercise-limit/", NotifyExerciseLimitVista.as_view(), name="alertas-exercise-limit"),
    path("alertas/stats/", NotificationStatsVista.as_view(), name="alertas-stats"),
    path("alertas/motivation/", trigger_motivation, name="alertas-motivation"),
    path("alertas/<int:pk>/read/", mark_as_read, name="alertas-mark-read"),
    path("alertas/mark-all-read/", mark_all_read, name="alertas-mark-all-read"),

    # Dashboard
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
]
