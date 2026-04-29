/**
 * RoutineService - Gestión completa de rutinas
 * Usa localStorage como almacenamiento principal para evitar errores 404
 * Soporta: listar, crear, eliminar, actualizar, agregar/quitar ejercicios
 */

const STORAGE_KEY = "cv_rutinas";

const RoutineService = {
  // Obtener todas las rutinas
  list: async () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  // Obtener rutina por ID
  getById: async (id) => {
    const list = await RoutineService.list();
    return list.find(r => String(r.id) === String(id)) || null;
  },

  // Crear nueva rutina
  create: async (payload) => {
    const list = await RoutineService.list();
    const id = Date.now();
    const item = {
      id,
      ...payload,
      created_at: new Date().toISOString(),
      progreso: 0
    };
    list.unshift(item);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return item;
  },

  // Actualizar rutina (nombre, duración, etc.)
  update: async (id, updates) => {
    const list = await RoutineService.list();
    const index = list.findIndex(r => String(r.id) === String(id));
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return list[index];
    }
    return null;
  },

  // Eliminar rutina
  delete: async (id) => {
    const list = await RoutineService.list();
    const filtered = list.filter(r => String(r.id) !== String(id));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },

  // Agregar ejercicio a rutina
  addExercise: async (rutinaId, ejercicio) => {
    const rutina = await RoutineService.getById(rutinaId);
    if (rutina) {
      const ejercicios = rutina.ejercicios || [];
      ejercicios.push({
        id: Date.now(),
        ejercicio_id: ejercicio.id,
        nombre: ejercicio.nombre,
        url: ejercicio.url,
        repeticiones: ejercicio.repeticiones || 12,
        series: ejercicio.series || 3,
        descanso: ejercicio.descanso || 60
      });
      return await RoutineService.update(rutinaId, { ejercicios });
    }
    return null;
  },

  // Quitar ejercicio de rutina
  removeExercise: async (rutinaId, ejercicioId) => {
    const rutina = await RoutineService.getById(rutinaId);
    if (rutina && rutina.ejercicios) {
      const ejercicios = rutina.ejercicios.filter(e =>
        String(e.id) !== String(ejercicioId) &&
        String(e.ejercicio_id) !== String(ejercicioId)
      );
      return await RoutineService.update(rutinaId, { ejercicios });
    }
    return null;
  },

  // Actualizar ejercicio en rutina
  updateExercise: async (rutinaId, ejercicioId, updates) => {
    const rutina = await RoutineService.getById(rutinaId);
    if (rutina && rutina.ejercicios) {
      const ejercicios = rutina.ejercicios.map(e => {
        if (String(e.id) === String(ejercicioId) || String(e.ejercicio_id) === String(ejercicioId)) {
          return { ...e, ...updates };
        }
        return e;
      });
      return await RoutineService.update(rutinaId, { ejercicios });
    }
    return null;
  }
};

export default RoutineService;

