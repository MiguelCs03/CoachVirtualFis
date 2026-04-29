"""
Django management command para poblar la base de datos con datos de entrenamiento
de poses para el sistema de Inteligencia Artificial.

Este dataset contiene ejemplos de posturas correctas e incorrectas para cada ejercicio,
incluyendo landmarks (puntos clave) y ángulos calculados para entrenar modelos ML.

Uso:
    python manage.py seed_poses
    python manage.py seed_poses --clear  # Borra datos existentes primero
"""

from django.core.management.base import BaseCommand

from poses.models import PoseTrainingData


class Command(BaseCommand):
    help = "Poblar base de datos con datos de entrenamiento de poses para IA"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Eliminar todos los datos existentes antes de insertar",
        )

    def handle(self, *args, **options):
        self.stdout.write("=" * 70)
        self.stdout.write(self.style.SUCCESS("🤖 INICIANDO POBLACIÓN DE DATASET DE IA"))
        self.stdout.write("=" * 70)

        if options["clear"]:
            self.clear_data()

        self.seed_flexiones()
        self.seed_sentadillas()
        self.seed_plancha()
        self.seed_curl_biceps()
        self.seed_elevacion_piernas()
        self.seed_remo()

        self.stdout.write("\n" + "=" * 70)
        self.stdout.write(self.style.SUCCESS("✅ DATASET DE IA COMPLETADO"))
        self.stdout.write("=" * 70)

        # Estadísticas
        total = PoseTrainingData.objects.count()
        correctos = PoseTrainingData.objects.filter(etiqueta="correcto").count()
        incorrectos = PoseTrainingData.objects.filter(etiqueta="incorrecto").count()
        snapshots = PoseTrainingData.objects.filter(tipo="snapshot").count()
        secuencias = PoseTrainingData.objects.filter(tipo="secuencia").count()

        self.stdout.write("\n📊 Estadísticas del Dataset:")
        self.stdout.write(f"  - Total de muestras: {total}")
        self.stdout.write(f"  - Posturas correctas: {correctos}")
        self.stdout.write(f"  - Posturas incorrectas: {incorrectos}")
        self.stdout.write(f"  - Snapshots: {snapshots}")
        self.stdout.write(f"  - Secuencias: {secuencias}")
        self.stdout.write(f"  - Precisión objetivo: {(correctos/total*100):.1f}% correctos" if total > 0 else "")
        self.stdout.write("")

    def clear_data(self):
        """Elimina todos los datos existentes"""
        self.stdout.write("\n🗑️  Limpiando datos de entrenamiento existentes...")
        PoseTrainingData.objects.all().delete()
        self.stdout.write(self.style.SUCCESS("✅ Datos eliminados"))

    def _create_sample(self, ejercicio, tipo, etiqueta, landmarks=None, angulos=None, frames=None):
        """Helper para crear una muestra de entrenamiento"""
        data = {
            "ejercicio": ejercicio,
            "tipo": tipo,
            "etiqueta": etiqueta,
        }

        if tipo == "snapshot":
            data["landmarks"] = landmarks
            data["angulos"] = angulos
        else:
            data["frames"] = frames
            data["duracion_segundos"] = len(frames) / 30 if frames else 0
            data["fps"] = 30
            data["total_frames"] = len(frames) if frames else 0

        sample, created = PoseTrainingData.objects.update_or_create(
            ejercicio=ejercicio,
            tipo=tipo,
            etiqueta=etiqueta,
            landmarks=landmarks if tipo == "snapshot" else None,
            defaults=data,
        )
        return sample, created

    def seed_flexiones(self):
        """Dataset de entrenamiento para flexiones"""
        self.stdout.write("\n💪 Insertando datos de FLEXIONES...")

        # Postura correcta - fase baja
        landmarks_correcto_bajo = [
            {"x": 0.5, "y": 0.2, "z": 0, "visibility": 0.99},  # 0: nariz
            {"x": 0.48, "y": 0.18, "z": 0, "visibility": 0.99},  # 1: ojo izq
            {"x": 0.52, "y": 0.18, "z": 0, "visibility": 0.99},  # 2: ojo der
            {"x": 0.46, "y": 0.19, "z": 0, "visibility": 0.95},  # 3: oreja izq
            {"x": 0.54, "y": 0.19, "z": 0, "visibility": 0.95},  # 4: oreja der
            {"x": 0.45, "y": 0.25, "z": 0, "visibility": 0.95},  # 5: boca izq
            {"x": 0.55, "y": 0.25, "z": 0, "visibility": 0.95},  # 6: boca der
            {"x": 0.35, "y": 0.28, "z": 0, "visibility": 0.99},  # 7: hombro izq
            {"x": 0.65, "y": 0.28, "z": 0, "visibility": 0.99},  # 8: hombro der
            {"x": 0, "y": 0, "z": 0, "visibility": 0},  # 9: placeholder
            {"x": 0, "y": 0, "z": 0, "visibility": 0},  # 10: placeholder
            {"x": 0.32, "y": 0.35, "z": 0, "visibility": 0.99},  # 11: hombro izq (pose)
            {"x": 0.68, "y": 0.35, "z": 0, "visibility": 0.99},  # 12: hombro der (pose)
            {"x": 0.25, "y": 0.25, "z": 0, "visibility": 0.99},  # 13: codo izq
            {"x": 0.75, "y": 0.25, "z": 0, "visibility": 0.99},  # 14: codo der
            {"x": 0.22, "y": 0.35, "z": 0, "visibility": 0.99},  # 15: muñeca izq
            {"x": 0.78, "y": 0.35, "z": 0, "visibility": 0.99},  # 16: muñeca der
            {"x": 0.2, "y": 0.36, "z": 0, "visibility": 0.9},  # 17: meñique izq
            {"x": 0.8, "y": 0.36, "z": 0, "visibility": 0.9},  # 18: meñique der
            {"x": 0.21, "y": 0.37, "z": 0, "visibility": 0.9},  # 19: índice izq
            {"x": 0.79, "y": 0.37, "z": 0, "visibility": 0.9},  # 20: índice der
            {"x": 0.22, "y": 0.38, "z": 0, "visibility": 0.9},  # 21: pulgar izq
            {"x": 0.78, "y": 0.38, "z": 0, "visibility": 0.9},  # 22: pulgar der
            {"x": 0.4, "y": 0.55, "z": 0, "visibility": 0.99},  # 23: cadera izq
            {"x": 0.6, "y": 0.55, "z": 0, "visibility": 0.99},  # 24: cadera der
            {"x": 0.38, "y": 0.75, "z": 0, "visibility": 0.99},  # 25: rodilla izq
            {"x": 0.62, "y": 0.75, "z": 0, "visibility": 0.99},  # 26: rodilla der
            {"x": 0.36, "y": 0.95, "z": 0, "visibility": 0.99},  # 27: tobillo izq
            {"x": 0.64, "y": 0.95, "z": 0, "visibility": 0.99},  # 28: tobillo der
            {"x": 0.35, "y": 0.97, "z": 0, "visibility": 0.9},  # 29: talón izq
            {"x": 0.65, "y": 0.97, "z": 0, "visibility": 0.9},  # 30: talón der
            {"x": 0.34, "y": 0.98, "z": 0, "visibility": 0.9},  # 31: pie izq
            {"x": 0.66, "y": 0.98, "z": 0, "visibility": 0.9},  # 32: pie der
        ]

        angulos_correcto_bajo = {
            "leftElbow": 90,
            "rightElbow": 90,
            "leftShoulder": 75,
            "rightShoulder": 75,
            "leftKnee": 175,
            "rightKnee": 175,
            "torsoAngle": 180,  # Espalda recta
        }

        sample, created = self._create_sample(
            "flexion", "snapshot", "correcto", landmarks=landmarks_correcto_bajo, angulos=angulos_correcto_bajo
        )
        self.stdout.write(
            self.style.SUCCESS(f"  ✓ Flexión correcta (fase baja): {'creada' if created else 'actualizada'}")
        )

        # Postura correcta - fase alta
        angulos_correcto_alto = {
            "leftElbow": 170,
            "rightElbow": 170,
            "leftShoulder": 90,
            "rightShoulder": 90,
            "leftKnee": 175,
            "rightKnee": 175,
            "torsoAngle": 180,
        }

        PoseTrainingData.objects.create(
            ejercicio="flexion",
            tipo="snapshot",
            etiqueta="correcto",
            landmarks=landmarks_correcto_bajo,  # landmarks similares pero diferente posición vertical
            angulos=angulos_correcto_alto,
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Flexión correcta (fase alta): creada"))

        # Postura incorrecta - cadera caída
        angulos_incorrecto_cadera = {
            "leftElbow": 90,
            "rightElbow": 90,
            "leftShoulder": 75,
            "rightShoulder": 75,
            "leftKnee": 175,
            "rightKnee": 175,
            "torsoAngle": 150,  # Cadera caída
        }

        PoseTrainingData.objects.create(
            ejercicio="flexion",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_correcto_bajo,
            angulos=angulos_incorrecto_cadera,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Flexión incorrecta (cadera caída): creada"))

        # Postura incorrecta - codos muy abiertos
        angulos_incorrecto_codos = {
            "leftElbow": 45,
            "rightElbow": 45,
            "leftShoulder": 110,
            "rightShoulder": 110,
            "leftKnee": 175,
            "rightKnee": 175,
            "torsoAngle": 180,
        }

        PoseTrainingData.objects.create(
            ejercicio="flexion",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_correcto_bajo,
            angulos=angulos_incorrecto_codos,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Flexión incorrecta (codos abiertos): creada"))

    def seed_sentadillas(self):
        """Dataset de entrenamiento para sentadillas"""
        self.stdout.write("\n🦵 Insertando datos de SENTADILLAS...")

        # Landmarks base para sentadilla
        landmarks_base = [
            {"x": 0.5, "y": 0.1, "z": 0, "visibility": 0.99},  # nariz
            {"x": 0.48, "y": 0.08, "z": 0, "visibility": 0.99},
            {"x": 0.52, "y": 0.08, "z": 0, "visibility": 0.99},
            {"x": 0.46, "y": 0.09, "z": 0, "visibility": 0.95},
            {"x": 0.54, "y": 0.09, "z": 0, "visibility": 0.95},
            {"x": 0.48, "y": 0.12, "z": 0, "visibility": 0.95},
            {"x": 0.52, "y": 0.12, "z": 0, "visibility": 0.95},
            {"x": 0.35, "y": 0.18, "z": 0, "visibility": 0.99},
            {"x": 0.65, "y": 0.18, "z": 0, "visibility": 0.99},
            {"x": 0, "y": 0, "z": 0, "visibility": 0},
            {"x": 0, "y": 0, "z": 0, "visibility": 0},
            {"x": 0.35, "y": 0.2, "z": 0, "visibility": 0.99},  # hombro izq
            {"x": 0.65, "y": 0.2, "z": 0, "visibility": 0.99},  # hombro der
            {"x": 0.3, "y": 0.28, "z": 0, "visibility": 0.99},  # codo izq
            {"x": 0.7, "y": 0.28, "z": 0, "visibility": 0.99},  # codo der
            {"x": 0.35, "y": 0.35, "z": 0, "visibility": 0.99},  # muñeca izq
            {"x": 0.65, "y": 0.35, "z": 0, "visibility": 0.99},  # muñeca der
            {"x": 0.34, "y": 0.36, "z": 0, "visibility": 0.9},
            {"x": 0.66, "y": 0.36, "z": 0, "visibility": 0.9},
            {"x": 0.35, "y": 0.37, "z": 0, "visibility": 0.9},
            {"x": 0.65, "y": 0.37, "z": 0, "visibility": 0.9},
            {"x": 0.36, "y": 0.38, "z": 0, "visibility": 0.9},
            {"x": 0.64, "y": 0.38, "z": 0, "visibility": 0.9},
            {"x": 0.4, "y": 0.45, "z": 0, "visibility": 0.99},  # cadera izq
            {"x": 0.6, "y": 0.45, "z": 0, "visibility": 0.99},  # cadera der
            {"x": 0.38, "y": 0.65, "z": 0, "visibility": 0.99},  # rodilla izq
            {"x": 0.62, "y": 0.65, "z": 0, "visibility": 0.99},  # rodilla der
            {"x": 0.4, "y": 0.9, "z": 0, "visibility": 0.99},  # tobillo izq
            {"x": 0.6, "y": 0.9, "z": 0, "visibility": 0.99},  # tobillo der
            {"x": 0.39, "y": 0.92, "z": 0, "visibility": 0.9},
            {"x": 0.61, "y": 0.92, "z": 0, "visibility": 0.9},
            {"x": 0.38, "y": 0.95, "z": 0, "visibility": 0.9},
            {"x": 0.62, "y": 0.95, "z": 0, "visibility": 0.9},
        ]

        # Sentadilla correcta - posición baja
        angulos_correcto = {
            "leftKnee": 90,
            "rightKnee": 90,
            "leftHip": 90,
            "rightHip": 90,
            "torsoAngle": 75,  # Ligera inclinación hacia adelante
            "kneeOverToe": False,  # Rodillas no pasan de los pies
        }

        PoseTrainingData.objects.create(
            ejercicio="sentadilla",
            tipo="snapshot",
            etiqueta="correcto",
            landmarks=landmarks_base,
            angulos=angulos_correcto,
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Sentadilla correcta (posición baja): creada"))

        # Sentadilla correcta - posición alta
        angulos_alto = {
            "leftKnee": 170,
            "rightKnee": 170,
            "leftHip": 170,
            "rightHip": 170,
            "torsoAngle": 90,
            "kneeOverToe": False,
        }

        PoseTrainingData.objects.create(
            ejercicio="sentadilla", tipo="snapshot", etiqueta="correcto", landmarks=landmarks_base, angulos=angulos_alto
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Sentadilla correcta (posición alta): creada"))

        # Sentadilla incorrecta - rodillas hacia adentro
        angulos_incorrecto_valgus = {
            "leftKnee": 90,
            "rightKnee": 90,
            "leftHip": 90,
            "rightHip": 90,
            "torsoAngle": 75,
            "kneeValgus": True,  # Rodillas hacia adentro
        }

        PoseTrainingData.objects.create(
            ejercicio="sentadilla",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_base,
            angulos=angulos_incorrecto_valgus,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Sentadilla incorrecta (rodillas valgus): creada"))

        # Sentadilla incorrecta - espalda muy inclinada
        angulos_incorrecto_espalda = {
            "leftKnee": 90,
            "rightKnee": 90,
            "leftHip": 90,
            "rightHip": 90,
            "torsoAngle": 45,  # Muy inclinado
        }

        PoseTrainingData.objects.create(
            ejercicio="sentadilla",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_base,
            angulos=angulos_incorrecto_espalda,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Sentadilla incorrecta (espalda inclinada): creada"))

    def seed_plancha(self):
        """Dataset de entrenamiento para plancha"""
        self.stdout.write("\n🧘 Insertando datos de PLANCHA...")

        landmarks_plancha = [
            {"x": 0.2, "y": 0.3, "z": 0, "visibility": 0.99},  # nariz mirando abajo
            {"x": 0.19, "y": 0.28, "z": 0, "visibility": 0.99},
            {"x": 0.21, "y": 0.28, "z": 0, "visibility": 0.99},
            {"x": 0.18, "y": 0.29, "z": 0, "visibility": 0.95},
            {"x": 0.22, "y": 0.29, "z": 0, "visibility": 0.95},
            {"x": 0.19, "y": 0.31, "z": 0, "visibility": 0.95},
            {"x": 0.21, "y": 0.31, "z": 0, "visibility": 0.95},
            {"x": 0.25, "y": 0.35, "z": 0, "visibility": 0.99},
            {"x": 0.25, "y": 0.35, "z": 0, "visibility": 0.99},
            {"x": 0, "y": 0, "z": 0, "visibility": 0},
            {"x": 0, "y": 0, "z": 0, "visibility": 0},
            {"x": 0.3, "y": 0.4, "z": 0, "visibility": 0.99},  # hombro
            {"x": 0.3, "y": 0.4, "z": 0, "visibility": 0.99},
            {"x": 0.25, "y": 0.5, "z": 0, "visibility": 0.99},  # codo
            {"x": 0.25, "y": 0.5, "z": 0, "visibility": 0.99},
            {"x": 0.2, "y": 0.5, "z": 0, "visibility": 0.99},  # muñeca
            {"x": 0.2, "y": 0.5, "z": 0, "visibility": 0.99},
            {"x": 0.19, "y": 0.51, "z": 0, "visibility": 0.9},
            {"x": 0.19, "y": 0.51, "z": 0, "visibility": 0.9},
            {"x": 0.2, "y": 0.52, "z": 0, "visibility": 0.9},
            {"x": 0.2, "y": 0.52, "z": 0, "visibility": 0.9},
            {"x": 0.21, "y": 0.53, "z": 0, "visibility": 0.9},
            {"x": 0.21, "y": 0.53, "z": 0, "visibility": 0.9},
            {"x": 0.5, "y": 0.4, "z": 0, "visibility": 0.99},  # cadera
            {"x": 0.5, "y": 0.4, "z": 0, "visibility": 0.99},
            {"x": 0.7, "y": 0.4, "z": 0, "visibility": 0.99},  # rodilla
            {"x": 0.7, "y": 0.4, "z": 0, "visibility": 0.99},
            {"x": 0.9, "y": 0.4, "z": 0, "visibility": 0.99},  # tobillo
            {"x": 0.9, "y": 0.4, "z": 0, "visibility": 0.99},
            {"x": 0.91, "y": 0.41, "z": 0, "visibility": 0.9},
            {"x": 0.91, "y": 0.41, "z": 0, "visibility": 0.9},
            {"x": 0.92, "y": 0.42, "z": 0, "visibility": 0.9},
            {"x": 0.92, "y": 0.42, "z": 0, "visibility": 0.9},
        ]

        # Plancha correcta
        angulos_correcto = {
            "bodyLine": 180,  # Cuerpo recto
            "shoulderAlignment": 90,
            "hipAlignment": 180,
            "neckPosition": "neutral",
        }

        PoseTrainingData.objects.create(
            ejercicio="plancha",
            tipo="snapshot",
            etiqueta="correcto",
            landmarks=landmarks_plancha,
            angulos=angulos_correcto,
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Plancha correcta: creada"))

        # Plancha incorrecta - cadera arriba
        angulos_cadera_arriba = {
            "bodyLine": 140,  # Cadera elevada
            "shoulderAlignment": 90,
            "hipAlignment": 140,
        }

        PoseTrainingData.objects.create(
            ejercicio="plancha",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_plancha,
            angulos=angulos_cadera_arriba,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Plancha incorrecta (cadera arriba): creada"))

        # Plancha incorrecta - cadera abajo
        angulos_cadera_abajo = {
            "bodyLine": 200,  # Cadera caída
            "shoulderAlignment": 90,
            "hipAlignment": 200,
        }

        PoseTrainingData.objects.create(
            ejercicio="plancha",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_plancha,
            angulos=angulos_cadera_abajo,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Plancha incorrecta (cadera abajo): creada"))

    def seed_curl_biceps(self):
        """Dataset de entrenamiento para curl de bíceps"""
        self.stdout.write("\n💪 Insertando datos de CURL DE BÍCEPS...")

        landmarks_base = [{"x": 0.5, "y": 0.1 + i * 0.02, "z": 0, "visibility": 0.99} for i in range(33)]

        # Actualizar landmarks importantes
        landmarks_base[11] = {"x": 0.4, "y": 0.25, "z": 0, "visibility": 0.99}  # hombro izq
        landmarks_base[12] = {"x": 0.6, "y": 0.25, "z": 0, "visibility": 0.99}  # hombro der
        landmarks_base[13] = {"x": 0.38, "y": 0.4, "z": 0, "visibility": 0.99}  # codo izq
        landmarks_base[14] = {"x": 0.62, "y": 0.4, "z": 0, "visibility": 0.99}  # codo der
        landmarks_base[15] = {"x": 0.35, "y": 0.3, "z": 0, "visibility": 0.99}  # muñeca izq (arriba)
        landmarks_base[16] = {"x": 0.65, "y": 0.3, "z": 0, "visibility": 0.99}  # muñeca der (arriba)

        # Curl correcto - posición contraída
        angulos_contraido = {
            "leftElbow": 40,
            "rightElbow": 40,
            "shoulderStability": True,
            "wristAlignment": "neutral",
        }

        PoseTrainingData.objects.create(
            ejercicio="curl_biceps",
            tipo="snapshot",
            etiqueta="correcto",
            landmarks=landmarks_base,
            angulos=angulos_contraido,
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Curl bíceps correcto (contraído): creada"))

        # Curl correcto - posición extendida
        angulos_extendido = {
            "leftElbow": 170,
            "rightElbow": 170,
            "shoulderStability": True,
            "wristAlignment": "neutral",
        }

        PoseTrainingData.objects.create(
            ejercicio="curl_biceps",
            tipo="snapshot",
            etiqueta="correcto",
            landmarks=landmarks_base,
            angulos=angulos_extendido,
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Curl bíceps correcto (extendido): creada"))

        # Curl incorrecto - swing de cuerpo
        angulos_swing = {
            "leftElbow": 40,
            "rightElbow": 40,
            "shoulderStability": False,  # Hombros moviéndose
            "bodySwing": True,
        }

        PoseTrainingData.objects.create(
            ejercicio="curl_biceps",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_base,
            angulos=angulos_swing,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Curl bíceps incorrecto (swing): creada"))

    def seed_elevacion_piernas(self):
        """Dataset de entrenamiento para elevación de piernas"""
        self.stdout.write("\n🦵 Insertando datos de ELEVACIÓN DE PIERNAS...")

        landmarks_base = [{"x": 0.5, "y": i * 0.03, "z": 0, "visibility": 0.99} for i in range(33)]

        # Posición acostada con piernas elevadas
        landmarks_base[23] = {"x": 0.5, "y": 0.6, "z": 0, "visibility": 0.99}  # cadera
        landmarks_base[24] = {"x": 0.5, "y": 0.6, "z": 0, "visibility": 0.99}
        landmarks_base[25] = {"x": 0.5, "y": 0.4, "z": 0, "visibility": 0.99}  # rodilla
        landmarks_base[26] = {"x": 0.5, "y": 0.4, "z": 0, "visibility": 0.99}
        landmarks_base[27] = {"x": 0.5, "y": 0.2, "z": 0, "visibility": 0.99}  # tobillo
        landmarks_base[28] = {"x": 0.5, "y": 0.2, "z": 0, "visibility": 0.99}

        # Elevación correcta
        angulos_correcto = {
            "legAngle": 90,  # Piernas a 90 grados
            "kneeExtension": 175,  # Rodillas casi rectas
            "lowerBackFlat": True,
        }

        PoseTrainingData.objects.create(
            ejercicio="elevacion_piernas",
            tipo="snapshot",
            etiqueta="correcto",
            landmarks=landmarks_base,
            angulos=angulos_correcto,
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Elevación piernas correcta: creada"))

        # Elevación incorrecta - espalda arqueada
        angulos_incorrecto = {
            "legAngle": 90,
            "kneeExtension": 175,
            "lowerBackFlat": False,  # Espalda arqueada
            "lowerBackArch": 30,
        }

        PoseTrainingData.objects.create(
            ejercicio="elevacion_piernas",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_base,
            angulos=angulos_incorrecto,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Elevación piernas incorrecta (espalda): creada"))

    def seed_remo(self):
        """Dataset de entrenamiento para remo con mancuernas"""
        self.stdout.write("\n🚣 Insertando datos de REMO...")

        landmarks_base = [{"x": 0.5, "y": i * 0.03, "z": 0, "visibility": 0.99} for i in range(33)]

        # Posición inclinada para remo
        landmarks_base[11] = {"x": 0.35, "y": 0.3, "z": 0, "visibility": 0.99}  # hombro
        landmarks_base[12] = {"x": 0.65, "y": 0.3, "z": 0, "visibility": 0.99}
        landmarks_base[13] = {"x": 0.3, "y": 0.45, "z": 0, "visibility": 0.99}  # codo
        landmarks_base[14] = {"x": 0.7, "y": 0.45, "z": 0, "visibility": 0.99}
        landmarks_base[23] = {"x": 0.5, "y": 0.5, "z": 0, "visibility": 0.99}  # cadera
        landmarks_base[24] = {"x": 0.5, "y": 0.5, "z": 0, "visibility": 0.99}

        # Remo correcto
        angulos_correcto = {
            "torsoAngle": 45,  # Inclinación correcta
            "elbowAngle": 90,  # Codo a 90 en contracción
            "backFlat": True,
            "shoulderRetraction": True,
        }

        PoseTrainingData.objects.create(
            ejercicio="remo", tipo="snapshot", etiqueta="correcto", landmarks=landmarks_base, angulos=angulos_correcto
        )
        self.stdout.write(self.style.SUCCESS("  ✓ Remo correcto: creada"))

        # Remo incorrecto - espalda redondeada
        angulos_incorrecto = {
            "torsoAngle": 45,
            "elbowAngle": 90,
            "backFlat": False,  # Espalda redondeada
            "spineRounding": True,
        }

        PoseTrainingData.objects.create(
            ejercicio="remo",
            tipo="snapshot",
            etiqueta="incorrecto",
            landmarks=landmarks_base,
            angulos=angulos_incorrecto,
        )
        self.stdout.write(self.style.WARNING("  ⚠ Remo incorrecto (espalda): creada"))
