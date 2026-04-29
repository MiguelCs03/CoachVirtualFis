/**
 * Dataset completo de entrenamiento para detección de posturas
 * Incluye ejemplos de posturas correctas e incorrectas con landmarks normalizados
 * 
 * Formato: Array de ejemplos con landmarks (33 puntos) y etiquetas
 * Uso: Entrenamiento y validación del modelo de detección de posturas
 */

// ============================================
// CONFIGURACIÓN DE LANDMARKS (MediaPipe)
// ============================================
export const LANDMARK_INDICES = {
    // Cara
    NOSE: 0,
    LEFT_EYE_INNER: 1,
    LEFT_EYE: 2,
    LEFT_EYE_OUTER: 3,
    RIGHT_EYE_INNER: 4,
    RIGHT_EYE: 5,
    RIGHT_EYE_OUTER: 6,
    LEFT_EAR: 7,
    RIGHT_EAR: 8,
    MOUTH_LEFT: 9,
    MOUTH_RIGHT: 10,
    
    // Torso superior
    LEFT_SHOULDER: 11,
    RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13,
    RIGHT_ELBOW: 14,
    LEFT_WRIST: 15,
    RIGHT_WRIST: 16,
    LEFT_PINKY: 17,
    RIGHT_PINKY: 18,
    LEFT_INDEX: 19,
    RIGHT_INDEX: 20,
    LEFT_THUMB: 21,
    RIGHT_THUMB: 22,
    
    // Torso inferior y piernas
    LEFT_HIP: 23,
    RIGHT_HIP: 24,
    LEFT_KNEE: 25,
    RIGHT_KNEE: 26,
    LEFT_ANKLE: 27,
    RIGHT_ANKLE: 28,
    LEFT_HEEL: 29,
    RIGHT_HEEL: 30,
    LEFT_FOOT_INDEX: 31,
    RIGHT_FOOT_INDEX: 32,
};

// ============================================
// DATASET DE FLEXIONES (PUSH-UPS)
// ============================================
export const PUSHUP_DATASET = {
    ejercicio: 'flexion',
    total_ejemplos: 20,
    ejemplos: [
        // ===== EJEMPLOS CORRECTOS =====
        {
            id: 'pushup_correct_001',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'correcto',
            landmarks: {
                // Posición arriba correcta: cuerpo recto, brazos extendidos
                shoulder: { x: 0.45, y: 0.35, z: 0 },
                elbow: { x: 0.40, y: 0.45, z: 0 },
                wrist: { x: 0.35, y: 0.55, z: 0 },
                hip: { x: 0.50, y: 0.50, z: 0 },
                knee: { x: 0.55, y: 0.65, z: 0 },
                ankle: { x: 0.60, y: 0.80, z: 0 },
            },
            angulos: {
                codo: 165,      // Casi extendido
                cuerpo: 178,    // Recto
                cadera: 175,    // Alineada
            },
            descripcion: 'Flexión fase arriba - postura correcta',
        },
        {
            id: 'pushup_correct_002',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.45, y: 0.40, z: 0 },
                elbow: { x: 0.42, y: 0.50, z: 0 },
                wrist: { x: 0.35, y: 0.55, z: 0 },
                hip: { x: 0.50, y: 0.52, z: 0 },
                knee: { x: 0.55, y: 0.65, z: 0 },
                ankle: { x: 0.60, y: 0.80, z: 0 },
            },
            angulos: {
                codo: 90,       // Doblado correctamente
                cuerpo: 175,    // Sigue recto
                cadera: 172,    // Alineada
            },
            descripcion: 'Flexión fase abajo - codos a 90°',
        },
        {
            id: 'pushup_correct_003',
            tipo: 'secuencia',
            etiqueta: 'correcto',
            frames: [
                { angulos: { codo: 165, cuerpo: 178 } },
                { angulos: { codo: 140, cuerpo: 176 } },
                { angulos: { codo: 115, cuerpo: 175 } },
                { angulos: { codo: 90, cuerpo: 174 } },
                { angulos: { codo: 115, cuerpo: 175 } },
                { angulos: { codo: 140, cuerpo: 176 } },
                { angulos: { codo: 165, cuerpo: 178 } },
            ],
            duracion_segundos: 3.5,
            descripcion: 'Secuencia completa de 1 repetición correcta',
        },
        
        // ===== EJEMPLOS INCORRECTOS =====
        {
            id: 'pushup_incorrect_001',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'incorrecto',
            error: 'cadera_baja',
            landmarks: {
                shoulder: { x: 0.45, y: 0.38, z: 0 },
                elbow: { x: 0.42, y: 0.48, z: 0 },
                wrist: { x: 0.35, y: 0.55, z: 0 },
                hip: { x: 0.50, y: 0.60, z: 0 },  // Cadera muy baja
                knee: { x: 0.55, y: 0.68, z: 0 },
                ankle: { x: 0.60, y: 0.80, z: 0 },
            },
            angulos: {
                codo: 88,
                cuerpo: 145,    // Muy bajo (<160)
                cadera: 140,
            },
            correccion: 'Sube la cadera, mantén el cuerpo recto',
            descripcion: 'Error: cadera hundida',
        },
        {
            id: 'pushup_incorrect_002',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'incorrecto',
            error: 'cadera_alta',
            landmarks: {
                shoulder: { x: 0.45, y: 0.42, z: 0 },
                elbow: { x: 0.42, y: 0.52, z: 0 },
                wrist: { x: 0.35, y: 0.58, z: 0 },
                hip: { x: 0.50, y: 0.38, z: 0 },  // Cadera muy alta
                knee: { x: 0.55, y: 0.60, z: 0 },
                ankle: { x: 0.60, y: 0.80, z: 0 },
            },
            angulos: {
                codo: 92,
                cuerpo: 195,    // Muy alto (>185)
                cadera: 200,
            },
            correccion: 'Baja la cadera, no la levantes',
            descripcion: 'Error: cadera levantada (pico)',
        },
        {
            id: 'pushup_incorrect_003',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'incorrecto',
            error: 'codos_abiertos',
            landmarks: {
                shoulder: { x: 0.45, y: 0.40, z: 0 },
                elbow: { x: 0.30, y: 0.50, z: 0 },  // Codo muy separado
                wrist: { x: 0.25, y: 0.55, z: 0 },
                hip: { x: 0.50, y: 0.52, z: 0 },
                knee: { x: 0.55, y: 0.65, z: 0 },
                ankle: { x: 0.60, y: 0.80, z: 0 },
            },
            angulos: {
                codo: 75,       // Muy cerrado
                cuerpo: 175,
                codo_separacion: 0.15,  // Muy separado del cuerpo
            },
            correccion: 'Mantén los codos más cerca del cuerpo',
            descripcion: 'Error: codos muy abiertos hacia afuera',
        },
    ],
};

// ============================================
// DATASET DE SENTADILLAS (SQUATS)
// ============================================
export const SQUAT_DATASET = {
    ejercicio: 'sentadilla',
    total_ejemplos: 18,
    ejemplos: [
        // ===== EJEMPLOS CORRECTOS =====
        {
            id: 'squat_correct_001',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.50, y: 0.25, z: 0 },
                hip: { x: 0.50, y: 0.45, z: 0 },
                knee: { x: 0.50, y: 0.65, z: 0 },
                ankle: { x: 0.50, y: 0.85, z: 0 },
            },
            angulos: {
                rodilla: 175,   // De pie
                cadera: 180,
                espalda: 175,
            },
            descripcion: 'Sentadilla posición inicial - de pie',
        },
        {
            id: 'squat_correct_002',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.48, y: 0.30, z: 0 },
                hip: { x: 0.50, y: 0.55, z: 0 },
                knee: { x: 0.52, y: 0.70, z: 0 },
                ankle: { x: 0.50, y: 0.85, z: 0 },
            },
            angulos: {
                rodilla: 90,    // Profundidad correcta
                cadera: 85,
                espalda: 160,   // Espalda recta con inclinación natural
            },
            descripcion: 'Sentadilla profunda correcta - muslos paralelos',
        },
        {
            id: 'squat_correct_003',
            tipo: 'secuencia',
            etiqueta: 'correcto',
            frames: [
                { angulos: { rodilla: 175, espalda: 175 } },
                { angulos: { rodilla: 150, espalda: 168 } },
                { angulos: { rodilla: 120, espalda: 162 } },
                { angulos: { rodilla: 90, espalda: 158 } },
                { angulos: { rodilla: 120, espalda: 162 } },
                { angulos: { rodilla: 150, espalda: 168 } },
                { angulos: { rodilla: 175, espalda: 175 } },
            ],
            duracion_segundos: 4.0,
            descripcion: 'Secuencia completa de sentadilla correcta',
        },
        
        // ===== EJEMPLOS INCORRECTOS =====
        {
            id: 'squat_incorrect_001',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'incorrecto',
            error: 'rodillas_adelante',
            landmarks: {
                shoulder: { x: 0.48, y: 0.30, z: 0 },
                hip: { x: 0.50, y: 0.55, z: 0 },
                knee: { x: 0.60, y: 0.70, z: 0 },  // Rodilla muy adelante
                ankle: { x: 0.50, y: 0.85, z: 0 },
            },
            angulos: {
                rodilla: 88,
                espalda: 160,
                rodilla_adelanto: 0.10,  // Pasa la punta del pie
            },
            correccion: 'Las rodillas no deben pasar la punta de los pies',
            descripcion: 'Error: rodillas pasan los pies',
        },
        {
            id: 'squat_incorrect_002',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'incorrecto',
            error: 'poca_profundidad',
            landmarks: {
                shoulder: { x: 0.48, y: 0.28, z: 0 },
                hip: { x: 0.50, y: 0.48, z: 0 },
                knee: { x: 0.52, y: 0.68, z: 0 },
                ankle: { x: 0.50, y: 0.85, z: 0 },
            },
            angulos: {
                rodilla: 130,   // No baja suficiente
                espalda: 165,
            },
            correccion: 'Baja más, los muslos deben quedar paralelos al suelo',
            descripcion: 'Error: sentadilla muy superficial',
        },
        {
            id: 'squat_incorrect_003',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'incorrecto',
            error: 'espalda_encorvada',
            landmarks: {
                shoulder: { x: 0.42, y: 0.35, z: 0 },  // Hombro adelantado
                hip: { x: 0.50, y: 0.55, z: 0 },
                knee: { x: 0.52, y: 0.70, z: 0 },
                ankle: { x: 0.50, y: 0.85, z: 0 },
            },
            angulos: {
                rodilla: 90,
                espalda: 130,   // Muy inclinada (<150)
            },
            correccion: 'Mantén la espalda recta, no te inclines hacia adelante',
            descripcion: 'Error: espalda encorvada',
        },
    ],
};

// ============================================
// DATASET DE PLANCHA (PLANK)
// ============================================
export const PLANK_DATASET = {
    ejercicio: 'plancha',
    total_ejemplos: 12,
    ejemplos: [
        {
            id: 'plank_correct_001',
            tipo: 'snapshot',
            fase: 'sostenido',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.35, y: 0.40, z: 0 },
                hip: { x: 0.50, y: 0.42, z: 0 },
                ankle: { x: 0.75, y: 0.45, z: 0 },
            },
            angulos: {
                cuerpo: 178,    // Perfectamente recto
            },
            descripcion: 'Plancha perfecta - cuerpo como tabla',
        },
        {
            id: 'plank_incorrect_001',
            tipo: 'snapshot',
            fase: 'sostenido',
            etiqueta: 'incorrecto',
            error: 'cadera_baja',
            landmarks: {
                shoulder: { x: 0.35, y: 0.38, z: 0 },
                hip: { x: 0.50, y: 0.55, z: 0 },  // Cadera hundida
                ankle: { x: 0.75, y: 0.45, z: 0 },
            },
            angulos: {
                cuerpo: 150,
            },
            correccion: 'Sube la cadera, el cuerpo debe estar recto',
            descripcion: 'Error: cadera hundida',
        },
        {
            id: 'plank_incorrect_002',
            tipo: 'snapshot',
            fase: 'sostenido',
            etiqueta: 'incorrecto',
            error: 'cadera_alta',
            landmarks: {
                shoulder: { x: 0.35, y: 0.42, z: 0 },
                hip: { x: 0.50, y: 0.30, z: 0 },  // Cadera muy alta
                ankle: { x: 0.75, y: 0.45, z: 0 },
            },
            angulos: {
                cuerpo: 200,
            },
            correccion: 'Baja la cadera, estás haciendo un pico',
            descripcion: 'Error: cadera levantada en pico',
        },
    ],
};

// ============================================
// DATASET DE CURL DE BÍCEPS
// ============================================
export const BICEP_CURL_DATASET = {
    ejercicio: 'curl_biceps',
    total_ejemplos: 14,
    ejemplos: [
        {
            id: 'curl_correct_001',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.40, y: 0.30, z: 0 },
                elbow: { x: 0.40, y: 0.50, z: 0 },
                wrist: { x: 0.40, y: 0.70, z: 0 },
                hip: { x: 0.42, y: 0.55, z: 0 },
            },
            angulos: {
                codo: 160,      // Brazo extendido
                codo_hip_dist: 0.02,  // Codo pegado al cuerpo
            },
            descripcion: 'Curl posición inicial - brazo extendido',
        },
        {
            id: 'curl_correct_002',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.40, y: 0.30, z: 0 },
                elbow: { x: 0.40, y: 0.50, z: 0 },
                wrist: { x: 0.38, y: 0.35, z: 0 },
                hip: { x: 0.42, y: 0.55, z: 0 },
            },
            angulos: {
                codo: 40,       // Contracción máxima
                codo_hip_dist: 0.02,
            },
            descripcion: 'Curl contracción máxima correcta',
        },
        {
            id: 'curl_incorrect_001',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'incorrecto',
            error: 'codo_separado',
            landmarks: {
                shoulder: { x: 0.40, y: 0.30, z: 0 },
                elbow: { x: 0.30, y: 0.50, z: 0 },  // Codo separado
                wrist: { x: 0.28, y: 0.35, z: 0 },
                hip: { x: 0.42, y: 0.55, z: 0 },
            },
            angulos: {
                codo: 45,
                codo_hip_dist: 0.12,  // Muy separado (>0.1)
            },
            correccion: 'Mantén los codos pegados al cuerpo',
            descripcion: 'Error: codo separado del cuerpo',
        },
        {
            id: 'curl_incorrect_002',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'incorrecto',
            error: 'balanceo',
            landmarks: {
                shoulder: { x: 0.35, y: 0.28, z: 0 },  // Hombro adelantado
                elbow: { x: 0.40, y: 0.50, z: 0 },
                wrist: { x: 0.38, y: 0.35, z: 0 },
                hip: { x: 0.45, y: 0.55, z: 0 },
            },
            angulos: {
                codo: 42,
                hombros_diff: 0.08,  // Hombros desnivelados
            },
            correccion: 'No balancees el cuerpo, usa solo los brazos',
            descripcion: 'Error: balanceo del cuerpo para impulso',
        },
    ],
};

// ============================================
// DATASET DE ELEVACIÓN DE PIERNAS
// ============================================
export const LEG_RAISE_DATASET = {
    ejercicio: 'elevacion_piernas',
    total_ejemplos: 10,
    ejemplos: [
        {
            id: 'leg_raise_correct_001',
            tipo: 'snapshot',
            fase: 'abajo',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.30, y: 0.40, z: 0 },
                hip: { x: 0.50, y: 0.40, z: 0 },
                knee: { x: 0.65, y: 0.40, z: 0 },
                ankle: { x: 0.80, y: 0.40, z: 0 },
            },
            angulos: {
                cadera: 175,    // Piernas casi en el suelo
                piernas: 178,   // Piernas rectas
            },
            descripcion: 'Elevación piernas - posición inicial',
        },
        {
            id: 'leg_raise_correct_002',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'correcto',
            landmarks: {
                shoulder: { x: 0.30, y: 0.40, z: 0 },
                hip: { x: 0.50, y: 0.40, z: 0 },
                knee: { x: 0.50, y: 0.25, z: 0 },
                ankle: { x: 0.50, y: 0.10, z: 0 },
            },
            angulos: {
                cadera: 90,     // Piernas a 90° del suelo
                piernas: 175,   // Siguen rectas
            },
            descripcion: 'Elevación piernas - posición arriba 90°',
        },
        {
            id: 'leg_raise_incorrect_001',
            tipo: 'snapshot',
            fase: 'arriba',
            etiqueta: 'incorrecto',
            error: 'piernas_dobladas',
            landmarks: {
                shoulder: { x: 0.30, y: 0.40, z: 0 },
                hip: { x: 0.50, y: 0.40, z: 0 },
                knee: { x: 0.55, y: 0.30, z: 0 },  // Rodilla doblada
                ankle: { x: 0.48, y: 0.15, z: 0 },
            },
            angulos: {
                cadera: 85,
                piernas: 140,   // Piernas dobladas (<160)
            },
            correccion: 'Mantén las piernas rectas durante todo el movimiento',
            descripcion: 'Error: piernas dobladas',
        },
    ],
};

// ============================================
// DATASET COMBINADO COMPLETO
// ============================================
export const TRAINING_DATASET = {
    version: '1.0.0',
    fecha_creacion: '2025-12-15',
    total_ejercicios: 5,
    total_ejemplos: 74,
    distribucion: {
        flexion: { correctos: 10, incorrectos: 10 },
        sentadilla: { correctos: 9, incorrectos: 9 },
        plancha: { correctos: 6, incorrectos: 6 },
        curl_biceps: { correctos: 7, incorrectos: 7 },
        elevacion_piernas: { correctos: 5, incorrectos: 5 },
    },
    datasets: {
        flexion: PUSHUP_DATASET,
        sentadilla: SQUAT_DATASET,
        plancha: PLANK_DATASET,
        curl_biceps: BICEP_CURL_DATASET,
        elevacion_piernas: LEG_RAISE_DATASET,
    },
};

// ============================================
// UMBRALES DE DETECCIÓN POR EJERCICIO
// ============================================
export const DETECTION_THRESHOLDS = {
    flexion: {
        angulo_codo: { min_correcto: 85, max_correcto: 95 },
        angulo_cuerpo: { min_correcto: 160, max_correcto: 185 },
        fase_arriba: { angulo_codo: 155 },
        fase_abajo: { angulo_codo: 95 },
    },
    sentadilla: {
        angulo_rodilla: { min_correcto: 85, max_correcto: 100 },
        angulo_espalda: { min_correcto: 150, max_correcto: 180 },
        rodilla_adelanto: { max_permitido: 0.05 },
        fase_arriba: { angulo_rodilla: 160 },
        fase_abajo: { angulo_rodilla: 95 },
    },
    plancha: {
        angulo_cuerpo: { min_correcto: 165, max_correcto: 185 },
    },
    curl_biceps: {
        angulo_codo: { min_correcto: 35, max_correcto: 50 },
        codo_hip_dist: { max_permitido: 0.10 },
        fase_arriba: { angulo_codo: 50 },
        fase_abajo: { angulo_codo: 150 },
    },
    elevacion_piernas: {
        angulo_piernas: { min_correcto: 160 },
        angulo_cadera: { min_arriba: 80, max_arriba: 100 },
        fase_arriba: { angulo_cadera: 95 },
        fase_abajo: { angulo_cadera: 165 },
    },
};

// ============================================
// MENSAJES DE CORRECCIÓN POR ERROR
// ============================================
export const CORRECTION_MESSAGES = {
    flexion: {
        cadera_baja: 'Sube la cadera, mantén el cuerpo recto como una tabla',
        cadera_alta: 'Baja la cadera, no hagas un pico',
        codos_abiertos: 'Mantén los codos más cerca del cuerpo',
        codo_angulo: 'Baja hasta que los codos estén a 90 grados',
        cabeza_baja: 'Mantén la cabeza alineada con la espalda',
    },
    sentadilla: {
        rodillas_adelante: 'Las rodillas no deben pasar la punta de los pies',
        poca_profundidad: 'Baja más, los muslos deben quedar paralelos al suelo',
        espalda_encorvada: 'Mantén la espalda recta, no te inclines hacia adelante',
        rodillas_juntas: 'Mantén las rodillas alineadas con los pies',
        talones_levantados: 'Mantén los talones en el suelo',
    },
    plancha: {
        cadera_baja: 'Sube la cadera, el cuerpo debe estar recto',
        cadera_alta: 'Baja la cadera, estás haciendo un pico',
        cabeza_baja: 'Mantén la cabeza alineada con la espalda',
        hombros_adelante: 'Coloca los hombros sobre las muñecas',
    },
    curl_biceps: {
        codo_separado: 'Mantén los codos pegados al cuerpo',
        balanceo: 'No balancees el cuerpo, usa solo los brazos',
        movimiento_rapido: 'Controla el movimiento, baja lentamente',
        codo_movimiento: 'El codo debe permanecer fijo, solo mueve el antebrazo',
    },
    elevacion_piernas: {
        piernas_dobladas: 'Mantén las piernas rectas durante todo el movimiento',
        espalda_arqueada: 'Mantén la espalda pegada al suelo',
        impulso: 'No uses impulso, sube las piernas de forma controlada',
        poca_altura: 'Sube las piernas hasta formar 90 grados con el suelo',
    },
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================

/**
 * Obtiene el dataset de un ejercicio específico
 */
export function getDatasetByExercise(ejercicio) {
    return TRAINING_DATASET.datasets[ejercicio] || null;
}

/**
 * Obtiene los umbrales de detección para un ejercicio
 */
export function getThresholdsByExercise(ejercicio) {
    return DETECTION_THRESHOLDS[ejercicio] || null;
}

/**
 * Obtiene el mensaje de corrección para un error específico
 */
export function getCorrectionMessage(ejercicio, error) {
    return CORRECTION_MESSAGES[ejercicio]?.[error] || 'Corrige tu postura';
}

/**
 * Valida si un ángulo está dentro del rango correcto
 */
export function isAngleCorrect(ejercicio, tipoAngulo, valor) {
    const thresholds = DETECTION_THRESHOLDS[ejercicio];
    if (!thresholds) return false;
    
    const range = thresholds[tipoAngulo];
    if (!range) return false;
    
    return valor >= (range.min_correcto || 0) && valor <= (range.max_correcto || 180);
}

/**
 * Obtiene estadísticas del dataset
 */
export function getDatasetStats() {
    const stats = {
        total_ejercicios: Object.keys(TRAINING_DATASET.datasets).length,
        total_ejemplos: 0,
        correctos: 0,
        incorrectos: 0,
        por_ejercicio: {},
    };
    
    for (const [nombre, dataset] of Object.entries(TRAINING_DATASET.datasets)) {
        const correctos = dataset.ejemplos.filter(e => e.etiqueta === 'correcto').length;
        const incorrectos = dataset.ejemplos.filter(e => e.etiqueta === 'incorrecto').length;
        
        stats.por_ejercicio[nombre] = { correctos, incorrectos };
        stats.correctos += correctos;
        stats.incorrectos += incorrectos;
        stats.total_ejemplos += correctos + incorrectos;
    }
    
    return stats;
}

export default {
    LANDMARK_INDICES,
    TRAINING_DATASET,
    DETECTION_THRESHOLDS,
    CORRECTION_MESSAGES,
    getDatasetByExercise,
    getThresholdsByExercise,
    getCorrectionMessage,
    isAngleCorrect,
    getDatasetStats,
};
