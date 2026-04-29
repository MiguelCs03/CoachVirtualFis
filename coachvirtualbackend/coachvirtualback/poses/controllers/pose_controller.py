from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db.models import Count
from ..models import PoseTrainingData
from ..serializers import PoseTrainingDataSerializer


class PoseTrainingDataListaCrearVista(APIView):
    """
    Vista para listar y crear datos de entrenamiento de poses.
    
    GET: Lista todos los datos de entrenamiento (con filtros opcionales)
    POST: Crea un nuevo dato de entrenamiento (snapshot o secuencia)
    """
    permission_classes = [AllowAny]  # Cambiar según tus necesidades
    
    def get(self, request):
        """
        Lista todos los datos de entrenamiento.
        
        Parámetros de consulta opcionales:
        - ejercicio: filtrar por tipo de ejercicio
        - etiqueta: filtrar por etiqueta (correcto/incorrecto)
        - tipo: filtrar por tipo (snapshot/secuencia)
        """
        queryset = PoseTrainingData.objects.all()
        
        # Aplicar filtros
        ejercicio = request.query_params.get('ejercicio', None)
        if ejercicio:
            queryset = queryset.filter(ejercicio=ejercicio)
            
        etiqueta = request.query_params.get('etiqueta', None)
        if etiqueta:
            queryset = queryset.filter(etiqueta=etiqueta)
            
        tipo = request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        queryset = queryset.order_by('-created_at')
        serializer = PoseTrainingDataSerializer(queryset, many=True)
        return Response(serializer.data)
    
    def post(self, request):
        """
        Crea un nuevo dato de entrenamiento.
        
        Body esperado:
        - Para snapshot: {ejercicio, tipo: "snapshot", landmarks, angulos, etiqueta}
        - Para secuencia: {ejercicio, tipo: "secuencia", frames, duracion_segundos, fps, total_frames, etiqueta}
        """
        serializer = PoseTrainingDataSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PoseTrainingDataDetalleVista(APIView):
    """
    Vista para obtener, actualizar o eliminar un dato de entrenamiento específico.
    
    GET: Obtiene un dato específico
    PUT: Actualiza un dato específico
    DELETE: Elimina un dato específico
    """
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        """Obtiene un dato de entrenamiento por ID"""
        pose_data = get_object_or_404(PoseTrainingData, pk=pk)
        serializer = PoseTrainingDataSerializer(pose_data)
        return Response(serializer.data)
    
    def put(self, request, pk):
        """Actualiza un dato de entrenamiento"""
        pose_data = get_object_or_404(PoseTrainingData, pk=pk)
        serializer = PoseTrainingDataSerializer(pose_data, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        """Elimina un dato de entrenamiento"""
        pose_data = get_object_or_404(PoseTrainingData, pk=pk)
        pose_data.delete()
        return Response(
            {"message": "Dato de entrenamiento eliminado correctamente"},
            status=status.HTTP_204_NO_CONTENT
        )


class PoseTrainingDataEstadisticasVista(APIView):
    """
    Vista para obtener estadísticas del dataset de entrenamiento.
    
    GET: Retorna estadísticas agregadas
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Obtiene estadísticas del dataset.
        
        Retorna:
        - Total de registros
        - Conteo por tipo (snapshot/secuencia)
        - Conteo por etiqueta (correcto/incorrecto)
        - Conteo por ejercicio
        - Estadísticas de secuencias (total frames, promedio)
        """
        queryset = PoseTrainingData.objects.all()
        
        # Estadísticas generales
        total = queryset.count()
        por_tipo = queryset.values('tipo').annotate(count=Count('id'))
        por_etiqueta = queryset.values('etiqueta').annotate(count=Count('id'))
        por_ejercicio = queryset.values('ejercicio').annotate(count=Count('id'))
        
        # Estadísticas de secuencias
        secuencias = queryset.filter(tipo='secuencia')
        total_frames = sum([s.total_frames for s in secuencias if s.total_frames])
        
        return Response({
            'total_registros': total,
            'por_tipo': list(por_tipo),
            'por_etiqueta': list(por_etiqueta),
            'por_ejercicio': list(por_ejercicio),
            'secuencias': {
                'total': secuencias.count(),
                'total_frames': total_frames,
                'promedio_frames': total_frames / secuencias.count() if secuencias.count() > 0 else 0
            }
        })


class PoseTrainingDataExportVista(APIView):
    """
    Vista para exportar datos de entrenamiento en formato optimizado para ML.
    
    GET: Exporta los datos en formato JSON optimizado
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        Exporta los datos en formato optimizado para machine learning.
        
        Parámetros de consulta opcionales:
        - formato: 'completo' (default) o 'ml' (optimizado para ML)
        - ejercicio, etiqueta, tipo: filtros
        
        Formato ML: Cada frame de secuencia se convierte en un sample individual
        """
        queryset = PoseTrainingData.objects.all()
        
        # Aplicar filtros
        ejercicio = request.query_params.get('ejercicio', None)
        if ejercicio:
            queryset = queryset.filter(ejercicio=ejercicio)
            
        etiqueta = request.query_params.get('etiqueta', None)
        if etiqueta:
            queryset = queryset.filter(etiqueta=etiqueta)
            
        tipo = request.query_params.get('tipo', None)
        if tipo:
            queryset = queryset.filter(tipo=tipo)
        
        formato = request.query_params.get('formato', 'completo')
        
        if formato == 'ml':
            # Formato optimizado para machine learning
            data_ml = []
            
            for item in queryset:
                if item.tipo == 'snapshot':
                    data_ml.append({
                        'ejercicio': item.ejercicio,
                        'tipo': 'snapshot',
                        'landmarks': item.landmarks,
                        'angulos': item.angulos,
                        'etiqueta': item.etiqueta,
                        'etiqueta_numerica': 1 if item.etiqueta == 'correcto' else 0
                    })
                elif item.tipo == 'secuencia':
                    # Para secuencias, incluir cada frame como un sample
                    for frame in item.frames:
                        data_ml.append({
                            'ejercicio': item.ejercicio,
                            'tipo': 'secuencia_frame',
                            'landmarks': frame.get('landmarks'),
                            'angulos': frame.get('angulos'),
                            'timestamp': frame.get('timestamp'),
                            'etiqueta': item.etiqueta,
                            'etiqueta_numerica': 1 if item.etiqueta == 'correcto' else 0,
                            'secuencia_id': item.id
                        })
            
            return Response({
                'total_samples': len(data_ml),
                'formato': 'ml_optimizado',
                'descripcion': 'Datos expandidos listos para entrenamiento de modelos',
                'data': data_ml
            })
        else:
            # Formato completo
            serializer = PoseTrainingDataSerializer(queryset, many=True)
            return Response({
                'total': queryset.count(),
                'formato': 'completo',
                'data': serializer.data
            })
