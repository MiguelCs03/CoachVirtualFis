from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, views
from ..models import Ejercicio
from ..serializers import EjercicioSerializer


class EjercicioController(views.APIView):
    def get(self, request, pk=None):
        if pk is not None:
            ejercicio = get_object_or_404(Ejercicio, pk=pk)
            serializer = EjercicioSerializer(ejercicio)
            return Response(serializer.data)

        ejercicios = Ejercicio.objects.all()
        serializer = EjercicioSerializer(ejercicios, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = EjercicioSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        ejercicio = get_object_or_404(Ejercicio, pk=pk)
        serializer = EjercicioSerializer(ejercicio, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        ejercicio = get_object_or_404(Ejercicio, pk=pk)
        ejercicio.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
