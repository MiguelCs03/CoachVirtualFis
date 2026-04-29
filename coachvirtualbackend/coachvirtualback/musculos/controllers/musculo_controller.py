"""Controlador para operaciones CRUD de musculos."""

from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import Musculo
from ..serializers import MusculoSerializer


class MusculoController(views.APIView):
    """API para listar, crear, actualizar y eliminar musculos."""

    def get(self, request: Request, pk: int | None = None) -> Response:
        """Obtiene musculos o un musculo por ID."""
        if pk is not None:
            musculo = get_object_or_404(Musculo, pk=pk)
            serializer = MusculoSerializer(musculo)
            return Response(serializer.data)

        musculos = Musculo.objects.all()
        serializer = MusculoSerializer(musculos, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """Crea un musculo."""
        serializer = MusculoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request: Request, pk: int) -> Response:
        """Actualiza un musculo por ID."""
        musculo = get_object_or_404(Musculo, pk=pk)
        serializer = MusculoSerializer(musculo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request: Request, pk: int) -> Response:
        """Elimina un musculo por ID."""
        musculo = get_object_or_404(Musculo, pk=pk)
        musculo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
