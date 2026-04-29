"""Vistas basadas en ViewSet para musculos."""

from rest_framework import viewsets

from .models import Musculo
from .serializers import MusculoSerializer


class MusculoViewSet(viewsets.ModelViewSet):
    """ViewSet CRUD para musculos."""

    queryset = Musculo.objects.all()
    serializer_class = MusculoSerializer
