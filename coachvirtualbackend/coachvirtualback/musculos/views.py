from rest_framework import viewsets
from .models import Musculo
from .serializers import MusculoSerializer

class MusculoViewSet(viewsets.ModelViewSet):
    queryset = Musculo.objects.all()
    serializer_class = MusculoSerializer