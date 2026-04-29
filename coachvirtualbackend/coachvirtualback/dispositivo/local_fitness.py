"""
Sistema de fitness local que simula datos realistas.
No requiere Google Fit ni credenciales externas.

Genera datos basados en:
- Hora del día (más actividad durante el día)
- Patrones realistas de ejercicio
- Datos persistentes por usuario
"""

import random
from datetime import datetime, timedelta
from typing import Dict, Any
from django.core.cache import cache


class LocalFitnessSimulator:
    """Simulador de datos de fitness local."""
    
    CACHE_KEY_PREFIX = "local_fitness_"
    
    def __init__(self, user_id: int = 1):
        self.user_id = user_id
        self.cache_key = f"{self.CACHE_KEY_PREFIX}{user_id}"
    
    def _get_hour_factor(self) -> float:
        """Factor de actividad basado en la hora del día."""
        hour = datetime.now().hour
        # Más actividad entre 6am y 10pm
        if 6 <= hour <= 8:  # Mañana temprano
            return 0.8
        elif 9 <= hour <= 12:  # Media mañana
            return 1.2
        elif 13 <= hour <= 14:  # Almuerzo
            return 0.6
        elif 15 <= hour <= 18:  # Tarde
            return 1.4  # Hora pico de ejercicio
        elif 19 <= hour <= 21:  # Noche
            return 1.0
        else:  # Madrugada/noche
            return 0.2
    
    def _get_day_progress(self) -> float:
        """Progreso del día (0.0 a 1.0)."""
        now = datetime.now()
        start_of_day = datetime(now.year, now.month, now.day, 6, 0)  # Empieza a las 6am
        end_of_day = datetime(now.year, now.month, now.day, 22, 0)  # Termina a las 10pm
        
        if now < start_of_day:
            return 0.0
        elif now > end_of_day:
            return 1.0
        else:
            total_seconds = (end_of_day - start_of_day).total_seconds()
            elapsed = (now - start_of_day).total_seconds()
            return elapsed / total_seconds
    
    def _load_daily_base(self) -> Dict[str, Any]:
        """Carga o genera la base diaria de datos."""
        today = datetime.now().strftime("%Y-%m-%d")
        cache_key = f"{self.cache_key}_{today}"
        
        data = cache.get(cache_key)
        if data:
            return data
        
        # Generar nueva base diaria con metas
        data = {
            "date": today,
            "step_goal": random.randint(8000, 12000),
            "calorie_goal": random.randint(1800, 2500),
            "base_heart_rate": random.randint(60, 75),
            "activity_multiplier": random.uniform(0.8, 1.3),
        }
        
        # Guardar por 24 horas
        cache.set(cache_key, data, 60 * 60 * 24)
        return data
    
    def get_current_stats(self) -> Dict[str, Any]:
        """Obtiene estadísticas actuales simuladas."""
        base = self._load_daily_base()
        progress = self._get_day_progress()
        hour_factor = self._get_hour_factor()
        
        # Calcular pasos acumulados
        # Los pasos aumentan con el progreso del día
        max_steps = int(base["step_goal"] * base["activity_multiplier"])
        current_steps = int(max_steps * progress * random.uniform(0.9, 1.1))
        current_steps = max(0, min(current_steps, max_steps + 2000))
        
        # Calcular calorías (correlacionadas con pasos)
        calories_per_step = random.uniform(0.03, 0.05)
        base_metabolism = 1200 * progress  # Metabolismo basal
        activity_calories = current_steps * calories_per_step
        total_calories = int(base_metabolism + activity_calories)
        
        # Frecuencia cardíaca (varía con actividad reciente)
        base_hr = base["base_heart_rate"]
        activity_hr_boost = int(hour_factor * random.uniform(5, 20))
        current_hr = base_hr + activity_hr_boost
        current_hr = max(55, min(current_hr, 120))  # Límites realistas
        
        # Meta y porcentaje
        step_progress = min(100, int((current_steps / base["step_goal"]) * 100))
        
        return {
            "fecha": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "steps": current_steps,
            "stepGoal": base["step_goal"],
            "stepProgress": step_progress,
            "calories": total_calories,
            "calorieGoal": base["calorie_goal"],
            "heartRate": current_hr,
            "heartRateZone": self._get_hr_zone(current_hr),
            "owner": f"Usuario Local #{self.user_id}",
            "fuente": "Simulador Local",
            "activityLevel": self._get_activity_level(hour_factor),
            "dayProgress": int(progress * 100),
        }
    
    def _get_hr_zone(self, hr: int) -> str:
        """Determina la zona de frecuencia cardíaca."""
        if hr < 60:
            return "reposo"
        elif hr < 80:
            return "ligero"
        elif hr < 100:
            return "moderado"
        elif hr < 120:
            return "intenso"
        else:
            return "máximo"
    
    def _get_activity_level(self, hour_factor: float) -> str:
        """Nivel de actividad basado en el factor horario."""
        if hour_factor < 0.4:
            return "sedentario"
        elif hour_factor < 0.8:
            return "ligero"
        elif hour_factor < 1.2:
            return "activo"
        else:
            return "muy activo"
    
    def record_exercise(self, exercise_type: str, duration_minutes: int) -> Dict[str, Any]:
        """Registra una sesión de ejercicio (bonus de pasos/calorías)."""
        today = datetime.now().strftime("%Y-%m-%d")
        exercise_key = f"{self.cache_key}_exercise_{today}"
        
        exercises = cache.get(exercise_key) or []
        
        # Calcular bonus
        steps_bonus = duration_minutes * random.randint(80, 120)
        calories_bonus = duration_minutes * random.uniform(5, 10)
        
        exercise_record = {
            "type": exercise_type,
            "duration": duration_minutes,
            "steps_bonus": steps_bonus,
            "calories_bonus": int(calories_bonus),
            "timestamp": datetime.now().isoformat(),
        }
        
        exercises.append(exercise_record)
        cache.set(exercise_key, exercises, 60 * 60 * 24)
        
        return exercise_record


# Función helper para usar desde views
def get_local_fitness_stats(user_id: int = 1) -> Dict[str, Any]:
    """Obtiene estadísticas de fitness simuladas para un usuario."""
    simulator = LocalFitnessSimulator(user_id)
    return simulator.get_current_stats()
