"""Controlador para operaciones CRUD de ejercicios."""

from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Ejercicio
from ..serializers import EjercicioSerializer


class EjercicioController(views.APIView):
    """API para listar, crear, actualizar y eliminar ejercicios."""

    def get(self, request: Request, pk: int | None = None) -> Response:
        """Obtiene ejercicios o un ejercicio por ID."""
        if pk is not None:
            ejercicio = get_object_or_404(Ejercicio, pk=pk)
            serializer = EjercicioSerializer(ejercicio)
            return Response(serializer.data)

        ejercicios = Ejercicio.objects.all()
        serializer = EjercicioSerializer(ejercicios, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """Crea un ejercicio."""
        serializer = EjercicioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request: Request, pk: int) -> Response:
        """Actualiza un ejercicio por ID."""
        ejercicio = get_object_or_404(Ejercicio, pk=pk)
        serializer = EjercicioSerializer(ejercicio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request: Request, pk: int) -> Response:
        """Elimina un ejercicio por ID."""
        ejercicio = get_object_or_404(Ejercicio, pk=pk)
        ejercicio.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
