from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from ..models import PerfilClinico
from ..serializers import PerfilClinicoSerializer


class PerfilClinicoView(APIView):
    """
    Controlador para obtener y guardar el perfil clínico de un usuario.
    Se utiliza en el primer ingreso (Wizard) y en la visualización de datos.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Retorna el perfil clínico del usuario autenticado."""
        try:
            perfil = request.user.perfil_clinico
            serializer = PerfilClinicoSerializer(perfil)
            return Response(serializer.data)
        except PerfilClinico.DoesNotExist:
            # Retorna un flag especial indicando que es la primera vez y no hay perfil clínico
            return Response(
                {"first_time": True, "detail": "El usuario no ha configurado su perfil clínico."},
                status=status.HTTP_404_NOT_FOUND
            )

    def post(self, request: Request) -> Response:
        """Crea o actualiza el perfil clínico para el usuario autenticado."""
        try:
            perfil = request.user.perfil_clinico
            serializer = PerfilClinicoSerializer(perfil, data=request.data)
        except PerfilClinico.DoesNotExist:
            serializer = PerfilClinicoSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(usuario=request.user)
            return Response(serializer.data, status=status.HTTP_200_OK if hasattr(request.user, 'perfil_clinico') else status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
