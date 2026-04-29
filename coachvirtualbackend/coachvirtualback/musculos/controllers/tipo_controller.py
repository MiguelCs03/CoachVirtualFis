# musculos/controllers/tipo_controller.py
from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, views
from ..models import Tipo
from ..serializers import TipoSerializer


class TipoController(views.APIView):
    def get(self, request, pk=None):
        if pk is not None:
            tipo = get_object_or_404(Tipo, pk=pk)
            serializer = TipoSerializer(tipo)
            return Response(serializer.data)

        tipos = Tipo.objects.all()
        serializer = TipoSerializer(tipos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TipoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        tipo = get_object_or_404(Tipo, pk=pk)
        serializer = TipoSerializer(tipo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        tipo = get_object_or_404(Tipo, pk=pk)
        tipo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
