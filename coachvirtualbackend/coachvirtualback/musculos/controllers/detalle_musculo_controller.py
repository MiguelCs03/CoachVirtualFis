"""Controlador para operaciones CRUD de detalle de musculo."""

from django.shortcuts import get_object_or_404
from rest_framework import status, views
from rest_framework.request import Request
from rest_framework.response import Response

from ..models import DetalleMusculo
from ..serializers import DetalleMusculoSerializer


class DetalleMusculoController(views.APIView):
    """API para listar, crear, actualizar y eliminar detalles de musculo."""

    def get(self, request: Request, pk: int | None = None) -> Response:
        """Obtiene detalles de musculo o uno por ID."""
        if pk is not None:
            detalle_musculo = get_object_or_404(DetalleMusculo, pk=pk)
            serializer = DetalleMusculoSerializer(detalle_musculo)
            return Response(serializer.data)

        detalles_musculo = DetalleMusculo.objects.all()
        serializer = DetalleMusculoSerializer(detalles_musculo, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """Crea un detalle de musculo."""
        serializer = DetalleMusculoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request: Request, pk: int) -> Response:
        """Actualiza un detalle de musculo por ID."""
        detalle_musculo = get_object_or_404(DetalleMusculo, pk=pk)
        serializer = DetalleMusculoSerializer(detalle_musculo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request: Request, pk: int) -> Response:
        """Elimina un detalle de musculo por ID."""
        detalle_musculo = get_object_or_404(DetalleMusculo, pk=pk)
        detalle_musculo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
