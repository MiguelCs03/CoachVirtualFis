// util simple para mapear un objeto ejercicio (con nombre) a rutas existentes
export function normalizeName(name = '') {
  return name.toString().toLowerCase()
    .replace(/[áàä]/g, 'a')
    .replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u')
    .replace(/ñ/g, 'n')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .trim();
}

export default function routeForExercise(ejercicio = {}) {
  const nombre = normalizeName(ejercicio.nombre || ejercicio.title || '');

  // Gimnasio - espalda remo
  if (nombre.includes('remo')) {
    if (nombre.includes('maquina') || nombre.includes('maquina')) return { path: '/categoria/gimnasio/espalda/remo-sentado-maquina' };
    if (nombre.includes('mancuern') || nombre.includes('mancuerna')) return { path: '/categoria/gimnasio/espalda/remo-con-mancuernas' };
    if (nombre.includes('polea') && nombre.includes('baja')) return { path: '/categoria/gimnasio/espalda/remo-sentado-polea-baja' };
    if (nombre.includes('unilateral') || nombre.includes('unilater')) return { path: '/categoria/gimnasio/espalda/remo-unilateral-pie-polea' };
    if (nombre.includes('inclinado') || nombre.includes('incline')) return { path: '/categoria/gimnasio/espalda/remo-inclinado-mancuernas' };
  }

  // Gimnasio - brazos
  if (nombre.includes('bicep') || nombre.includes('biceps') || nombre.includes('curl')) return { path: '/categoria/gimnasio/brazos/biceps-curl' };
  if (nombre.includes('flexion') || nombre.includes('flexiones')) return { path: '/categoria/gimnasio/brazos/flexiones' };
  if (nombre.includes('press') && nombre.includes('banca')) return { path: '/categoria/gimnasio/brazos/press-banca' };
  if (nombre.includes('press') && nombre.includes('inclinado')) return { path: '/categoria/gimnasio/brazos/press-inclinado' };

  // Pectorales
  if (nombre.includes('apertur') || nombre.includes('apertura') || nombre.includes('aperturas')) {
    if (nombre.includes('mariposa') || nombre.includes('maquina')) return { path: '/categoria/gimnasio/pectorales/aperturas-mariposa' };
    return { path: '/categoria/gimnasio/pectorales/aperturas-inclinado' };
  }

  // Abdominales
  if (nombre.includes('plancha')) return { path: '/categoria/gimnasio/abdominales/plancha' };
  if (nombre.includes('elev') && nombre.includes('pierna') && nombre.includes('suelo')) return { path: '/categoria/gimnasio/abdominales/elevacion-piernas-suelo' };
  if (nombre.includes('elev') && nombre.includes('pierna') && nombre.includes('banco')) return { path: '/categoria/gimnasio/abdominales/elevacion-piernas-banco' };

  // Fisioterapia - brazos
  if (nombre.includes('aducc') || nombre.includes('aduccion')) return { path: '/categoria/fisioterapia/brazos/aduccion-hombros' };
  if (nombre.includes('rotacion') || nombre.includes('baston') || nombre.includes('baston')) return { path: '/categoria/fisioterapia/brazos/rotacion-antebrazo-baston' };
  if (nombre.includes('curl') && nombre.includes('biceps')) return { path: '/categoria/fisioterapia/brazos/curl-biceps-sentado' };

  // Fisioterapia - espalda
  if (nombre.includes('espalda') || nombre.includes('back')) {
    if (nombre.includes('recta')) return { path: '/categoria/fisioterapia/espalda/espalda-recta' };
    if (nombre.includes('yoga')) return { path: '/categoria/fisioterapia/espalda/estiramiento-yoga' };
  }

  // si no hay match, devolver null para fallback
  return null;
}
