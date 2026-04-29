/**
 * Servicio de API para datos de entrenamiento de poses (IA)
 * Usa el cliente api.js centralizado con autenticación y manejo de tokens
 */
import api from '../api/api';

/**
 * Guarda datos de entrenamiento de poses en el backend
 * @param {Object} data - Datos de la pose
 * @param {string} data.ejercicio - Tipo de ejercicio
 * @param {string} data.tipo - 'snapshot' o 'secuencia'
 * @param {string} data.etiqueta - 'correcto' o 'incorrecto'
 * @param {Array} data.landmarks - Puntos clave detectados (para snapshot)
 * @param {Object} data.angulos - Ángulos calculados (para snapshot)
 * @param {Array} data.frames - Frames de la secuencia (para secuencia)
 * @returns {Promise<Object>} - Respuesta del servidor
 */
export async function savePoseTrainingData(data) {
  try {
    const response = await api.post('/poses/', data);
    return response.data;
  } catch (error) {
    const message = error.response?.data?.message || error.response?.data?.detail || 'Error al guardar datos de entrenamiento';
    throw new Error(message);
  }
}

/**
 * Obtiene todos los datos de entrenamiento
 * @param {Object} filters - Filtros opcionales
 * @param {string} filters.ejercicio - Filtrar por ejercicio
 * @param {string} filters.etiqueta - Filtrar por etiqueta (correcto/incorrecto)
 * @param {string} filters.tipo - Filtrar por tipo (snapshot/secuencia)
 * @returns {Promise<Array>} - Array de datos de entrenamiento
 */
export async function getPoseTrainingData(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const response = await api.get(`/poses/?${params}`);
    return response.data;
  } catch (error) {
    throw new Error('Error al obtener datos de entrenamiento');
  }
}

/**
 * Obtiene un dato de entrenamiento específico por ID
 * @param {number} id - ID del dato de entrenamiento
 * @returns {Promise<Object>} - Dato de entrenamiento
 */
export async function getPoseTrainingDataById(id) {
  try {
    const response = await api.get(`/poses/${id}/`);
    return response.data;
  } catch (error) {
    throw new Error('Error al obtener dato de entrenamiento');
  }
}

/**
 * Elimina un dato de entrenamiento
 * @param {number} id - ID del dato a eliminar
 * @returns {Promise<void>}
 */
export async function deletePoseTrainingData(id) {
  try {
    await api.delete(`/poses/${id}/`);
  } catch (error) {
    throw new Error('Error al eliminar dato de entrenamiento');
  }
}

/**
 * Obtiene estadísticas del dataset de entrenamiento
 * @returns {Promise<Object>} - Estadísticas del dataset
 */
export async function getPoseTrainingStats() {
  try {
    const response = await api.get('/poses/stats/');
    return response.data;
  } catch (error) {
    throw new Error('Error al obtener estadísticas');
  }
}

/**
 * Exporta todos los datos de entrenamiento en formato JSON
 * @returns {Promise<Object>} - Datos exportados
 */
export async function exportPoseTrainingData() {
  try {
    const response = await api.get('/poses/export/');
    return response.data;
  } catch (error) {
    throw new Error('Error al exportar datos');
  }
}

/**
 * Importa datos de entrenamiento desde un archivo JSON
 * @param {Array} data - Array de datos a importar
 * @returns {Promise<Object>} - Resultado de la importación
 */
export async function importPoseTrainingData(data) {
  try {
    const response = await api.post('/poses/import/', { data });
    return response.data;
  } catch (error) {
    throw new Error('Error al importar datos');
  }
}

/**
 * Obtiene los ejercicios únicos disponibles en el dataset
 * @returns {Promise<Array<string>>} - Lista de ejercicios
 */
export async function getAvailableExercises() {
  try {
    const stats = await getPoseTrainingStats();
    return stats.ejercicios || [];
  } catch (error) {
    console.error('Error obteniendo ejercicios:', error);
    return [];
  }
}

/**
 * Valida una pose contra el dataset de entrenamiento
 * @param {Object} poseData - Datos de la pose a validar
 * @param {string} ejercicio - Tipo de ejercicio
 * @returns {Promise<Object>} - Resultado de la validación con score de similitud
 */
export async function validatePose(poseData, ejercicio) {
  try {
    const response = await api.post('/poses/validate/', {
      landmarks: poseData.landmarks,
      angulos: poseData.angulos,
      ejercicio,
    });
    return response.data;
  } catch (error) {
    // Si no hay endpoint de validación, devolver resultado por defecto
    return {
      isCorrect: null,
      confidence: 0,
      message: 'Validación no disponible',
    };
  }
}
