"""
Configuración del sistema de suscripciones.
Cambiar ENABLED a True cuando se integre la pasarela de pago.
"""

# Flag principal: activar/desactivar sistema de suscripciones
SUBSCRIPTIONS_ENABLED = False  # Cambiar a True cuando esté la pasarela de pago

# Definición de planes
PLANES = {
    'gratis': {
        'nombre': 'Gratis',
        'precio': 0,
        'minutos_por_dia': 15,
        'ejercicios_gym': 5,
        'ejercicios_fisio': 5,
        'feedback_voz': False,
        'historial_dias': 0,
        'rutinas_guardadas': 0,
        'analisis_angulos': False,
        'comparacion_profesional': False,
        'graficas_progreso': False,
        'alertas_personalizadas': False,
        'con_anuncios': True,
    },
    'basico': {
        'nombre': 'Básico',
        'precio': 25,  # Bolivianos
        'minutos_por_dia': 45,
        'ejercicios_gym': 10,
        'ejercicios_fisio': 10,
        'feedback_voz': True,
        'historial_dias': 7,
        'rutinas_guardadas': 3,
        'analisis_angulos': False,
        'comparacion_profesional': False,
        'graficas_progreso': True,
        'alertas_personalizadas': False,
        'con_anuncios': False,
    },
    'premium': {
        'nombre': 'Premium',
        'precio': 49,  # Bolivianos
        'minutos_por_dia': -1,  # Ilimitado
        'ejercicios_gym': -1,  # Todos
        'ejercicios_fisio': -1,  # Todos
        'feedback_voz': True,
        'historial_dias': -1,  # Ilimitado
        'rutinas_guardadas': -1,  # Ilimitadas
        'analisis_angulos': True,
        'comparacion_profesional': True,
        'graficas_progreso': True,
        'alertas_personalizadas': True,
        'con_anuncios': False,
    }
}


def get_plan_config(plan_nombre):
    """Obtiene la configuración de un plan"""
    return PLANES.get(plan_nombre, PLANES['gratis'])


def usuario_puede_usar_feature(usuario, feature):
    """
    Verifica si un usuario puede usar una característica según su plan.
    
    Args:
        usuario: Instancia del modelo Usuario
        feature: Nombre de la característica (ej: 'feedback_voz', 'analisis_angulos')
    
    Returns:
        bool: True si puede usar la feature, False si no
    """
    if not SUBSCRIPTIONS_ENABLED:
        return True  # Si el sistema no está activo, todo es gratis
    
    plan_config = get_plan_config(usuario.plan_actual)
    return plan_config.get(feature, False)
