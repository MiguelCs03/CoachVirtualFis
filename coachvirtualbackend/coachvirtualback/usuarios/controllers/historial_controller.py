from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from django.db.models import Sum
from ..models import HistorialEntrenamiento


class HistorialPaginadoView(APIView):
    """
    Controlador para obtener el historial detallado de sesiones de un usuario de forma paginada.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        
        # Obtener parámetros de paginación
        try:
            page = int(request.query_params.get("page", 1))
            page_size = int(request.query_params.get("page_size", 10))
        except ValueError:
            page = 1
            page_size = 10

        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 10

        # Query base del historial
        queryset = HistorialEntrenamiento.objects.filter(usuario=user).order_by("-fecha")
        total_count = queryset.count()

        # Calcular métricas globales acumuladas para todo el historial
        metricas_acumuladas = queryset.aggregate(
            tiempo_total=Sum('tiempo_segundos'),
            repeticiones_totales=Sum('repeticiones')
        )
        tiempo_segundos_total = metricas_acumuladas['tiempo_total'] or 0.0
        minutos_totales = int(tiempo_segundos_total / 60)
        segundos_totales = int(tiempo_segundos_total % 60)
        repeticiones_totales = metricas_acumuladas['repeticiones_totales'] or 0

        # Paginación
        start = (page - 1) * page_size
        end = start + page_size
        paginated_qs = queryset[start:end]

        # Serialización manual rápida y limpia
        resultados = []
        for h in paginated_qs:
            minutos = int(h.tiempo_segundos / 60)
            segundos = int(h.tiempo_segundos % 60)
            resultados.append({
                "id": h.id,
                "ejercicio": h.nombre_ejercicio,
                "fecha": h.fecha.strftime("%Y-%m-%d %H:%M"),
                "repeticiones": h.repeticiones,
                "tiempo_segundos": h.tiempo_segundos,
                "tiempo_formateado": f"{minutos} min {segundos} s" if minutos > 0 else f"{segundos} s",
                "minutos_entrenados": round(h.tiempo_segundos / 60.0, 1),
                "precision": round(h.precision_porcentaje, 1),
                "completado": h.completado
            })

        has_next = end < total_count
        has_prev = page > 1

        return Response({
            "count": total_count,
            "page": page,
            "page_size": page_size,
            "has_next": has_next,
            "has_prev": has_prev,
            "total_pages": (total_count + page_size - 1) // page_size if total_count > 0 else 1,
            "resultados": resultados,
            "metricas_globales": {
                "tiempo_total_formateado": f"{minutos_totales} min {segundos_totales} s" if minutos_totales > 0 else f"{segundos_totales} s",
                "minutos_totales": minutos_totales,
                "repeticiones_totales": repeticiones_totales,
            }
        })

    def post(self, request: Request) -> Response:
        """Guarda uno o varios ejercicios completados en el historial."""
        user = request.user
        data = request.data

        # Si viene un listado, se crea en lote (bulk create)
        if isinstance(data, list):
            items_to_create = []
            for item in data:
                nombre = item.get("nombre_ejercicio")
                if nombre:
                    items_to_create.append(HistorialEntrenamiento(
                        usuario=user,
                        nombre_ejercicio=nombre,
                        repeticiones=int(item.get("repeticiones", 0)),
                        tiempo_segundos=float(item.get("tiempo_segundos", 0.0)),
                        precision_porcentaje=float(item.get("precision_porcentaje", 100.0)),
                        completado=item.get("completado", True)
                    ))
            
            if items_to_create:
                created = HistorialEntrenamiento.objects.bulk_create(items_to_create)
                # Verifica logros y metas
                from ..services.notification_engine import NotificationEngine
                engine = NotificationEngine(user)
                engine.check_weekly_goal_reached()
                total_routines = HistorialEntrenamiento.objects.filter(usuario=user, completado=True).count()
                engine.check_progress_milestone(total_routines)

                return Response({"detail": f"Se crearon {len(created)} registros exitosamente."}, status=status.HTTP_201_CREATED)
            return Response({"detail": "No se enviaron registros validos."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Si es un solo registro
        else:
            nombre = data.get("nombre_ejercicio")
            if not nombre:
                return Response({"detail": "El nombre del ejercicio es requerido."}, status=status.HTTP_400_BAD_REQUEST)
            
            h = HistorialEntrenamiento.objects.create(
                usuario=user,
                nombre_ejercicio=nombre,
                repeticiones=int(data.get("repeticiones", 0)),
                tiempo_segundos=float(data.get("tiempo_segundos", 0.0)),
                precision_porcentaje=float(data.get("precision_porcentaje", 100.0)),
                completado=data.get("completado", True)
            )
            
            # Verifica logros y metas
            from ..services.notification_engine import NotificationEngine
            engine = NotificationEngine(user)
            engine.check_weekly_goal_reached()
            total_routines = HistorialEntrenamiento.objects.filter(usuario=user, completado=True).count()
            engine.check_progress_milestone(total_routines)

            return Response({
                "id": h.id,
                "nombre_ejercicio": h.nombre_ejercicio,
                "completado": h.completado
            }, status=status.HTTP_201_CREATED)
