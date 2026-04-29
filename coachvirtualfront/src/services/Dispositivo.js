// Servicio del frontend para hablar con el backend de dispositivo (Google Fit)
import api from '../api/api';

/**
 * Obtiene estadísticas de Google Fit del backend.
 * Si Google Fit no está configurado, retorna datos mock/fallback.
 */
export async function getGoogleFitStats() {
  try {
    const { data } = await api.get('/dispositivo/googlefit/');
    return data;
  } catch (error) {
    // Si el backend retorna 400 o 500 (Google Fit no configurado),
    // devolvemos datos de fallback para no bloquear la UI
    console.warn('Google Fit no disponible, usando datos mock:', error.message);
    return {
      fecha: new Date().toISOString(),
      steps: 0,
      calories: 0,
      heartRate: 0,
      owner: 'No conectado',
      fuente: 'Sin conexión',
      error: 'Google Fit no está configurado. Configure las credenciales en el backend.',
    };
  }
}

// Helper para polling periódico
export function startStatsPolling(onData, onError, intervalMs = 30000) {
  let stopped = false;
  let errorCount = 0;
  const maxErrors = 3; // Después de 3 errores, dejar de reintentar tan frecuentemente

  async function tick() {
    if (stopped) return;
    try {
      const data = await getGoogleFitStats();
      errorCount = 0; // Reset error count on success
      onData?.(data);
    } catch (e) {
      errorCount++;
      onError?.(e);

      // Si hay muchos errores, aumentar el intervalo para no saturar
      if (errorCount >= maxErrors) {
        console.warn('Google Fit: Demasiados errores, reduciendo frecuencia de polling');
        setTimeout(tick, intervalMs * 5); // 5x el intervalo normal
        return;
      }
    } finally {
      if (!stopped) setTimeout(tick, intervalMs);
    }
  }

  tick();
  return () => { stopped = true; };
}
