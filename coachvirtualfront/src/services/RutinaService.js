/**
 * rutinaService - Gestión completa de rutinas con persistencia en Base de Datos.
 * Conecta al backend a través de la instancia de API configurada.
 */

import api from '../api/api'

const BASE_URL = '/rutinas/'

const rutinaService = {
  // Obtener todas las rutinas del usuario autenticado
  list: async () => {
    const { data } = await api.get(BASE_URL)
    return data
  },

  // Obtener rutina por ID
  getById: async (id) => {
    const { data } = await api.get(`${BASE_URL}${id}/`)
    return data
  },

  // Crear nueva rutina
  create: async (payload) => {
    const { data } = await api.post(BASE_URL, payload)
    return data
  },

  // Actualizar rutina (nombre, duración, etc.)
  update: async (id, updates) => {
    const { data } = await api.put(`${BASE_URL}${id}/`, updates)
    return data
  },

  // Eliminar rutina
  delete: async (id) => {
    await api.delete(`${BASE_URL}${id}/`)
    return true
  },

  // Agregar ejercicio a rutina
  addExercise: async (rutinaId, ejercicio) => {
    const rutina = await rutinaService.getById(rutinaId)
    if (rutina) {
      const ejercicios = rutina.datos_rutina || []
      ejercicios.push({
        id: Date.now(),
        ejercicio_id: ejercicio.id,
        nombre: ejercicio.nombre,
        url: ejercicio.url,
        repeticiones: ejercicio.repeticiones || 12,
        series: ejercicio.series || 3,
        descanso: ejercicio.descanso || 60,
      })
      return await rutinaService.update(rutinaId, { datos_rutina: ejercicios })
    }
    return null
  },

  // Quitar ejercicio de rutina
  removeExercise: async (rutinaId, ejercicioId) => {
    const rutina = await rutinaService.getById(rutinaId)
    if (rutina && rutina.datos_rutina) {
      const ejercicios = rutina.datos_rutina.filter(
        (e) =>
          String(e.id) !== String(ejercicioId) && String(e.ejercicio_id) !== String(ejercicioId)
      )
      return await rutinaService.update(rutinaId, { datos_rutina: ejercicios })
    }
    return null
  },

  // Actualizar ejercicio en rutina
  updateExercise: async (rutinaId, ejercicioId, updates) => {
    const rutina = await rutinaService.getById(rutinaId)
    if (rutina && rutina.datos_rutina) {
      const ejercicios = rutina.datos_rutina.map((e) => {
        if (
          String(e.id) === String(ejercicioId) ||
          String(e.ejercicio_id) === String(ejercicioId)
        ) {
          return { ...e, ...updates }
        }
        return e
      })
      return await rutinaService.update(rutinaId, { datos_rutina: ejercicios })
    }
    return null
  },
}

export default rutinaService
