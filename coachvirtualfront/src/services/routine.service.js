import api from "../api/api";

/**
 * Obtiene rutinas del usuario por categoría.
 * Ajusta la URL a tu backend real (ejemplos abajo).
 */
export async function listRoutines(userId, category) {
  // EJEMPLO 1: si tienes endpoint específico del usuario autenticado:
  // const { data } = await api.get(`/rutinas/mias?category=${category}`);

  // EJEMPLO 2: si filtras por user_id:
  // const { data } = await api.get(`/rutinas`, { params: { user_id: userId, category } });

  // --- MOCK temporal si aún no hay backend:
  await new Promise(r => setTimeout(r, 250));
  const mockGym = [
    { id: 1, title: "Full Body A", description: "Fuerza general", daysPerWeek: 3, durationMin: 45 },
    { id: 2, title: "Push/Pull/Legs", description: "Hipertrofia", daysPerWeek: 6, durationMin: 60 },
  ];
  const mockFisio = [
    { id: 11, title: "Hombro - Fase 1", description: "Movilidad y dolor", daysPerWeek: 5, durationMin: 20 },
    { id: 12, title: "Lumbalgia - Core", description: "Estabilidad/Control", daysPerWeek: 4, durationMin: 25 },
  ];
  return category === "gym" ? mockGym : mockFisio;
}
