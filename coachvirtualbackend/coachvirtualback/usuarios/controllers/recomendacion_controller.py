from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from django.db.models import Avg
from ..models import PerfilClinico, HistorialEntrenamiento
from musculos.models import Ejercicio, DetalleMusculo

class RecomendacionView(APIView):
    """
    Controlador para la recomendación inteligente de rutinas diarias (HU-6).
    Ajusta dinámicamente las series según el progreso del usuario (HU-7).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request: Request) -> Response:
        user = request.user
        
        # 1. Obtener datos clínicos (Objetivo y lesiones)
        objetivo = "Acondicionamiento"
        dias_semana = 3
        dolor_lumbar = False
        lesion_menisco = False
        dolor_cervical = False
        lesion_hombro = False
        tendinitis = False
        
        try:
            perfil = user.perfil_clinico
            objetivo = perfil.objetivo_principal or "Rehabilitación"
            dias_semana = perfil.dias_entrenamiento or 3
            dolor_lumbar = perfil.tiene_dolor_lumbar
            lesion_menisco = perfil.tiene_lesion_menisco
            dolor_cervical = perfil.tiene_dolor_cervical
            lesion_hombro = perfil.tiene_lesion_hombro
            tendinitis = perfil.tiene_tendinitis
        except PerfilClinico.DoesNotExist:
            pass

        # 2. HU-7: Ajuste dinámico de dificultad (series) según precisión reciente
        historial_reciente = HistorialEntrenamiento.objects.filter(usuario=user).order_by("-fecha")[:3]
        precision_promedio = 100.0
        
        if historial_reciente.exists():
            precision_promedio = historial_reciente.aggregate(Avg("precision_porcentaje"))["precision_porcentaje__avg"] or 100.0
            
        # Determinar series base según rendimiento
        if precision_promedio >= 85.0:
            series_calculadas = 4  # Excelente técnica -> Aumenta dificultad
            motivo_dificultad = "Excelente técnica reciente (+1 serie aplicada)"
        elif precision_promedio < 75.0:
            series_calculadas = 2  # Técnica irregular -> Reduce dificultad para cuidar postura
            motivo_dificultad = "Técnica irregular reciente (-1 serie para seguridad)"
        else:
            series_calculadas = 3  # Dificultad normal
            motivo_dificultad = "Dificultad óptima (3 series base)"

        # 3. Obtener ejercicios activos y filtrar según perfil clínico (lesiones)
        ejercicios_qs = Ejercicio.objects.filter(estado=True)
        ejercicios_validos = []
        
        for ej in ejercicios_qs:
            nombre_lower = ej.nombre.lower()
            
            # Filtros clínicos para evitar ejercicios peligrosos
            if dolor_lumbar and any(word in nombre_lower for word in ["sentadilla", "peso muerto", "crunch", "abdom", "plancha"]):
                continue
            if lesion_menisco and any(word in nombre_lower for word in ["sentadilla", "flexión corta", "extensión pierna"]):
                continue
            if dolor_cervical and any(word in nombre_lower for word in ["militar", "elevación brazos"]):
                continue
            if lesion_hombro and any(word in nombre_lower for word in ["hombro", "press banca", "apertura"]):
                continue
            if tendinitis:
                # Si hay inflamación, sugerir pesos livianos / rotación
                pass
                
            ejercicios_validos.append(ej)

        # Dataset de fallback si la base de datos de ejercicios está vacía
        if not ejercicios_validos:
            # Fallback seguro predefinido
            ejercicios_validos = [
                {"id": 101, "nombre": "Elevación de brazos lateral", "url": "https://res.cloudinary.com/dwerzrgya/image/upload/v1763605419/dq0vqy6dcggcenypviqj.png"},
                {"id": 102, "nombre": "Estiramiento lateral de cintura", "url": "https://res.cloudinary.com/dwerzrgya/image/upload/v1763604770/plwajctd1bmiaz7tc9ai.png"},
                {"id": 103, "nombre": "Aducción de hombros", "url": "https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png"},
                {"id": 104, "nombre": "Rotación de antebrazo con bastón", "url": "https://res.cloudinary.com/dwerzrgya/image/upload/v1763604987/sektsdmnzjrzrdb1ziyl.png"}
            ]

        # Tomar 4 ejercicios de forma consistente
        import hashlib
        # Usamos el día del mes y el ID de usuario para que la rutina cambie cada día, pero sea consistente hoy
        from django.utils import timezone
        seed_str = f"{user.id}-{timezone.now().day}"
        hash_seed = int(hashlib.md5(seed_str.encode()).hexdigest(), 16)
        
        ejercicios_finales = []
        for i in range(min(4, len(ejercicios_validos))):
            idx = (hash_seed + i) % len(ejercicios_validos)
            item = ejercicios_validos[idx]
            
            # Asegurar formato dict para serializar
            if isinstance(item, Ejercicio):
                ejercicios_finales.append({
                    "id": item.id,
                    "nombre": item.nombre,
                    "url": item.url,
                    "series": series_calculadas,
                    "repeticiones": 12,
                    "descanso": 60
                })
            else:
                ejercicios_finales.append({
                    "id": item["id"],
                    "nombre": item["nombre"],
                    "url": item["url"],
                    "series": series_calculadas,
                    "repeticiones": 12,
                    "descanso": 60
                })

        # 4. Construir recomendación
        categoria_sugerida = "Fisioterapia" if objetivo == "Rehabilitación" else "Gimnasio"
        
        # Explicar la lógica de la recomendación al usuario de forma transparente
        razon = f"Rutina diaria adaptada a tu objetivo de {objetivo}."
        if dolor_lumbar or lesion_menisco or lesion_hombro or dolor_cervical:
            razon += " Filtros clínicos activos para proteger tus zonas de molestia reportadas."

        return Response({
            "nombre": f"Rutina IA del Día: {objetivo}",
            "descripcion": razon,
            "categoria": categoria_sugerida,
            "duracion": 30 if objetivo == "Rehabilitación" else 45,
            "motivo_dificultad": motivo_dificultad,
            "series": series_calculadas,
            "ejercicios": ejercicios_finales
        })
