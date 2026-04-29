import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import api from '../api/api';

const SubscriptionContext = createContext();

// Configuración de planes (debe coincidir con el backend)
export const PLANES = {
  gratis: {
    nombre: 'Gratis',
    precio: 0,
    minutos_por_dia: 15,
    ejercicios_gym: 5,
    ejercicios_fisio: 5,
    feedback_voz: false,
    historial_dias: 0,
    rutinas_guardadas: 0,
    analisis_angulos: false,
    comparacion_profesional: false,
    graficas_progreso: false,
    alertas_personalizadas: false,
    con_anuncios: true,
  },
  basico: {
    nombre: 'Básico',
    precio: 25,
    minutos_por_dia: 45,
    ejercicios_gym: 10,
    ejercicios_fisio: 10,
    feedback_voz: true,
    historial_dias: 7,
    rutinas_guardadas: 3,
    analisis_angulos: false,
    comparacion_profesional: false,
    graficas_progreso: true,
    alertas_personalizadas: false,
    con_anuncios: false,
  },
  premium: {
    nombre: 'Premium',
    precio: 49,
    minutos_por_dia: -1,
    ejercicios_gym: -1,
    ejercicios_fisio: -1,
    feedback_voz: true,
    historial_dias: -1,
    rutinas_guardadas: -1,
    analisis_angulos: true,
    comparacion_profesional: true,
    graficas_progreso: true,
    alertas_personalizadas: true,
    con_anuncios: false,
  }
};

export function SubscriptionProvider({ children }) {
  const { user } = useAuth();
  const [planActual, setPlanActual] = useState(null);
  const [subscriptionsEnabled, setSubscriptionsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      cargarPlanActual();
    } else {
      setLoading(false);
    }
  }, [user]);

  const cargarPlanActual = async () => {
    try {
      setError(null);
      const response = await api.get('/suscripciones/planes/actual/');

      if (response.data) {
        setPlanActual(response.data);
        setSubscriptionsEnabled(response.data.subscriptions_enabled || false);
      }
    } catch (err) {
      console.error('Error cargando plan:', err);
      // Si hay error 401/403, no es un error real, solo significa que el usuario no tiene plan
      if (err.response?.status !== 401 && err.response?.status !== 403) {
        setError('No se pudo cargar el plan actual');
      }
      // Por defecto usar plan gratis
      setPlanActual({ plan: 'gratis', configuracion: PLANES.gratis });
    } finally {
      setLoading(false);
    }
  };

  // Verificar si el usuario puede usar una característica
  const puedeUsar = (feature) => {
    // Si el sistema no está activado, todo es gratis
    if (!subscriptionsEnabled) return true;

    if (!planActual) return false;

    const config = planActual.configuracion || PLANES.gratis;
    return config[feature] === true || config[feature] === -1;
  };

  // Obtener configuración del plan actual
  const getPlanConfig = () => {
    if (!planActual) return PLANES.gratis;
    return planActual.configuracion || PLANES.gratis;
  };

  // Obtener nombre del plan actual
  const getPlanNombre = () => {
    if (!planActual?.plan) return 'Gratis';
    return PLANES[planActual.plan]?.nombre || 'Gratis';
  };

  // Refrescar plan después de una compra
  const refrescarPlan = async () => {
    setLoading(true);
    await cargarPlanActual();
  };

  const value = {
    planActual,
    subscriptionsEnabled,
    loading,
    error,
    puedeUsar,
    getPlanConfig,
    getPlanNombre,
    refrescarPlan,
    PLANES,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription debe usarse dentro de SubscriptionProvider');
  }
  return context;
}
