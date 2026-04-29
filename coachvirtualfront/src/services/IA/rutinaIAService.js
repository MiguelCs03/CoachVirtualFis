import { fetchGroqCompletion } from './groqClient';
import api from '../../api/api';
import { EJERCICIOS as ejerciciosDataset } from './ejerciciosDataset';

/**
 * Servicio para generar rutinas con IA usando Groq
 * Incluye fallback robusto cuando la API falla
 */

/**
 * Obtiene todos los ejercicios disponibles del backend
 * Con fallback al dataset local
 */
export async function obtenerEjerciciosDisponibles() {
    try {
        const response = await api.get('/ejercicios-disponibles/');
        return response.data;
    } catch (error) {
        console.warn('Error obteniendo ejercicios del backend, usando dataset local:', error);
        // Usar dataset local como fallback
        return {
            todos: ejerciciosDataset.map(ej => ({
                id: ej.id,
                nombre: ej.nombre,
                musculo: ej.musculos?.join(', ') || 'General',
                url: ej.url || '',
                categoria: ej.categoria || 'Gimnasio'
            }))
        };
    }
}

/**
 * Construye el prompt para Groq basado en las respuestas del usuario
 */
function construirPrompt(respuestas, ejercicios) {
    const { objetivo, nivel, diasSemana, duracion, areas, limitaciones } = respuestas;

    // Filtrar ejercicios por áreas seleccionadas
    const ejerciciosFiltrados = ejercicios.todos.filter(ej => {
        if (areas.length === 0) return true;
        return areas.some(area =>
            ej.musculo.toLowerCase().includes(area.toLowerCase())
        );
    });

    // Limitar a 30 ejercicios para no sobrecargar el prompt
    const ejerciciosLimitados = ejerciciosFiltrados.slice(0, 30);

    // Crear lista simplificada de ejercicios para el prompt
    const ejerciciosTexto = ejerciciosLimitados.map(ej =>
        `- ${ej.nombre} (ID: ${ej.id}, Músculo: ${ej.musculo}, URL: ${ej.url || ''})`
    ).join('\n');

    const prompt = `Eres un entrenador personal experto certificado. Genera una rutina de entrenamiento personalizada en formato JSON.

DATOS DEL USUARIO:
- Objetivo principal: ${objetivo}
- Nivel de experiencia: ${nivel}
- Días disponibles por semana: ${diasSemana}
- Duración por sesión: ${duracion} minutos
- Áreas a enfocar: ${areas.length > 0 ? areas.join(', ') : 'Cuerpo completo'}
${limitaciones ? `- Limitaciones/Lesiones: ${limitaciones}` : ''}

EJERCICIOS DISPONIBLES (USA SOLO ESTOS):
${ejerciciosTexto}

INSTRUCCIONES IMPORTANTES:
1. Crea EXACTAMENTE ${diasSemana} días de entrenamiento
2. Cada día debe tener un nombre descriptivo (ej: "Día 1: Pecho y Tríceps", "Día 2: Piernas")
3. La duración total de cada sesión debe ser aproximadamente ${duracion} minutos
4. SOLO usa ejercicios de la lista proporcionada arriba (copia exactamente el ID, nombre y URL)
5. IMPORTANTE: Debes incluir el campo "url" para cada ejercicio, copiándolo de la lista
6. Asigna series y repeticiones apropiadas según el nivel y objetivo
7. Distribuye los grupos musculares equilibradamente
8. Si hay limitaciones, evita ejercicios que puedan agravar la lesión
9. Para principiantes: 2-3 series de 10-15 reps
10. Para intermedios: 3-4 series de 8-12 reps
11. Para avanzados: 4-5 series de 6-10 reps

IMPORTANTE: Responde SOLO con el JSON, sin texto adicional.

FORMATO DE RESPUESTA (JSON):
{
  "nombre": "Nombre descriptivo de la rutina",
  "descripcion": "Breve descripción de la rutina (1-2 frases)",
  "duracion": ${duracion},
  "categoria": "Gimnasio o Fisioterapia",
  "diasSemana": ${diasSemana},
  "dias": [
    {
      "numero": 1,
      "nombre": "Día 1: Nombre descriptivo",
      "ejercicios": [
        {
          "id": 1,
          "nombre": "Nombre del ejercicio",
          "url": "URL del ejercicio del backend",
          "series": 4,
          "repeticiones": "8-12",
          "descanso": "60-90 seg"
        }
      ]
    }
  ]
}`;

    return prompt;
}

/**
 * Genera una rutina usando Groq AI
 * Con manejo robusto de errores y fallback
 */
export async function generarRutinaConIA(respuestas) {
    try {
        // 1. Obtener ejercicios disponibles (con fallback)
        const ejerciciosData = await obtenerEjerciciosDisponibles();

        // Verificar que tenemos ejercicios
        if (!ejerciciosData.todos || ejerciciosData.todos.length === 0) {
            console.warn('No hay ejercicios disponibles, usando fallback');
            return {
                success: true,
                rutina: generarRutinaFallback(respuestas),
                usedFallback: true
            };
        }

        // 2. Construir prompt
        const prompt = construirPrompt(respuestas, ejerciciosData);

        // 3. Llamar a Groq con timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: La IA tardó demasiado')), 30000)
        );

        const respuestaIA = await Promise.race([
            fetchGroqCompletion({
                prompt,
                model: 'llama-3.1-8b-instant'
            }),
            timeoutPromise
        ]);

        // 4. Parsear JSON con limpieza robusta
        let jsonLimpio = respuestaIA.trim();
        
        // Buscar JSON en la respuesta
        const jsonMatch = jsonLimpio.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonLimpio = jsonMatch[0];
        }
        
        // Limpiar marcadores de código
        jsonLimpio = jsonLimpio
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^\s*json\s*/i, '');

        let rutina;
        try {
            rutina = JSON.parse(jsonLimpio);
        } catch (parseError) {
            console.error('Error parseando JSON de IA:', parseError);
            console.log('Respuesta recibida:', jsonLimpio.substring(0, 500));
            return {
                success: true,
                rutina: generarRutinaFallback(respuestas, ejerciciosData),
                usedFallback: true,
                error: 'Error parseando respuesta de IA'
            };
        }

        // 5. Validar estructura
        if (!rutina.dias || rutina.dias.length === 0) {
            console.warn('Rutina sin días, usando fallback');
            return {
                success: true,
                rutina: generarRutinaFallback(respuestas, ejerciciosData),
                usedFallback: true
            };
        }

        // 6. Enriquecer con URLs del dataset si faltan
        rutina.dias = rutina.dias.map(dia => ({
            ...dia,
            ejercicios: dia.ejercicios.map(ej => {
                const ejercicioOriginal = ejerciciosData.todos.find(e => e.id === ej.id);
                return {
                    ...ej,
                    url: ej.url || ejercicioOriginal?.url || '',
                    descanso: ej.descanso || 60
                };
            })
        }));

        return {
            success: true,
            rutina,
            prompt
        };

    } catch (error) {
        console.error('Error al generar rutina:', error);
        return {
            success: true,
            rutina: generarRutinaFallback(respuestas),
            usedFallback: true,
            error: error.message
        };
    }
}

/**
 * Rutina de fallback completa cuando la IA falla
 * Genera una rutina real con ejercicios del dataset
 */
function generarRutinaFallback(respuestas, ejerciciosData = null) {
    const { objetivo, nivel, diasSemana, duracion, areas } = respuestas;

    // Obtener ejercicios del dataset local si no hay datos
    let ejerciciosDisponibles = ejerciciosData?.todos || ejerciciosDataset.map(ej => ({
        id: ej.id,
        nombre: ej.nombre,
        musculo: ej.musculo || 'General',  // Campo correcto del dataset
        url: ej.url || '',
        categoria: ej.tipo || 'Gimnasio'   // Campo correcto del dataset
    }));

    // Configuración según nivel
    const configNivel = {
        'Principiante': { series: 3, reps: '12-15', descanso: 60 },
        'Intermedio': { series: 4, reps: '10-12', descanso: 45 },
        'Avanzado': { series: 4, reps: '8-10', descanso: 30 }
    }[nivel] || { series: 3, reps: '12', descanso: 60 };

    // Distribuir grupos musculares por día
    const distribucionDias = {
        3: [
            { nombre: 'Día 1: Tren Superior', musculos: ['pecho', 'espalda', 'hombro', 'brazo', 'bíceps', 'tríceps'] },
            { nombre: 'Día 2: Piernas', musculos: ['pierna', 'cuádriceps', 'glúteo', 'pantorrilla'] },
            { nombre: 'Día 3: Core y Cardio', musculos: ['abdomen', 'core', 'espalda baja'] }
        ],
        4: [
            { nombre: 'Día 1: Pecho y Tríceps', musculos: ['pecho', 'tríceps'] },
            { nombre: 'Día 2: Espalda y Bíceps', musculos: ['espalda', 'bíceps', 'dorsal'] },
            { nombre: 'Día 3: Piernas', musculos: ['pierna', 'cuádriceps', 'glúteo', 'pantorrilla'] },
            { nombre: 'Día 4: Hombros y Core', musculos: ['hombro', 'abdomen', 'core', 'deltoides'] }
        ],
        5: [
            { nombre: 'Día 1: Pecho', musculos: ['pecho'] },
            { nombre: 'Día 2: Espalda', musculos: ['espalda', 'dorsal'] },
            { nombre: 'Día 3: Piernas', musculos: ['pierna', 'cuádriceps', 'glúteo'] },
            { nombre: 'Día 4: Hombros', musculos: ['hombro', 'deltoides', 'trapecio'] },
            { nombre: 'Día 5: Brazos y Core', musculos: ['bíceps', 'tríceps', 'abdomen', 'brazo'] }
        ],
        6: [
            { nombre: 'Día 1: Pecho', musculos: ['pecho'] },
            { nombre: 'Día 2: Espalda', musculos: ['espalda', 'dorsal'] },
            { nombre: 'Día 3: Piernas Anterior', musculos: ['cuádriceps', 'pierna'] },
            { nombre: 'Día 4: Hombros', musculos: ['hombro', 'deltoides'] },
            { nombre: 'Día 5: Brazos', musculos: ['bíceps', 'tríceps', 'brazo'] },
            { nombre: 'Día 6: Piernas Posterior y Core', musculos: ['glúteo', 'pantorrilla', 'abdomen'] }
        ]
    };

    const dias = (distribucionDias[diasSemana] || distribucionDias[4]).map((dia, idx) => {
        // Filtrar ejercicios para este día
        const ejerciciosDia = ejerciciosDisponibles.filter(ej => {
            const musculoLower = (ej.musculo || '').toLowerCase();
            return dia.musculos.some(m => musculoLower.includes(m.toLowerCase()));
        });

        // Seleccionar 4-6 ejercicios aleatorios
        const ejerciciosSeleccionados = ejerciciosDia
            .sort(() => Math.random() - 0.5)
            .slice(0, Math.min(6, Math.max(4, ejerciciosDia.length)));

        // Si no hay suficientes, agregar ejercicios generales
        if (ejerciciosSeleccionados.length < 4) {
            const generales = ejerciciosDisponibles
                .filter(e => !ejerciciosSeleccionados.includes(e))
                .sort(() => Math.random() - 0.5)
                .slice(0, 4 - ejerciciosSeleccionados.length);
            ejerciciosSeleccionados.push(...generales);
        }

        return {
            numero: idx + 1,
            nombre: dia.nombre,
            ejercicios: ejerciciosSeleccionados.map(ej => ({
                id: ej.id,
                nombre: ej.nombre,
                url: ej.url || '',
                series: configNivel.series,
                repeticiones: configNivel.reps,
                descanso: configNivel.descanso
            }))
        };
    });

    // Crear nombre según objetivo
    const nombresObjetivo = {
        'Ganar músculo': 'Rutina de Hipertrofia',
        'Perder peso': 'Rutina de Definición',
        'Fisioterapia': 'Rutina de Rehabilitación',
        'Flexibilidad': 'Rutina de Movilidad',
        'Fuerza': 'Rutina de Fuerza',
        'Resistencia': 'Rutina de Resistencia'
    };

    return {
        nombre: nombresObjetivo[objetivo] || `Rutina ${diasSemana} días`,
        descripcion: `Rutina personalizada de ${diasSemana} días para ${(objetivo || 'fitness general').toLowerCase()}. Nivel: ${nivel || 'Intermedio'}`,
        duracion: parseInt(duracion) || 45,
        categoria: objetivo === 'Fisioterapia' ? 'Fisioterapia' : 'Gimnasio',
        diasSemana: parseInt(diasSemana) || 4,
        dias
    };
}

/**
 * Guarda la rutina generada usando el mismo formato que la creación manual
 * Usa la instancia centralizada de api.js
 */
export async function guardarRutinaGenerada(rutina) {
    // Convertir al formato que usa RoutineService.create()
    const datosRutina = rutina.dias.flatMap(dia =>
        dia.ejercicios.map(ej => ({
            id: ej.id,
            nombre: ej.nombre,
            url: ej.url || '',
            series: ej.series,
            repeticiones: ej.repeticiones,
            descanso: ej.descanso
        }))
    );

    const payload = {
        nombre: rutina.nombre,
        duracion_minutos: rutina.duracion || 45,
        categoria: (rutina.categoria || 'Gimnasio').toLowerCase(),
        parte_cuerpo: rutina.descripcion || 'Cuerpo completo',
        datos_rutina: datosRutina
    };

    try {
        const response = await api.post('/rutinas/', payload);
        return response.data;
    } catch (error) {
        // Si falla, guardar en localStorage como fallback
        console.error('Error guardando rutina en backend:', error);
        const raw = localStorage.getItem('cv_rutinas');
        const list = raw ? JSON.parse(raw) : [];
        const id = Date.now();
        const item = { id, ...payload };
        list.unshift(item);
        localStorage.setItem('cv_rutinas', JSON.stringify(list));
        return item;
    }
}
