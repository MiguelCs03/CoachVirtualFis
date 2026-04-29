from django.urls import path
from .controllers.pose_controller import (
    PoseTrainingDataListaCrearVista,
    PoseTrainingDataDetalleVista,
    PoseTrainingDataEstadisticasVista,
    PoseTrainingDataExportVista
)

urlpatterns = [
    # CRUD básico
    path('', PoseTrainingDataListaCrearVista.as_view(), name='pose-lista-crear'),
    path('<int:pk>/', PoseTrainingDataDetalleVista.as_view(), name='pose-detalle'),
    
    # Endpoints adicionales
    path('stats/', PoseTrainingDataEstadisticasVista.as_view(), name='pose-estadisticas'),
    path('export/', PoseTrainingDataExportVista.as_view(), name='pose-export'),
]
