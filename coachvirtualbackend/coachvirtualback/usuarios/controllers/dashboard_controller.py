from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg
from ..models import HistorialEntrenamiento, ErrorPostural

class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        hoy = timezone.now()
        hace_7_dias = hoy - timedelta(days=7)
        inicio_semana = hoy - timedelta(days=hoy.weekday()) # Lunes de esta semana

        # 1. Entrenamientos de la semana
        entrenamientos_semana = HistorialEntrenamiento.objects.filter(
            usuario=user,
            fecha__gte=inicio_semana
        )
        entrenamientos_semanales_count = entrenamientos_semana.count()
        minutos_total = entrenamientos_semana.aggregate(Sum('tiempo_segundos'))['tiempo_segundos__sum'] or 0
        minutos_total = int(minutos_total / 60)
        calorias = minutos_total * 8 # Aproximación simple

        # Precisión promedio de la semana
        precision = entrenamientos_semana.aggregate(Avg('precision_porcentaje'))['precision_porcentaje__avg'] or 100.0

        # Errores frecuentes
        errores_qs = ErrorPostural.objects.filter(usuario=user, fecha__gte=hace_7_dias)
        errores_freq = errores_qs.values('tipo_error').annotate(total=Sum('cantidad')).order_by('-total')[:3]
        errores_lista = [{"error": e['tipo_error'], "cantidad": e['total']} for e in errores_freq]

        # 2. Datos para la gráfica (Últimos 7 días)
        # Inicializamos los últimos 7 días con 0
        datos_grafica = []
        nombres_dias = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"]
        
        for i in range(6, -1, -1):
            dia_eval = hoy - timedelta(days=i)
            dia_str = nombres_dias[dia_eval.weekday()]
            
            # Sumar minutos de ese día específico
            minutos_dia = HistorialEntrenamiento.objects.filter(
                usuario=user,
                fecha__year=dia_eval.year,
                fecha__month=dia_eval.month,
                fecha__day=dia_eval.day
            ).aggregate(Sum('tiempo_segundos'))['tiempo_segundos__sum'] or 0
            
            datos_grafica.append({
                "dia": dia_str,
                "minutos": int(minutos_dia / 60)
            })

        # Cálculo de racha básica (días consecutivos recientes)
        # Esto es simplificado, podrías mejorarlo
        racha = 0
        for i in range(30):
            dia_eval = hoy - timedelta(days=i)
            hubo = HistorialEntrenamiento.objects.filter(
                usuario=user,
                fecha__date=dia_eval.date()
            ).exists()
            if hubo:
                racha += 1
            else:
                # Si hoy no entrenó, no rompemos la racha si ayer sí lo hizo
                if i == 0:
                    continue
                break

        # Últimos 5 entrenamientos para el log
        ultimos_qs = HistorialEntrenamiento.objects.filter(usuario=user).order_by('-fecha')[:5]
        ultimos_entrenamientos = [{
            "ejercicio": h.nombre_ejercicio,
            "fecha": h.fecha.strftime("%Y-%m-%d %H:%M"),
            "repeticiones": h.repeticiones,
            "precision": round(h.precision_porcentaje, 1),
            "completado": h.completado
        } for h in ultimos_qs]

        return Response({
            "estadisticas": {
                "entrenamientosSemanales": entrenamientos_semanales_count,
                "minutosTotal": minutos_total,
                "caloriasQuemadas": calorias,
                "racha": racha,
                "precisionPromedio": round(precision, 1)
            },
            "erroresFrecuentes": errores_lista,
            "datosGrafica": datos_grafica,
            "ultimosEntrenamientos": ultimos_entrenamientos
        })
