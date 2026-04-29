"""Controladores CRUD para TipoPlan y MetodoPago."""

from django.db import IntegrityError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from ..models import MetodoPago, TipoPlan

# ==================== TIPO PLAN CRUD ====================


class ListarTiposPlanVista(APIView):
    """
    Lista todos los tipos de plan disponibles.
    GET: Sin autenticación para mostrar en página pública.
    """

    permission_classes = []  # Público

    def get(self, request: Request) -> Response:
        """Lista planes segun filtro de activos."""
        # Mostrar solo activos para usuarios normales
        solo_activos = request.query_params.get("activos", "true").lower() == "true"

        if solo_activos:
            planes = TipoPlan.objects.filter(activo=True)
        else:
            planes = TipoPlan.objects.all()

        return Response({"planes": [p.to_dict() for p in planes], "total": planes.count()})


class CrearTipoPlanVista(APIView):
    """
    Crea un nuevo tipo de plan.
    POST: Requiere ser administrador.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Crea un tipo de plan."""
        if not request.user.is_superuser:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data

        # Validar campos requeridos
        if not data.get("nombre") or not data.get("clave"):
            return Response(
                {"error": "Nombre y clave son requeridos"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Verificar que clave sea única
        if TipoPlan.objects.filter(clave=data["clave"]).exists():
            return Response(
                {"error": f"Ya existe un plan con la clave \"{data['clave']}\""},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            plan = TipoPlan.objects.create(
                nombre=data["nombre"],
                clave=data["clave"],
                descripcion=data.get("descripcion", ""),
                precio=data.get("precio", 0),
                duracion_dias=data.get("duracion_dias", 30),
                minutos_por_dia=data.get("minutos_por_dia", 15),
                feedback_voz=data.get("feedback_voz", False),
                analisis_angulos=data.get("analisis_angulos", False),
                historial_dias=data.get("historial_dias", 0),
                con_anuncios=data.get("con_anuncios", True),
                rutinas_personalizadas=data.get("rutinas_personalizadas", False),
                soporte_prioritario=data.get("soporte_prioritario", False),
                icono=data.get("icono", "⭐"),
                color=data.get("color", "from-gray-400 to-gray-500"),
                orden=data.get("orden", 0),
                popular=data.get("popular", False),
                activo=data.get("activo", True),
            )

            return Response(
                {"mensaje": "Plan creado exitosamente", "plan": plan.to_dict()},
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ActualizarTipoPlanVista(APIView):
    """
    Actualiza un tipo de plan existente.
    PUT/PATCH: Requiere ser administrador.
    """

    permission_classes = [IsAuthenticated]

    def put(self, request: Request, plan_id: int) -> Response:
        """Actualiza un tipo de plan (PUT)."""
        return self._actualizar(request, plan_id)

    def patch(self, request: Request, plan_id: int) -> Response:
        """Actualiza un tipo de plan (PATCH)."""
        return self._actualizar(request, plan_id)

    def _actualizar(self, request: Request, plan_id: int) -> Response:
        """Actualiza campos permitidos del plan."""
        if not request.user.is_superuser:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        try:
            plan = TipoPlan.objects.get(id=plan_id)
        except TipoPlan.DoesNotExist:
            return Response({"error": "Plan no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        # Actualizar campos
        for field in [
            "nombre",
            "descripcion",
            "precio",
            "duracion_dias",
            "minutos_por_dia",
            "feedback_voz",
            "analisis_angulos",
            "historial_dias",
            "con_anuncios",
            "rutinas_personalizadas",
            "soporte_prioritario",
            "icono",
            "color",
            "orden",
            "popular",
            "activo",
        ]:
            if field in data:
                setattr(plan, field, data[field])

        plan.save()

        return Response({"mensaje": "Plan actualizado exitosamente", "plan": plan.to_dict()})


class EliminarTipoPlanVista(APIView):
    """
    Elimina un tipo de plan.
    DELETE: Requiere ser administrador.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, plan_id: int) -> Response:
        """Elimina un tipo de plan."""
        if not request.user.is_superuser:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        try:
            plan = TipoPlan.objects.get(id=plan_id)
        except TipoPlan.DoesNotExist:
            return Response({"error": "Plan no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        nombre = plan.nombre
        plan.delete()

        return Response({"mensaje": f'Plan "{nombre}" eliminado exitosamente'})


# ==================== METODO PAGO CRUD ====================


class ListarMetodosPagoVista(APIView):
    """
    Lista todos los métodos de pago disponibles.
    GET: Sin autenticación.
    """

    permission_classes = []

    def get(self, request: Request) -> Response:
        """Lista metodos de pago segun filtro de activos."""
        solo_activos = request.query_params.get("activos", "true").lower() == "true"

        if solo_activos:
            metodos = MetodoPago.objects.filter(activo=True)
        else:
            metodos = MetodoPago.objects.all()

        return Response({"metodos": [m.to_dict() for m in metodos], "total": metodos.count()})


class CrearMetodoPagoVista(APIView):
    """
    Crea un nuevo método de pago.
    POST: Requiere ser administrador.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request: Request) -> Response:
        """Crea un metodo de pago."""
        if not request.user.is_superuser:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        data = request.data

        if not data.get("nombre") or not data.get("clave"):
            return Response(
                {"error": "Nombre y clave son requeridos"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if MetodoPago.objects.filter(clave=data["clave"]).exists():
            return Response(
                {"error": f"Ya existe un método con la clave \"{data['clave']}\""},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            metodo = MetodoPago.objects.create(
                nombre=data["nombre"],
                clave=data["clave"],
                descripcion=data.get("descripcion", ""),
                icono=data.get("icono", "💳"),
                color=data.get("color", "bg-blue-500"),
                activo=data.get("activo", True),
                orden=data.get("orden", 0),
                requiere_referencia=data.get("requiere_referencia", False),
                instrucciones=data.get("instrucciones", ""),
            )

            return Response(
                {"mensaje": "Método de pago creado exitosamente", "metodo": metodo.to_dict()},
                status=status.HTTP_201_CREATED,
            )

        except IntegrityError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ActualizarMetodoPagoVista(APIView):
    """
    Actualiza un método de pago existente.
    PUT/PATCH: Requiere ser administrador.
    """

    permission_classes = [IsAuthenticated]

    def put(self, request: Request, metodo_id: int) -> Response:
        """Actualiza un metodo de pago (PUT)."""
        return self._actualizar(request, metodo_id)

    def patch(self, request: Request, metodo_id: int) -> Response:
        """Actualiza un metodo de pago (PATCH)."""
        return self._actualizar(request, metodo_id)

    def _actualizar(self, request: Request, metodo_id: int) -> Response:
        """Actualiza campos permitidos del metodo."""
        if not request.user.is_superuser:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        try:
            metodo = MetodoPago.objects.get(id=metodo_id)
        except MetodoPago.DoesNotExist:
            return Response({"error": "Método no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        data = request.data

        for field in [
            "nombre",
            "descripcion",
            "icono",
            "color",
            "activo",
            "orden",
            "requiere_referencia",
            "instrucciones",
        ]:
            if field in data:
                setattr(metodo, field, data[field])

        metodo.save()

        return Response(
            {
                "mensaje": "Método de pago actualizado exitosamente",
                "metodo": metodo.to_dict(),
            }
        )


class EliminarMetodoPagoVista(APIView):
    """
    Elimina un método de pago.
    DELETE: Requiere ser administrador.
    """

    permission_classes = [IsAuthenticated]

    def delete(self, request: Request, metodo_id: int) -> Response:
        """Elimina un metodo de pago."""
        if not request.user.is_superuser:
            return Response({"error": "No autorizado"}, status=status.HTTP_403_FORBIDDEN)

        try:
            metodo = MetodoPago.objects.get(id=metodo_id)
        except MetodoPago.DoesNotExist:
            return Response({"error": "Método no encontrado"}, status=status.HTTP_404_NOT_FOUND)

        nombre = metodo.nombre
        metodo.delete()

        return Response({"mensaje": f'Método "{nombre}" eliminado exitosamente'})
