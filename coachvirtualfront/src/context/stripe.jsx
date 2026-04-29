// Contexto o función para iniciar el pago con Stripe
import api from '../api/api';

/**
 * Inicia una sesión de pago con Stripe Checkout
 * @param {string} plan - Tipo de plan a comprar ('basico' o 'premium')
 * @returns {Promise<void>} - Redirige al usuario a Stripe Checkout
 */
export async function iniciarPagoStripe(plan = 'basico') {
	try {
		const response = await api.post('/suscripciones/stripe/checkout/', { plan });

		if (response.data?.url) {
			window.location.href = response.data.url; // Redirige al checkout de Stripe
		} else {
			throw new Error(response.data?.error || 'No se recibió URL de checkout');
		}
	} catch (error) {
		const errorMessage = error.response?.data?.error || error.message || 'Error de conexión con el servidor de pagos';
		console.error('Error Stripe:', errorMessage);
		throw new Error(errorMessage);
	}
}

/**
 * Verifica el estado de una suscripción
 * @param {string} sessionId - ID de la sesión de Stripe
 * @returns {Promise<Object>} - Estado de la suscripción
 */
export async function verificarSuscripcion(sessionId) {
	try {
		const response = await api.get(`/suscripciones/stripe/status/?session_id=${sessionId}`);
		return response.data;
	} catch (error) {
		console.error('Error verificando suscripción:', error);
		throw error;
	}
}

/**
 * Cancela una suscripción activa
 * @returns {Promise<Object>} - Resultado de la cancelación
 */
export async function cancelarSuscripcion() {
	try {
		const response = await api.post('/suscripciones/stripe/cancel/');
		return response.data;
	} catch (error) {
		console.error('Error cancelando suscripción:', error);
		throw error;
	}
}
