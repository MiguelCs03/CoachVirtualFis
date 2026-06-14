from django.urls import path
from .views import RutinaDetalleVista, RutinaListaCrearVista

urlpatterns = [
    path("rutinas/", RutinaListaCrearVista.as_view(), name="rutinas-lista-crear"),
    path("rutinas/<int:pk>/", RutinaDetalleVista.as_view(), name="rutinas-detalle"),
]
