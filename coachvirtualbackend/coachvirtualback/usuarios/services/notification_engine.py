"""
Motor de notificaciones automáticas para Coach Virtual.

Genera alertas automáticas basadas en:
- Recordatorios de pago (plan expirando)
- Finalización de rutinas
- Límites de ejercicio
- Mensajes motivacionales
- Inactividad prolongada
"""

from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Max
from typing import List, Dict, Any, Optional
import random

from ..models import Usuario, Alertas


class NotificationEngine:
    """Motor principal de notificaciones automáticas."""
    
    # Tipos de notificación
    TYPES = {
        'payment': {'icon': '💳', 'priority': 'high', 'color': 'red'},
        'routine_complete': {'icon': '✅', 'priority': 'normal', 'color': 'green'},
        'exercise_limit': {'icon': '⚠️', 'priority': 'high', 'color': 'yellow'},
        'motivation': {'icon': '💪', 'priority': 'low', 'color': 'purple'},
        'inactivity': {'icon': '🔔', 'priority': 'normal', 'color': 'blue'},
        'progress': {'icon': '📊', 'priority': 'low', 'color': 'blue'},
        'achievement': {'icon': '🏆', 'priority': 'normal', 'color': 'gold'},
    }
    
    # Mensajes motivacionales
    MOTIVATIONAL_MESSAGES = [
        "¡Cada repetición te acerca a tu meta! 💪",
        "Tu cuerpo puede lograrlo, solo falta que tu mente lo crea. 🧠",
        "El dolor de hoy es la fuerza de mañana. 🔥",
        "¡Excelente trabajo! Sigue así. ⭐",
        "La constancia es la clave del éxito. 🗝️",
        "¡Hoy es un gran día para entrenar! 🌟",
        "Tu progreso es increíble. ¡Continúa! 📈",
        "Cada paso cuenta, no importa cuán pequeño sea. 👣",
        "¡Eres más fuerte de lo que crees! 💪",
        "El ejercicio es medicina para el cuerpo y el alma. 🏥",
    ]
    
    # Mensajes por logros
    ACHIEVEMENT_MESSAGES = {
        'first_routine': "🎉 ¡Completaste tu primera rutina! ¡Excelente inicio!",
        'week_streak': "🔥 ¡7 días seguidos entrenando! ¡Increíble constancia!",
        'month_streak': "🏆 ¡Un mes completo de entrenamientos! ¡Eres imparable!",
        '10_routines': "⭐ ¡10 rutinas completadas! ¡Sigue así!",
        '50_routines': "🥇 ¡50 rutinas! ¡Eres un verdadero atleta!",
        '100_routines': "👑 ¡100 rutinas! ¡Leyenda del fitness!",
    }
    
    def __init__(self, user: Usuario):
        self.user = user
    
    def _create_alert(self, mensaje: str, tipo: str = 'motivation', 
                      estado: bool = True, **extra) -> Optional[Alertas]:
        """Crea una alerta si no existe una similar reciente."""
        # Evitar duplicados en las últimas 24 horas
        recent = Alertas.objects.filter(
            usuario=self.user,
            mensaje=mensaje,
            created_at__gte=timezone.now() - timedelta(hours=24)
        ).exists()
        
        if recent:
            return None
        
        return Alertas.objects.create(
            usuario=self.user,
            mensaje=mensaje,
            estado=estado,
            fecha=timezone.now(),
            **extra
        )
    
    def check_payment_reminders(self) -> List[Alertas]:
        """Verifica si el plan está por expirar."""
        alerts = []
        
        if not self.user.fecha_expiracion_plan:
            return alerts
        
        now = timezone.now()
        expiration = self.user.fecha_expiracion_plan
        
        # Si ya expiró
        if expiration <= now:
            if self.user.plan_actual and self.user.plan_actual != 'gratis':
                alert = self._create_alert(
                    f"💳 Tu plan {self.user.plan_actual.upper()} ha expirado. ¡Renueva para seguir entrenando sin límites!",
                    tipo='payment'
                )
                if alert:
                    alerts.append(alert)
        else:
            days_left = (expiration - now).days
            
            # Alerta 7 días antes
            if days_left == 7:
                alert = self._create_alert(
                    f"⏰ Tu plan {self.user.plan_actual.upper()} expira en 7 días. ¡Renueva ahora!",
                    tipo='payment'
                )
                if alert:
                    alerts.append(alert)
            
            # Alerta 3 días antes
            elif days_left == 3:
                alert = self._create_alert(
                    f"⚠️ ¡Solo 3 días para que expire tu plan {self.user.plan_actual.upper()}!",
                    tipo='payment'
                )
                if alert:
                    alerts.append(alert)
            
            # Alerta 1 día antes
            elif days_left == 1:
                alert = self._create_alert(
                    f"🔴 ¡Tu plan {self.user.plan_actual.upper()} expira MAÑANA! Renueva para no perder acceso.",
                    tipo='payment'
                )
                if alert:
                    alerts.append(alert)
        
        return alerts
    
    def notify_routine_completion(self, routine_name: str, 
                                  duration_minutes: int) -> Optional[Alertas]:
        """Notifica cuando se completa una rutina."""
        messages = [
            f"✅ ¡Excelente! Completaste '{routine_name}' en {duration_minutes} min.",
            f"🎉 ¡Rutina '{routine_name}' terminada! {duration_minutes} minutos de puro esfuerzo.",
            f"💪 ¡Increíble! '{routine_name}' completada. ¡Sigue así!",
        ]
        
        return self._create_alert(
            random.choice(messages),
            tipo='routine_complete'
        )
    
    def check_exercise_time_limit(self, current_minutes: int, 
                                  limit_minutes: int) -> Optional[Alertas]:
        """Alerta cuando se acerca al límite de tiempo de ejercicio."""
        if limit_minutes <= 0:
            return None  # Sin límite
        
        remaining = limit_minutes - current_minutes
        
        if remaining <= 5 and remaining > 0:
            return self._create_alert(
                f"⚠️ ¡Solo te quedan {remaining} minutos de tu límite diario!",
                tipo='exercise_limit'
            )
        elif remaining <= 0:
            return self._create_alert(
                f"🛑 Has alcanzado tu límite diario de {limit_minutes} minutos. ¡Descansa y vuelve mañana!",
                tipo='exercise_limit'
            )
        
        return None
    
    def generate_daily_motivation(self) -> Optional[Alertas]:
        """Genera un mensaje motivacional diario."""
        # Solo una vez al día
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        already_sent = Alertas.objects.filter(
            usuario=self.user,
            created_at__gte=today_start,
            mensaje__contains='💪'
        ).exists()
        
        if already_sent:
            return None
        
        # Solo enviar si es horario razonable (8am - 10pm)
        hour = timezone.now().hour
        if hour < 8 or hour > 22:
            return None
        
        message = random.choice(self.MOTIVATIONAL_MESSAGES)
        return self._create_alert(message, tipo='motivation')
    
    def check_inactivity(self, days_inactive: int = 3) -> Optional[Alertas]:
        """Alerta si no ha habido actividad en X días."""
        # Verificar última actividad (última alerta de rutina completada)
        last_activity = Alertas.objects.filter(
            usuario=self.user,
            mensaje__contains='Completaste'
        ).order_by('-created_at').first()
        
        if last_activity:
            days_since = (timezone.now() - last_activity.created_at).days
            
            if days_since >= days_inactive:
                messages = [
                    f"🔔 ¡Te extrañamos! Han pasado {days_since} días desde tu último entrenamiento.",
                    f"💪 ¿Listo para volver? Han pasado {days_since} días sin entrenar.",
                    f"🏋️ ¡Vuelve al gimnasio! Tu cuerpo te lo agradecerá.",
                ]
                return self._create_alert(
                    random.choice(messages),
                    tipo='inactivity'
                )
        
        return None
    
    def check_progress_milestone(self, total_routines: int) -> Optional[Alertas]:
        """Verifica si se alcanzó un hito de progreso."""
        milestones = {
            1: 'first_routine',
            10: '10_routines',
            50: '50_routines',
            100: '100_routines',
        }
        
        if total_routines in milestones:
            key = milestones[total_routines]
            message = self.ACHIEVEMENT_MESSAGES.get(key, f"🎉 ¡{total_routines} rutinas completadas!")
            return self._create_alert(message, tipo='achievement')
        
        return None
    
    def run_all_checks(self) -> Dict[str, Any]:
        """Ejecuta todas las verificaciones de notificaciones."""
        results = {
            'user': self.user.email,
            'timestamp': timezone.now().isoformat(),
            'alerts_created': [],
        }
        
        # 1. Recordatorios de pago
        payment_alerts = self.check_payment_reminders()
        results['alerts_created'].extend([a.mensaje for a in payment_alerts])
        
        # 2. Motivación diaria
        motivation = self.generate_daily_motivation()
        if motivation:
            results['alerts_created'].append(motivation.mensaje)
        
        # 3. Inactividad
        inactivity = self.check_inactivity()
        if inactivity:
            results['alerts_created'].append(inactivity.mensaje)
        
        results['total'] = len(results['alerts_created'])
        return results


def run_notifications_for_all_users() -> Dict[str, Any]:
    """Ejecuta el motor de notificaciones para todos los usuarios activos."""
    users = Usuario.objects.filter(is_active=True)
    results = {
        'timestamp': timezone.now().isoformat(),
        'users_processed': 0,
        'total_alerts': 0,
        'details': [],
    }
    
    for user in users:
        engine = NotificationEngine(user)
        user_result = engine.run_all_checks()
        results['users_processed'] += 1
        results['total_alerts'] += user_result['total']
        if user_result['total'] > 0:
            results['details'].append(user_result)
    
    return results
