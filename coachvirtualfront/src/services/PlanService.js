/**
 * Servicio de API para gestión de planes y suscripciones
 * Usa el cliente api.js centralizado con autenticación automática
 */
import api from '../api/api';

/**
 * Obtiene todos los planes disponibles
 */
export async function getPlanes() {
    try {
        const response = await api.get('/suscripciones/planes/lista/');
        return response.data;
    } catch (error) {
        console.error('Error obteniendo planes:', error);
        throw new Error(error.response?.data?.error || 'Error al obtener planes');
    }
}

/**
 * Obtiene el plan actual del usuario autenticado
 */
export async function getPlanActual() {
    try {
        const response = await api.get('/suscripciones/planes/actual/');
        return response.data;
    } catch (error) {
        console.error('Error obteniendo plan actual:', error);
        throw new Error(error.response?.data?.error || 'Error al obtener plan actual');
    }
}

/**
 * Inicia el proceso de pago con Stripe
 * Redirige al usuario a Stripe Checkout
 * @param {string} planKey - Clave del plan ('basico' o 'premium')
 */
export async function iniciarPagoStripe(planKey) {
    try {
        const response = await api.post('/suscripciones/stripe/checkout/', {
            plan: planKey
        });
        return response.data;
    } catch (error) {
        console.error('Error iniciando pago Stripe:', error);
        throw new Error(error.response?.data?.error || 'Error al iniciar pago');
    }
}

/**
 * Verifica el estado de una sesión de Stripe
 * @param {string} sessionId - ID de la sesión de checkout
 */
export async function verificarSesionStripe(sessionId) {
    try {
        const response = await api.get(`/suscripciones/stripe/status/?session_id=${sessionId}`);
        return response.data;
    } catch (error) {
        console.error('Error verificando sesión Stripe:', error);
        throw new Error(error.response?.data?.error || 'Error al verificar pago');
    }
}

/**
 * Compra/activa un plan internamente (sin Stripe)
 */
export async function comprarPlan(planKey, options = {}) {
    try {
        const response = await api.post('/suscripciones/planes/comprar/', {
            plan: planKey,
            metodo_pago: options.metodoPago || 'manual',
            referencia_pago: options.referenciaPago || '',
            duracion_dias: options.duracionDias || 30
        });
        return response.data;
    } catch (error) {
        console.error('Error comprando plan:', error);
        throw new Error(error.response?.data?.error || 'Error al procesar la compra');
    }
}

/**
 * Confirma el pago de una suscripción y la activa
 */
export async function confirmarPago(historialId, referenciaPago = '') {
    try {
        const response = await api.post('/suscripciones/planes/confirmar-pago/', {
            historial_id: historialId,
            referencia_pago: referenciaPago
        });
        return response.data;
    } catch (error) {
        console.error('Error confirmando pago:', error);
        throw new Error(error.response?.data?.error || 'Error al confirmar pago');
    }
}

/**
 * Obtiene el historial de suscripciones del usuario
 */
export async function getHistorial() {
    try {
        const response = await api.get('/suscripciones/planes/historial/');
        return response.data;
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        throw new Error(error.response?.data?.error || 'Error al obtener historial');
    }
}

/**
 * Cancela el plan activo del usuario
 */
export async function cancelarPlan(inmediato = false) {
    try {
        const response = await api.post('/suscripciones/planes/cancelar/', {
            inmediato
        });
        return response.data;
    } catch (error) {
        console.error('Error cancelando plan:', error);
        throw new Error(error.response?.data?.error || 'Error al cancelar plan');
    }
}

/**
 * Verifica si el usuario tiene permiso para una característica
 */
export async function verificarPermiso(feature) {
    try {
        const response = await api.get(`/suscripciones/planes/verificar/?feature=${feature}`);
        return response.data;
    } catch (error) {
        console.error('Error verificando permiso:', error);
        return { permitido: false, error: true };
    }
}

export default {
    getPlanes,
    getPlanActual,
    iniciarPagoStripe,
    verificarSesionStripe,
    comprarPlan,
    confirmarPago,
    getHistorial,
    cancelarPlan,
    verificarPermiso,
};
