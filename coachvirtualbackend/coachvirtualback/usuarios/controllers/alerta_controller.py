"""Controladores para alertas de usuario."""

from django.db import IntegrityError
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import Alertas
from ..serializers import AlertasSerializer


class AlertasListaCrearVista(APIView):
    """Lista/crea alertas.
    - Superusuario: ve todas; puede filtrar por ?usuario=<id>
    - Usuario normal: solo ve sus alertas, ignora ?usuario ajeno
    """

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Lista alertas segun permisos y filtros."""
        # más recientes primero (por creación)
        qs = Alertas.objects.select_related("usuario").all().order_by("-created_at", "-id")

        usuario_qs = request.query_params.get("usuario")
        mine = request.query_params.get("mine") == "1"

        if request.user.is_superuser:
            if usuario_qs:
                qs = qs.filter(usuario_id=usuario_qs)
        else:
            qs = qs.filter(usuario_id=request.user.id)

        if mine:
            qs = qs.filter(usuario_id=request.user.id)

        serializer = AlertasSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request: Request) -> Response:
        """Crea una nueva alerta para el usuario autenticado."""
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Autenticación requerida (envía Authorization: Bearer <token>)"},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = AlertasSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)

        try:
            alerta = serializer.save()
            return Response(AlertasSerializer(alerta).data, status=status.HTTP_201_CREATED)
        except IntegrityError as e:
            return Response(
                {"detail": f"Error de integridad: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )


class MisAlertasVista(APIView):
    """/alertas/mis-alertas/ — lista mis alertas (más recientes primero)."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Lista las alertas del usuario autenticado."""
        qs = Alertas.objects.filter(usuario=request.user).order_by("-created_at", "-id")
        return Response(AlertasSerializer(qs, many=True).data)


class MisAlertasUltimasVista(APIView):
    """/alertas/mis-alertas/ultimas/?since=<id>
    Devuelve solo mis alertas con id > since (orden ascendente para avanzar puntero)."""

    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        """Lista alertas posteriores al ID indicado."""
        since = request.query_params.get("since")
        qs = Alertas.objects.filter(usuario=request.user)
        if since and str(since).isdigit():
            qs = qs.filter(id__gt=int(since))
        qs = qs.order_by("id")
        return Response(AlertasSerializer(qs, many=True).data)


class AlertasDetalleVista(APIView):
    permission_classes = [IsAuthenticated]

    def _can(self, request: Request, alerta: Alertas) -> bool:
        """Valida si el usuario puede acceder a la alerta."""
        return request.user.is_superuser or alerta.usuario_id == request.user.id

    def get(self, request: Request, pk: int) -> Response:
        """Obtiene una alerta por ID."""
        alerta = get_object_or_404(Alertas, pk=pk)
        if not self._can(request, alerta):
            return Response({"detail": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)
        return Response(AlertasSerializer(alerta).data)

    def put(self, request: Request, pk: int) -> Response:
        """Actualiza una alerta por ID."""
        alerta = get_object_or_404(Alertas, pk=pk)
        if not self._can(request, alerta):
            return Response({"detail": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data.pop("usuario", None)  # no permitir reasignar dueño

        serializer = AlertasSerializer(alerta, data=data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request: Request, pk: int) -> Response:
        """Elimina una alerta por ID."""
        alerta = get_object_or_404(Alertas, pk=pk)
        if not self._can(request, alerta):
            return Response({"detail": "No autorizado."}, status=status.HTTP_403_FORBIDDEN)
        alerta.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
