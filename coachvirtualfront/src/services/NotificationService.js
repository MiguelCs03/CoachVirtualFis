/**
 * Servicio de Notificaciones Automáticas
 * Gestiona alertas dinámicas del sistema
 */

import api from '../api/api';

const NotificationService = {
    /**
     * Ejecuta verificaciones de notificaciones
     * Llama al abrir la app o al hacer focus en la ventana
     */
    async checkNotifications() {
        try {
            const response = await api.post('/alertas/check/');
            return response.data;
        } catch (error) {
            console.warn('Error checking notifications:', error);
            return { success: false, alerts_created: 0 };
        }
    },

    /**
     * Notifica que se completó una rutina
     * @param {string} routineName - Nombre de la rutina
     * @param {number} durationMinutes - Duración en minutos
     */
    async notifyRoutineComplete(routineName, durationMinutes) {
        try {
            const response = await api.post('/alertas/routine-complete/', {
                routine_name: routineName,
                duration_minutes: durationMinutes,
            });
            return response.data;
        } catch (error) {
            console.error('Error notifying routine complete:', error);
            return { success: false };
        }
    },

    /**
     * Verifica límite de ejercicio y genera alerta si es necesario
     * @param {number} currentMinutes - Minutos actuales de ejercicio
     * @param {number} limitMinutes - Límite de minutos del plan
     */
    async checkExerciseLimit(currentMinutes, limitMinutes) {
        try {
            const response = await api.post('/alertas/exercise-limit/', {
                current_minutes: currentMinutes,
                limit_minutes: limitMinutes,
            });
            return response.data;
        } catch (error) {
            console.error('Error checking exercise limit:', error);
            return { success: false };
        }
    },

    /**
     * Obtiene estadísticas de notificaciones
     */
    async getStats() {
        try {
            const response = await api.get('/alertas/stats/');
            return response.data;
        } catch (error) {
            console.error('Error getting notification stats:', error);
            return null;
        }
    },

    /**
     * Genera un mensaje motivacional
     */
    async triggerMotivation() {
        try {
            const response = await api.post('/alertas/motivation/');
            return response.data;
        } catch (error) {
            console.error('Error triggering motivation:', error);
            return { success: false };
        }
    },

    /**
     * Marca una alerta como leída
     * @param {number} alertId - ID de la alerta
     */
    async markAsRead(alertId) {
        try {
            const response = await api.post(`/alertas/${alertId}/read/`);
            return response.data;
        } catch (error) {
            console.error('Error marking alert as read:', error);
            return { success: false };
        }
    },

    /**
     * Marca todas las alertas como leídas
     */
    async markAllAsRead() {
        try {
            const response = await api.post('/alertas/mark-all-read/');
            // Disparar evento para que AlertNotifier actualice su estado
            window.dispatchEvent(new CustomEvent('notifications-read'));
            return response.data;
        } catch (error) {
            console.error('Error marking all alerts as read:', error);
            return { success: false };
        }
    },

    /**
     * Inicia el sistema de polling para notificaciones
     * @param {Function} onNewAlert - Callback cuando hay nueva alerta
     * @param {number} intervalMs - Intervalo de polling (default: 30s)
     */
    startPolling(onNewAlert, intervalMs = 30000) {
        let lastCheck = Date.now();

        const check = async () => {
            try {
                const result = await this.checkNotifications();
                if (result.alerts_created > 0 && onNewAlert) {
                    onNewAlert(result);
                }
                lastCheck = Date.now();
            } catch (error) {
                console.warn('Polling error:', error);
            }
        };

        // Verificar al inicio
        check();

        // Verificar periódicamente
        const intervalId = setInterval(check, intervalMs);

        // Verificar cuando la ventana obtiene foco
        const handleFocus = () => {
            const timeSinceLastCheck = Date.now() - lastCheck;
            if (timeSinceLastCheck > intervalMs / 2) {
                check();
            }
        };
        window.addEventListener('focus', handleFocus);

        // Retornar función de limpieza
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    },
};

export default NotificationService;
