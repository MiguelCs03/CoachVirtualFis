"""Controlador para operaciones CRUD de ejercicios asignados."""

from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import EjercicioAsignado
from ..serializers import EjercicioAsignadoSerializer


class EjercicioAsignadoController(views.APIView):
    """API para listar, crear, actualizar y eliminar ejercicios asignados."""

    def get(self, request: Request, pk: int | None = None) -> Response:
        """Obtiene ejercicios asignados o uno por ID."""
        if pk is not None:
            ejercicio_asignado = get_object_or_404(EjercicioAsignado, pk=pk)
            serializer = EjercicioAsignadoSerializer(ejercicio_asignado)
            return Response(serializer.data)

        ejercicios_asignados = EjercicioAsignado.objects.all()
        serializer = EjercicioAsignadoSerializer(ejercicios_asignados, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """Crea un ejercicio asignado."""
        serializer = EjercicioAsignadoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request: Request, pk: int) -> Response:
        """Actualiza un ejercicio asignado por ID."""
        ejercicio_asignado = get_object_or_404(EjercicioAsignado, pk=pk)
        serializer = EjercicioAsignadoSerializer(ejercicio_asignado, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request: Request, pk: int) -> Response:
        """Elimina un ejercicio asignado por ID."""
        ejercicio_asignado = get_object_or_404(EjercicioAsignado, pk=pk)
        ejercicio_asignado.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
