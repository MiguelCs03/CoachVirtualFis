from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Rutina
from .serializers import RutinaSerializer


class RutinaListaCrearVista(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Lista las rutinas activas del usuario autenticado."""
        rutinas = Rutina.objects.filter(usuario=request.user, activa=True)
        serializer = RutinaSerializer(rutinas, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Crea una nueva rutina para el usuario autenticado."""
        serializer = RutinaSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(usuario=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RutinaDetalleVista(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        """Obtiene detalles de una rutina específica."""
        rutina = get_object_or_404(Rutina, pk=pk, usuario=request.user)
        serializer = RutinaSerializer(rutina)
        return Response(serializer.data)

    def put(self, request, pk):
        """Actualiza una rutina específica."""
        rutina = get_object_or_404(Rutina, pk=pk, usuario=request.user)
        serializer = RutinaSerializer(rutina, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        """Elimina físicamente una rutina específica."""
        rutina = get_object_or_404(Rutina, pk=pk, usuario=request.user)
        rutina.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
