/**
 * Configuración de detección de postura y correcciones de voz para todos los ejercicios
 * Cada ejercicio tiene landmarks específicos, ángulos a verificar y mensajes de corrección
 * 
 * Landmarks de MediaPipe (índices):
 * 0: nariz, 11-12: hombros, 13-14: codos, 15-16: muñecas
 * 23-24: caderas, 25-26: rodillas, 27-28: tobillos
 */

// Índices de landmarks de MediaPipe
const LANDMARKS = {
    NOSE: 0,
    LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
    LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
    LEFT_WRIST: 15, RIGHT_WRIST: 16,
    LEFT_HIP: 23, RIGHT_HIP: 24,
    LEFT_KNEE: 25, RIGHT_KNEE: 26,
    LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
};

// Función para calcular ángulo entre 3 puntos
export function calculateAngle(a, b, c) {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs((radians * 180) / Math.PI);
    if (angle > 180) angle = 360 - angle;
    return angle;
}

// Función para calcular distancia entre 2 puntos
export function calculateDistance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
}

// Configuración de pose para cada tipo de ejercicio
export const POSE_CONFIGS = {
    // ===== EJERCICIOS DE PIE CON BRAZOS =====
    arms_standing: {
        checkPose: (landmarks) => {
            const corrections = [];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const elbow = landmarks[LANDMARKS.LEFT_ELBOW];
            const wrist = landmarks[LANDMARKS.LEFT_WRIST];
            const hip = landmarks[LANDMARKS.LEFT_HIP];

            // Verificar que esté de pie
            if (hip.y < shoulder.y * 0.7) {
                corrections.push({ type: 'posture', message: 'Mantente de pie con la espalda recta' });
            }

            // Verificar alineación de hombros
            const shoulderDiff = Math.abs(landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y);
            if (shoulderDiff > 0.05) {
                corrections.push({ type: 'alignment', message: 'Mantén los hombros nivelados' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Posición inicial: de pie con brazos a los lados',
            correct: 'Excelente postura, continúa así',
            posture: 'Mantente de pie con la espalda recta',
            alignment: 'Mantén los hombros nivelados',
        }
    },

    // ===== FLEXIONES =====
    pushup: {
        checkPose: (landmarks) => {
            const corrections = [];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const hip = landmarks[LANDMARKS.LEFT_HIP];
            const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
            const elbow = landmarks[LANDMARKS.LEFT_ELBOW];

            // Verificar alineación cuerpo (plancha)
            const bodyAngle = calculateAngle(shoulder, hip, ankle);
            if (bodyAngle < 160) {
                corrections.push({ type: 'hip', message: 'Mantén la cadera alineada, no la bajes' });
            }
            if (bodyAngle > 190) {
                corrections.push({ type: 'hip', message: 'No levantes la cadera, mantén el cuerpo recto' });
            }

            // Verificar ángulo de codos
            const elbowAngle = calculateAngle(shoulder, elbow, landmarks[LANDMARKS.LEFT_WRIST]);
            if (elbowAngle < 80 || elbowAngle > 100) {
                corrections.push({ type: 'elbow', message: 'Los codos deben estar a 90 grados en la bajada' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Posición de plancha, manos debajo de los hombros',
            correct: 'Perfecto, mantén esa línea recta',
            hip: 'Mantén la cadera alineada con el cuerpo',
            elbow: 'Baja hasta que los codos formen 90 grados',
        }
    },

    // ===== PLANCHA =====
    plank: {
        checkPose: (landmarks) => {
            const corrections = [];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const hip = landmarks[LANDMARKS.LEFT_HIP];
            const ankle = landmarks[LANDMARKS.LEFT_ANKLE];

            const bodyAngle = calculateAngle(shoulder, hip, ankle);
            if (bodyAngle < 165) {
                corrections.push({ type: 'hip_low', message: 'La cadera está muy baja, súbela' });
            }
            if (bodyAngle > 185) {
                corrections.push({ type: 'hip_high', message: 'La cadera está muy alta, bájala' });
            }

            // Verificar cabeza alineada
            const nose = landmarks[LANDMARKS.NOSE];
            if (nose.y < shoulder.y - 0.1) {
                corrections.push({ type: 'head', message: 'Mantén la cabeza alineada, no la levantes' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Posición de plancha, mantén el cuerpo recto',
            correct: 'Excelente, mantén esa posición',
            hip_low: 'Sube un poco la cadera',
            hip_high: 'Baja un poco la cadera',
            head: 'Mantén la cabeza alineada con la espalda',
        }
    },

    // ===== SENTADILLAS =====
    squat: {
        checkPose: (landmarks) => {
            const corrections = [];
            const hip = landmarks[LANDMARKS.LEFT_HIP];
            const knee = landmarks[LANDMARKS.LEFT_KNEE];
            const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];

            // Ángulo de rodilla
            const kneeAngle = calculateAngle(hip, knee, ankle);

            // Verificar que las rodillas no pasen de los pies
            if (knee.x < ankle.x - 0.1) {
                corrections.push({ type: 'knee', message: 'Las rodillas no deben pasar la punta de los pies' });
            }

            // Verificar profundidad
            if (kneeAngle > 120) {
                corrections.push({ type: 'depth', message: 'Baja más, la cadera debe llegar a la altura de las rodillas' });
            }

            // Verificar espalda recta
            const backAngle = calculateAngle(landmarks[LANDMARKS.NOSE], shoulder, hip);
            if (backAngle < 150) {
                corrections.push({ type: 'back', message: 'Mantén la espalda recta, no te inclines hacia adelante' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Pies al ancho de hombros, prepárate para bajar',
            correct: 'Excelente sentadilla',
            knee: 'Las rodillas no deben pasar la punta de los pies',
            depth: 'Baja más hasta que los muslos estén paralelos al suelo',
            back: 'Mantén la espalda recta',
        }
    },

    // ===== CURL DE BÍCEPS =====
    bicep_curl: {
        checkPose: (landmarks) => {
            const corrections = [];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const elbow = landmarks[LANDMARKS.LEFT_ELBOW];
            const wrist = landmarks[LANDMARKS.LEFT_WRIST];
            const hip = landmarks[LANDMARKS.LEFT_HIP];

            // Verificar que el codo esté pegado al cuerpo
            const elbowToHip = calculateDistance(elbow, hip);
            if (elbowToHip > 0.15) {
                corrections.push({ type: 'elbow', message: 'Mantén los codos pegados al cuerpo' });
            }

            // Verificar ángulo de curl
            const curlAngle = calculateAngle(shoulder, elbow, wrist);

            // Verificar que no balancea el cuerpo
            const shoulderDiff = Math.abs(landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y);
            if (shoulderDiff > 0.05) {
                corrections.push({ type: 'body', message: 'No balancees el cuerpo, usa solo los brazos' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'De pie con mancuernas, codos pegados al cuerpo',
            correct: 'Buen curl, controla el movimiento',
            elbow: 'Mantén los codos fijos y pegados al cuerpo',
            body: 'No balancees el cuerpo, el movimiento es solo del antebrazo',
        }
    },

    // ===== ELEVACIÓN DE PIERNAS =====
    leg_raise: {
        checkPose: (landmarks) => {
            const corrections = [];
            const hip = landmarks[LANDMARKS.LEFT_HIP];
            const knee = landmarks[LANDMARKS.LEFT_KNEE];
            const ankle = landmarks[LANDMARKS.LEFT_ANKLE];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];

            // Verificar que está acostado
            if (Math.abs(shoulder.y - hip.y) > 0.2) {
                corrections.push({ type: 'position', message: 'Acuéstate completamente en el suelo' });
            }

            // Verificar piernas rectas
            const legAngle = calculateAngle(hip, knee, ankle);
            if (legAngle < 160) {
                corrections.push({ type: 'legs', message: 'Mantén las piernas rectas' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Acostado boca arriba, piernas juntas',
            correct: 'Perfecto, sube las piernas controladamente',
            position: 'Mantén la espalda pegada al suelo',
            legs: 'Mantén las piernas rectas durante todo el movimiento',
        }
    },

    // ===== ESPALDA RECTA / POSTURA =====
    posture: {
        checkPose: (landmarks) => {
            const corrections = [];
            const nose = landmarks[LANDMARKS.NOSE];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const hip = landmarks[LANDMARKS.LEFT_HIP];

            // Verificar alineación vertical
            const alignment = Math.abs(shoulder.x - hip.x);
            if (alignment > 0.08) {
                corrections.push({ type: 'lean', message: 'Mantén el torso vertical, no te inclines' });
            }

            // Verificar hombros nivelados
            const shoulderLevel = Math.abs(landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y);
            if (shoulderLevel > 0.03) {
                corrections.push({ type: 'shoulders', message: 'Nivela los hombros' });
            }

            // Verificar cabeza adelantada
            if (nose.x > shoulder.x + 0.1) {
                corrections.push({ type: 'head', message: 'Lleva la cabeza hacia atrás, está muy adelantada' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'De pie con la espalda recta',
            correct: 'Excelente postura',
            lean: 'Mantén el torso vertical',
            shoulders: 'Nivela los hombros',
            head: 'Retrae la cabeza, está muy adelantada',
        }
    },

    // ===== ESTIRAMIENTO LATERAL =====
    side_stretch: {
        checkPose: (landmarks) => {
            const corrections = [];
            const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
            const leftHip = landmarks[LANDMARKS.LEFT_HIP];
            const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

            // Verificar que las caderas estén fijas
            const hipDiff = Math.abs(leftHip.x - rightHip.x);
            if (hipDiff < 0.1) {
                corrections.push({ type: 'hip', message: 'Mantén las caderas fijas, mueve solo el torso' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'De pie, brazos arriba, prepárate para inclinarte',
            correct: 'Buen estiramiento, siente el lado',
            hip: 'Mantén las caderas fijas',
        }
    },

    // ===== PUENTE DE GLÚTEOS =====
    glute_bridge: {
        checkPose: (landmarks) => {
            const corrections = [];
            const shoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const hip = landmarks[LANDMARKS.LEFT_HIP];
            const knee = landmarks[LANDMARKS.LEFT_KNEE];

            // Verificar elevación de cadera
            if (hip.y > knee.y) {
                corrections.push({ type: 'hip', message: 'Sube más la cadera, debe estar alineada con las rodillas' });
            }

            // Verificar que los hombros estén en el suelo
            const shoulderDiff = Math.abs(landmarks[LANDMARKS.LEFT_SHOULDER].y - landmarks[LANDMARKS.RIGHT_SHOULDER].y);
            if (shoulderDiff > 0.05) {
                corrections.push({ type: 'shoulders', message: 'Mantén los hombros en el suelo' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Acostado, rodillas dobladas, pies en el suelo',
            correct: 'Excelente, aprieta los glúteos arriba',
            hip: 'Sube más la cadera hasta alinear con las rodillas',
            shoulders: 'Mantén los hombros pegados al suelo',
        }
    },

    // ===== ROTACIÓN DE TRONCO =====
    trunk_rotation: {
        checkPose: (landmarks) => {
            const corrections = [];
            const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
            const leftHip = landmarks[LANDMARKS.LEFT_HIP];
            const rightHip = landmarks[LANDMARKS.RIGHT_HIP];

            // Verificar que las caderas estén fijas
            const hipRotation = Math.abs(leftHip.x - rightHip.x);

            // Permitir rotación de hombros
            const shoulderRotation = leftShoulder.x - rightShoulder.x;

            return corrections;
        },
        voiceMessages: {
            start: 'Sentado o de pie, prepárate para rotar el tronco',
            correct: 'Buena rotación, mantén las caderas fijas',
        }
    },

    // ===== EJERCICIO GENÉRICO (DEFAULT) =====
    generic: {
        checkPose: (landmarks) => {
            const corrections = [];

            // Verificaciones básicas
            const leftShoulder = landmarks[LANDMARKS.LEFT_SHOULDER];
            const rightShoulder = landmarks[LANDMARKS.RIGHT_SHOULDER];
            const shoulderDiff = Math.abs(leftShoulder.y - rightShoulder.y);

            if (shoulderDiff > 0.08) {
                corrections.push({ type: 'balance', message: 'Mantén el cuerpo equilibrado' });
            }

            return corrections;
        },
        voiceMessages: {
            start: 'Prepárate para el ejercicio',
            correct: 'Bien, continúa así',
            balance: 'Mantén el equilibrio',
        }
    },
};

// Mapeo de ejercicio ID a configuración de pose
export const EXERCISE_POSE_MAP = {
    // Gimnasio
    1: 'arms_standing',    // Remo sentado
    2: 'arms_standing',    // Remo con mancuernas
    3: 'arms_standing',    // Remo sentado polea
    4: 'arms_standing',    // Remo unilateral
    5: 'pushup',           // Flexiones
    6: 'arms_standing',    // Press de banca
    7: 'arms_standing',    // Aperturas inclinadas
    8: 'arms_standing',    // Press inclinado
    9: 'arms_standing',    // Aperturas mariposa
    10: 'plank',           // Plancha
    11: 'leg_raise',       // Elevación piernas suelo
    12: 'leg_raise',       // Elevación piernas banco
    13: 'bicep_curl',      // Curl bíceps
    14: 'arms_standing',   // Remo inclinado
    15: 'squat',           // Sentadilla Hack
    16: 'squat',           // Prensa piernas
    17: 'arms_standing',   // Elevación talones
    18: 'squat',           // Zancadas

    // Fisioterapia
    19: 'arms_standing',   // Aducción hombros
    20: 'arms_standing',   // Band pull-apart
    21: 'leg_raise',       // Crunch inverso
    22: 'bicep_curl',      // Curl sentado
    23: 'arms_standing',   // Elevación brazos
    24: 'leg_raise',       // Elevación corta piernas
    25: 'bicep_curl',      // Elevación corta mancuernas
    26: 'arms_standing',   // Elevación manos
    27: 'leg_raise',       // Elevación piernas
    28: 'arms_standing',   // Elevación puntas sentado
    29: 'squat',           // Elevación rodillas
    30: 'arms_standing',   // Elevación talones sentado
    31: 'arms_standing',   // Elevación lateral brazos
    32: 'posture',         // Espalda recta
    33: 'glute_bridge',    // Elevación glúteos
    34: 'posture',         // Estiramiento yoga
    35: 'squat',           // Estiramiento piernas
    36: 'side_stretch',    // Estiramiento lateral cintura
    37: 'leg_raise',       // Extensión piernas atrás
    38: 'squat',           // Flexión corta pierna/rodilla
    39: 'squat',           // Flexión corta pierna
    40: 'plank',           // Flexión espalda/pierna/abdomen
    41: 'pushup',          // Flexiones (fisio)
    42: 'side_stretch',    // Inclinación lateral tronco
    43: 'side_stretch',    // Inclinación lateral brazos abiertos
    44: 'plank',           // Plancha elevación brazo
    45: 'arms_standing',   // Press hombros mancuernas
    46: 'glute_bridge',    // Puente glúteos
    47: 'arms_standing',   // Estiramiento manos juntas
    48: 'arms_standing',   // Rotación antebrazo
    49: 'trunk_rotation',  // Rotación tronco sentado
    50: 'squat',           // Sentadillas (fisio)
};

// Obtener configuración de pose para un ejercicio
export function getPoseConfigForExercise(exerciseId) {
    const configKey = EXERCISE_POSE_MAP[exerciseId] || 'generic';
    return POSE_CONFIGS[configKey];
}

// Speech synthesis helper
let speechSynthesis = null;
let lastSpokenMessage = '';
let lastSpokenTime = 0;
const SPEAK_COOLDOWN = 3000; // 3 segundos entre mensajes

export function speak(message, force = false) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const now = Date.now();
    if (!force && message === lastSpokenMessage && now - lastSpokenTime < SPEAK_COOLDOWN) {
        return; // Evitar repetir el mismo mensaje muy seguido
    }

    // Cancelar habla anterior
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Buscar voz en español
    const voices = window.speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.startsWith('es'));
    if (spanishVoice) {
        utterance.voice = spanishVoice;
    }

    window.speechSynthesis.speak(utterance);
    lastSpokenMessage = message;
    lastSpokenTime = now;
}

// Función principal para analizar pose y dar feedback
export function analyzeExercisePose(exerciseId, landmarks) {
    const config = getPoseConfigForExercise(exerciseId);
    if (!config || !landmarks) return { isCorrect: true, corrections: [] };

    const corrections = config.checkPose(landmarks);
    const isCorrect = corrections.length === 0;

    return {
        isCorrect,
        corrections,
        voiceMessages: config.voiceMessages,
    };
}

export default {
    LANDMARKS,
    POSE_CONFIGS,
    EXERCISE_POSE_MAP,
    calculateAngle,
    calculateDistance,
    getPoseConfigForExercise,
    speak,
    analyzeExercisePose,
};
