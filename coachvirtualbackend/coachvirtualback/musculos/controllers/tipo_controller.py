"""Controlador para operaciones CRUD de tipos."""

from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Tipo
from ..serializers import TipoSerializer


class TipoController(views.APIView):
    """API para listar, crear, actualizar y eliminar tipos."""

    def get(self, request: Request, pk: int | None = None) -> Response:
        """Obtiene tipos o un tipo por ID."""
        if pk is not None:
            tipo = get_object_or_404(Tipo, pk=pk)
            serializer = TipoSerializer(tipo)
            return Response(serializer.data)

        tipos = Tipo.objects.all()
        serializer = TipoSerializer(tipos, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """Crea un tipo."""
        serializer = TipoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request: Request, pk: int) -> Response:
        """Actualiza un tipo por ID."""
        tipo = get_object_or_404(Tipo, pk=pk)
        serializer = TipoSerializer(tipo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request: Request, pk: int) -> Response:
        """Elimina un tipo por ID."""
        tipo = get_object_or_404(Tipo, pk=pk)
        tipo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
