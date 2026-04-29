# musculos/urls.py
from django.urls import path
from .controllers.musculo_controller import MusculoController
from .controllers.ejercicio_controller import EjercicioController
from .controllers.detalle_musculo_controller import DetalleMusculoController
from .controllers.ejercicio_asignado_controller import EjercicioAsignadoController
from .controllers.tipo_controller import TipoController   # 🔹 nuevo import
from .controllers.ejercicios_disponibles_controller import EjerciciosDisponiblesController

urlpatterns = [
    # /api/musculos/
    path('musculos/', MusculoController.as_view(), name='musculos'),
    path('musculos/<int:pk>/', MusculoController.as_view(), name='musculo-detail'),

    # /api/ejercicios/
    path('ejercicios/', EjercicioController.as_view(), name='ejercicios'),
    path('ejercicios/<int:pk>/', EjercicioController.as_view(), name='ejercicio-detail'),

    # /api/detalle-musculos/
    path('detalle-musculos/', DetalleMusculoController.as_view(), name='detalle-musculos'),
    path('detalle-musculos/<int:pk>/', DetalleMusculoController.as_view(), name='detalle-musculo-detail'),

    # /api/ejercicios-asignados/
    path('ejercicios-asignados/', EjercicioAsignadoController.as_view(), name='ejercicios-asignados'),
    path('ejercicios-asignados/<int:pk>/', EjercicioAsignadoController.as_view(), name='ejercicio-asignado-detail'),

    # /api/tipos/
    path('tipos/', TipoController.as_view(), name='tipos'),
    path('tipos/<int:pk>/', TipoController.as_view(), name='tipo-detail'),
    
    # /api/ejercicios-disponibles/ - Para generador IA
    path('ejercicios-disponibles/', EjerciciosDisponiblesController.as_view(), name='ejercicios-disponibles'),
]
