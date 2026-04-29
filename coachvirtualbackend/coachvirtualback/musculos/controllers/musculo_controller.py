from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework import status, views
from ..models import Musculo
from ..serializers import MusculoSerializer


class MusculoController(views.APIView):
    def get(self, request, pk=None):
        if pk is not None:
            musculo = get_object_or_404(Musculo, pk=pk)
            serializer = MusculoSerializer(musculo)
            return Response(serializer.data)

        musculos = Musculo.objects.all()
        serializer = MusculoSerializer(musculos, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = MusculoSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk):
        musculo = get_object_or_404(Musculo, pk=pk)
        serializer = MusculoSerializer(musculo, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        musculo = get_object_or_404(Musculo, pk=pk)
        musculo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
