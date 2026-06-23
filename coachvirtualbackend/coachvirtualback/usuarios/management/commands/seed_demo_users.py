"""
Comando Django para poblar la base de datos con datos demo realistas para tres usuarios:
- Sebastian Mojica (Fisioterapia / Rehabilitación)
- Maykol (Gimnasio / Hipertrofia - Masa Muscular)
- Marcelo (Gimnasio / Pérdida de Peso)

Ejecutar con: python manage.py seed_demo_users
"""

import datetime
import random
from django.core.management.base import BaseCommand
from django.utils import timezone
from usuarios.models import Usuario, PerfilClinico, HistorialEntrenamiento, ErrorPostural
from rutinas.models import Rutina, SesionEntrenamiento, EstadisticasUsuario


class Command(BaseCommand):
    help = "Pobla la base de datos con datos de prueba realistas para tres usuarios"

    def handle(self, *args, **options):
        self.stdout.write("Iniciando sembrado de datos de prueba...")

        # ----------------------------------------------------
        # DEFINICIÓN DE USUARIOS
        # ----------------------------------------------------
        users_data = [
            {
                "email": "sebastian@coachvirtual.com",
                "username": "sebastian_mojica",
                "first_name": "Sebastian",
                "last_name": "Mojica",
                "password": "sebastian123",
                "plan_actual": "premium",
                "clinico": {
                    "objetivo_principal": "Rehabilitación",
                    "experiencia_deporte": "Principiante",
                    "dias_entrenamiento": 3,
                    "equipamiento": "ninguno",
                    "tiene_dolor_lumbar": True,
                    "tiene_lesion_menisco": False,
                    "tiene_dolor_cervical": False,
                    "tiene_lesion_hombro": True,
                    "tiene_tendinitis": False,
                    "otras_lesiones": "Dolor leve recurrente en el hombro derecho al levantar peso.",
                    "observaciones": "Rehabilitación del hombro por manguito rotador leve e inestabilidad lumbar.",
                },
                "rutina": {
                    "nombre": "Fisioterapia: Rehabilitación Lumbar y Hombros",
                    "descripcion": "Rutina de movilidad articular ligera y fortalecimiento de core para disminuir dolor de espalda y hombros.",
                    "objetivo": "rehabilitacion",
                    "nivel": "principiante",
                    "categoria": "fisioterapia",
                    "parte_cuerpo": "Cuerpo completo",
                    "dias_por_semana": 3,
                    "duracion_minutos": 30,
                    "datos_rutina": [
                        {"ejercicio": "Aducción de hombros", "series": 3, "repeticiones": 10},
                        {"ejercicio": "Estiramiento lumbar", "series": 3, "repeticiones": 12},
                        {"ejercicio": "Puentes de glúteos", "series": 3, "repeticiones": 10}
                    ],
                    "generada_por_ia": True
                },
                "sesiones_config": {
                    "dias_entrenados": 9,  # 3 veces por semana durante 3 semanas
                    "ejercicios": [
                        {"nombre": "Aducción de hombros", "base_reps": 10, "tiempo_base": 45, "errores_comunes": ["Hombro levantado", "Movimiento muy rápido"]},
                        {"nombre": "Estiramiento lumbar", "base_reps": 12, "tiempo_base": 60, "errores_comunes": ["Espalda arqueada"]},
                        {"nombre": "Puentes de glúteos", "base_reps": 10, "tiempo_base": 50, "errores_comunes": ["Caderas no alineadas", "Fuerza con cuello"]}
                    ]
                }
            },
            {
                "email": "maykol@coachvirtual.com",
                "username": "maykol_mass",
                "first_name": "Maykol",
                "last_name": "Choque",
                "password": "maykol123",
                "plan_actual": "premium",
                "clinico": {
                    "objetivo_principal": "Hipertrofia",
                    "experiencia_deporte": "Intermedio",
                    "dias_entrenamiento": 4,
                    "equipamiento": "mancuernas",
                    "tiene_dolor_lumbar": False,
                    "tiene_lesion_menisco": False,
                    "tiene_dolor_cervical": False,
                    "tiene_lesion_hombro": False,
                    "tiene_tendinitis": False,
                    "otras_lesiones": "",
                    "observaciones": "Enfoque en ganancia de fuerza muscular e hipertrofia del tren superior.",
                },
                "rutina": {
                    "nombre": "Masa Muscular - Hipertrofia Tren Superior",
                    "descripcion": "Ejercicios con mancuernas para hipertrofia muscular progresiva.",
                    "objetivo": "hipertrofia",
                    "nivel": "intermedio",
                    "categoria": "gimnasio",
                    "parte_cuerpo": "Tren Superior",
                    "dias_por_semana": 4,
                    "duracion_minutos": 45,
                    "datos_rutina": [
                        {"ejercicio": "Curl de bíceps", "series": 4, "repeticiones": 12},
                        {"ejercicio": "Press de banca con mancuernas", "series": 4, "repeticiones": 10},
                        {"ejercicio": "Remo con mancuernas", "series": 4, "repeticiones": 10}
                    ],
                    "generada_por_ia": False
                },
                "sesiones_config": {
                    "dias_entrenados": 12,  # 4 veces por semana por 3 semanas
                    "ejercicios": [
                        {"nombre": "Curl de bíceps", "base_reps": 12, "tiempo_base": 50, "errores_comunes": ["Balanceo de torso", "Codos separados"]},
                        {"nombre": "Press de banca con mancuernas", "base_reps": 10, "tiempo_base": 55, "errores_comunes": ["Bajar muy rápido", "Muñecas dobladas"]},
                        {"nombre": "Remo con mancuernas", "base_reps": 10, "tiempo_base": 50, "errores_comunes": ["Espalda encorvada"]}
                    ]
                }
            },
            {
                "email": "marcelo@coachvirtual.com",
                "username": "marcelo_fit",
                "first_name": "Marcelo",
                "last_name": "Vargas",
                "password": "marcelo123",
                "plan_actual": "basico",
                "clinico": {
                    "objetivo_principal": "Pérdida de Peso",
                    "experiencia_deporte": "Avanzado",
                    "dias_entrenamiento": 5,
                    "equipamiento": "completo",
                    "tiene_dolor_lumbar": False,
                    "tiene_lesion_menisco": True,
                    "tiene_dolor_cervical": False,
                    "tiene_lesion_hombro": False,
                    "tiene_tendinitis": False,
                    "otras_lesiones": "Dolor leve en rodilla izquierda por desgaste cartilaginoso.",
                    "observaciones": "Mantener ejercicios de bajo impacto en rodillas. Enfoque cardiovascular y fuerza.",
                },
                "rutina": {
                    "nombre": "Quema de Grasa & Resistencia Funcional",
                    "descripcion": "Rutina metabólica de alta intensidad adaptada para proteger rodillas.",
                    "objetivo": "perdida_peso",
                    "nivel": "avanzado",
                    "categoria": "gimnasio",
                    "parte_cuerpo": "Cuerpo completo",
                    "dias_por_semana": 5,
                    "duracion_minutos": 50,
                    "datos_rutina": [
                        {"ejercicio": "Flexiones", "series": 4, "repeticiones": 15},
                        {"ejercicio": "Plancha", "series": 3, "repeticiones": 1},  # Representa minutos
                        {"ejercicio": "Sentadillas suaves", "series": 3, "repeticiones": 12}
                    ],
                    "generada_por_ia": True
                },
                "sesiones_config": {
                    "dias_entrenados": 15,  # 5 veces por semana por 3 semanas
                    "ejercicios": [
                        {"nombre": "Flexiones", "base_reps": 15, "tiempo_base": 40, "errores_comunes": ["Caderas bajas", "Codos muy abiertos"]},
                        {"nombre": "Plancha", "base_reps": 60, "tiempo_base": 60, "errores_comunes": ["Glúteos muy altos", "Cuello tenso"]},
                        {"nombre": "Sentadillas suaves", "base_reps": 12, "tiempo_base": 45, "errores_comunes": ["Rodillas hacia adentro", "Talones elevados"]}
                    ]
                }
            }
        ]

        # ----------------------------------------------------
        # ALIMENTANDO LA BD
        # ----------------------------------------------------
        hoy = timezone.now()

        for u_data in users_data:
            # 1. Crear o actualizar Usuario
            user, created = Usuario.objects.get_or_create(email=u_data["email"])
            user.username = u_data["username"]
            user.first_name = u_data["first_name"]
            user.last_name = u_data["last_name"]
            user.set_password(u_data["password"])
            user.plan_actual = u_data["plan_actual"]
            user.fecha_expiracion_plan = hoy + datetime.timedelta(days=30)
            user.minutos_usados_hoy = 0
            user.save()

            status_str = "creado" if created else "actualizado"
            self.stdout.write(f"Usuario {user.email} {status_str}.")

            # 2. Crear o actualizar Perfil Clínico
            clinico_fields = u_data["clinico"]
            PerfilClinico.objects.update_or_create(
                usuario=user,
                defaults=clinico_fields
            )

            # 3. Crear Rutina
            rutina_fields = u_data["rutina"]
            rutina, _ = Rutina.objects.update_or_create(
                usuario=user,
                nombre=rutina_fields["nombre"],
                defaults={
                    "descripcion": rutina_fields["descripcion"],
                    "objetivo": rutina_fields["objetivo"],
                    "nivel": rutina_fields["nivel"],
                    "categoria": rutina_fields["categoria"],
                    "parte_cuerpo": rutina_fields["parte_cuerpo"],
                    "dias_por_semana": rutina_fields["dias_por_semana"],
                    "duracion_minutos": rutina_fields["duracion_minutos"],
                    "datos_rutina": rutina_fields["datos_rutina"],
                    "generada_por_ia": rutina_fields["generada_por_ia"],
                    "activa": True
                }
            )

            # 4. Crear Historial de Sesiones y Entrenamientos
            # Limpiar historial previo para evitar duplicados infinitos al re-ejecutar
            SesionEntrenamiento.objects.filter(usuario=user).delete()
            HistorialEntrenamiento.objects.filter(usuario=user).delete()

            config_sesiones = u_data["sesiones_config"]
            dias_totales = config_sesiones["dias_entrenados"]
            
            # Generar fechas hacia atrás (cada entrenamiento ocurrió hace X días)
            fechas_entrenamiento = []
            dia_aux = hoy
            count = 0
            while len(fechas_entrenamiento) < dias_totales:
                dia_aux -= datetime.timedelta(days=1)
                if u_data["clinico"]["dias_entrenamiento"] == 3 and count % 2 == 0:
                    fechas_entrenamiento.append(dia_aux)
                elif u_data["clinico"]["dias_entrenamiento"] == 4 and count % 3 != 0:
                    fechas_entrenamiento.append(dia_aux)
                elif u_data["clinico"]["dias_entrenamiento"] == 5:
                    if dia_aux.weekday() < 5:
                        fechas_entrenamiento.append(dia_aux)
                count += 1

            fechas_entrenamiento.reverse()

            for idx, fecha_sesion in enumerate(fechas_entrenamiento):
                progreso_factor = idx / (dias_totales - 1) if dias_totales > 1 else 1.0
                precision_sesion = int(75 + (22 * progreso_factor))
                
                duracion_real = rutina.duracion_minutos + random.randint(-5, 5)
                calorias = duracion_real * (7 if rutina.categoria == "gimnasio" else 4) + random.randint(-20, 20)
                
                sesion = SesionEntrenamiento.objects.create(
                    usuario=user,
                    rutina=rutina,
                    fecha=fecha_sesion,
                    fecha_fin=fecha_sesion + datetime.timedelta(minutes=duracion_real),
                    duracion_minutos=duracion_real,
                    calorias_quemadas=calorias,
                    ejercicios_completados=len(config_sesiones["ejercicios"]),
                    notas=f"Sesión #{idx+1} completada. Sintiendo mejoría en el rendimiento.",
                    datos_sesion={"precision_promedio": precision_sesion},
                    estado=True
                )
                SesionEntrenamiento.objects.filter(pk=sesion.pk).update(fecha=fecha_sesion, created_at=fecha_sesion)

                for ej_conf in config_sesiones["ejercicios"]:
                    reps_extra = int(2 * progreso_factor)
                    reps_realizadas = ej_conf["base_reps"] + reps_extra
                    
                    precision_ejercicio = precision_sesion + random.randint(-4, 3)
                    precision_ejercicio = min(100, max(60, precision_ejercicio))
                    
                    tiempo_real = ej_conf["tiempo_base"] + random.randint(-5, 10)
                    
                    historial = HistorialEntrenamiento.objects.create(
                        usuario=user,
                        nombre_ejercicio=ej_conf["nombre"],
                        repeticiones=reps_realizadas,
                        tiempo_segundos=tiempo_real,
                        precision_porcentaje=precision_ejercicio,
                        completado=True
                    )
                    HistorialEntrenamiento.objects.filter(pk=historial.pk).update(fecha=fecha_sesion)
                    
                    tasa_error = 0.8 - (0.75 * progreso_factor)
                    if random.random() < tasa_error:
                        error_label = random.choice(ej_conf["errores_comunes"])
                        cant_errores = random.randint(1, 3) if progreso_factor < 0.5 else 1
                        rep_erronea = random.randint(1, reps_realizadas)
                        
                        error_post = ErrorPostural.objects.create(
                            historial=historial,
                            usuario=user,
                            tipo_error=error_label,
                            cantidad=cant_errores,
                            repeticion=rep_erronea
                        )
                        ErrorPostural.objects.filter(pk=error_post.pk).update(fecha=fecha_sesion)

            # 5. Crear o actualizar estadísticas
            EstadisticasUsuario.objects.filter(usuario=user).delete()
            EstadisticasUsuario.objects.create(
                usuario=user,
                entrenamientos_semanales=u_data["clinico"]["dias_entrenamiento"],
                minutos_totales_semana=u_data["clinico"]["dias_entrenamiento"] * rutina.duracion_minutos,
                calorias_quemadas_semana=u_data["clinico"]["dias_entrenamiento"] * 250,
                racha_dias=5 if u_data["clinico"]["dias_entrenamiento"] >= 4 else 3,
                ultima_actualizacion_racha=hoy.date() - datetime.timedelta(days=1),
                datos_grafica_semanal=[20, 30, 40, 20, 45, 10, 0]
            )

        self.stdout.write(self.style.SUCCESS("Datos de demostración sembrados exitosamente."))
