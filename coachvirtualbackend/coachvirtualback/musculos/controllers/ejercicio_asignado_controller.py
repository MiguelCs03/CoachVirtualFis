from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, views
from ..models import EjercicioAsignado
from ..serializers import EjercicioAsignadoSerializer


class EjercicioAsignadoController(views.APIView):
    def get(self, request, pk=None):
        if pk is not None:
            ejercicio_asignado = get_object_or_404(EjercicioAsignado, pk=pk)
            serializer = EjercicioAsignadoSerializer(ejercicio_asignado)
            return Response(serializer.data)

        ejercicios_asignados = EjercicioAsignado.objects.all()
        serializer = EjercicioAsignadoSerializer(ejercicios_asignados, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EjercicioAsignadoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        ejercicio_asignado = get_object_or_404(EjercicioAsignado, pk=pk)
        serializer = EjercicioAsignadoSerializer(ejercicio_asignado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ejercicio_asignado = get_object_or_404(EjercicioAsignado, pk=pk)
        ejercicio_asignado.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
