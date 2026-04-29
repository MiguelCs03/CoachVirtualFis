from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, views
from ..models import Ejercicio, DetalleMusculo


class EjerciciosDisponiblesController(views.APIView):
    """
    Controller para obtener todos los ejercicios disponibles agrupados por tipo.
    Usado principalmente para el generador de rutinas con IA.
    """
    
    def get(self, request):
        """
        GET /api/ejercicios-disponibles/
        
        Devuelve ejercicios agrupados por tipo (Gimnasio/Fisioterapia) y músculo.
        
        Respuesta:
        {
            "por_tipo": [
                {
                    "tipo": "Gimnasio",
                    "musculos": {
                        "Pecho": [
                            {"id": 1, "nombre": "Press Banca", "porcentaje": "80%"}
                        ]
                    }
                }
            ],
            "todos": [
                {"id": 1, "nombre": "Press Banca", "tipo": "Gimnasio", "musculo": "Pecho"}
            ]
        }
        """
        # Obtener todos los detalles con sus relaciones
        detalles = DetalleMusculo.objects.select_related(
            'musculo__tipo', 'ejercicio'
        ).filter(ejercicio__estado=True)
        
        # Agrupar por tipo
        tipos_dict = {}
        ejercicios_dict = {}  # Para almacenar ejercicios únicos
        
        for detalle in detalles:
            tipo_nombre = detalle.musculo.tipo.nombre
            musculo_nombre = detalle.musculo.nombre
            ejercicio_id = detalle.ejercicio.id
            
            # Inicializar estructura si no existe
            if tipo_nombre not in tipos_dict:
                tipos_dict[tipo_nombre] = {
                    'tipo': tipo_nombre,
                    'musculos': {}
                }
            
            if musculo_nombre not in tipos_dict[tipo_nombre]['musculos']:
                tipos_dict[tipo_nombre]['musculos'][musculo_nombre] = []
            
            # Evitar duplicados de ejercicios
            if ejercicio_id not in ejercicios_dict:
                ejercicio_data = {
                    'id': ejercicio_id,
                    'nombre': detalle.ejercicio.nombre,
                    'url': detalle.ejercicio.url,
                    'porcentaje': detalle.porcentaje,
                    'tipo': tipo_nombre,
                    'musculo': musculo_nombre
                }
                ejercicios_dict[ejercicio_id] = ejercicio_data
                tipos_dict[tipo_nombre]['musculos'][musculo_nombre].append({
                    'id': ejercicio_id,
                    'nombre': detalle.ejercicio.nombre,
                    'porcentaje': detalle.porcentaje
                })
        
        return Response({
            'por_tipo': list(tipos_dict.values()),
            'todos': list(ejercicios_dict.values())
        })
