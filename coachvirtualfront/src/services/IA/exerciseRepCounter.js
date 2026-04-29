/**
 * Configuración de conteo de repeticiones específica para cada ejercicio
 * Cada ejercicio tiene sus propias reglas de detección de movimiento,
 * umbrales de ángulo y lógica de conteo
 */

import { calculateAngle, calculateDistance } from './poseDetectionConfig';

// Configuración de conteo por tipo de ejercicio
export const REP_COUNTING_CONFIGS = {
    // ===== FLEXIONES / PUSH-UPS =====
    pushup: {
        name: 'Flexiones',
        phases: ['up', 'down'],
        detection: {
            // Ángulo del codo para determinar fase
            primaryAngle: {
                joints: ['shoulder', 'elbow', 'wrist'],
                upThreshold: 165,    // Brazos completamente extendidos
                downThreshold: 70,   // Codos bien doblados - movimiento completo
            },
        },
        validation: {
            // Verificar que el cuerpo esté recto (plancha)
            bodyAlignment: {
                joints: ['shoulder', 'hip', 'ankle'],
                minAngle: 160,
                maxAngle: 185,
                errorMessage: 'Mantén el cuerpo recto como una tabla',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Sube',
            complete: null, // Número de rep
            error: 'Mantén el cuerpo recto',
        },
    },

    // ===== SENTADILLAS / SQUATS =====
    squat: {
        name: 'Sentadillas',
        phases: ['up', 'down'],
        detection: {
            primaryAngle: {
                joints: ['hip', 'knee', 'ankle'],
                upThreshold: 165,    // Completamente de pie
                downThreshold: 80,   // Sentadilla profunda - movimiento completo
            },
        },
        validation: {
            kneePosition: {
                check: 'knee_over_toes',
                errorMessage: 'Las rodillas no deben pasar la punta de los pies',
            },
            backAngle: {
                joints: ['shoulder', 'hip', 'knee'],
                minAngle: 60,
                maxAngle: 120,
                errorMessage: 'Mantén la espalda recta, no te inclines',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Sube',
            complete: null,
            error: 'Espalda recta',
        },
    },

    // ===== CURL DE BÍCEPS =====
    bicep_curl: {
        name: 'Curl de bíceps',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['shoulder', 'elbow', 'wrist'],
                upThreshold: 35,     // Contracción máxima completa
                downThreshold: 160,  // Brazo completamente extendido
            },
        },
        validation: {
            elbowStable: {
                check: 'elbow_stationary',
                tolerance: 0.05,
                errorMessage: 'Mantén los codos pegados al cuerpo',
            },
            noSwinging: {
                check: 'shoulder_level',
                tolerance: 0.05,
                errorMessage: 'No balancees el cuerpo',
            },
        },
        voiceFeedback: {
            down: 'Baja lento',
            up: 'Contrae',
            complete: null,
            error: 'Codos fijos',
        },
    },

    // ===== ELEVACIÓN LATERAL DE BRAZOS =====
    lateral_raise: {
        name: 'Elevación lateral',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['hip', 'shoulder', 'wrist'],
                upThreshold: 80,     // Brazos a la altura de hombros
                downThreshold: 20,   // Brazos abajo
            },
        },
        validation: {
            shoulderShrug: {
                check: 'shoulder_not_shrugged',
                tolerance: 0.04,
                errorMessage: 'No encojas los hombros',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Sube hasta los hombros',
            complete: null,
            error: 'Hombros abajo',
        },
    },

    // ===== ELEVACIÓN DE PIERNAS =====
    leg_raise: {
        name: 'Elevación de piernas',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['shoulder', 'hip', 'ankle'],
                upThreshold: 70,     // Piernas arriba (ángulo pequeño)
                downThreshold: 160,  // Piernas abajo
            },
        },
        validation: {
            legsStrght: {
                joints: ['hip', 'knee', 'ankle'],
                minAngle: 160,
                errorMessage: 'Mantén las piernas rectas',
            },
            backFlat: {
                check: 'back_on_ground',
                errorMessage: 'Mantén la espalda pegada al suelo',
            },
        },
        voiceFeedback: {
            down: 'Baja controlado',
            up: 'Sube las piernas',
            complete: null,
            error: 'Piernas rectas',
        },
    },

    // ===== PLANCHA (ISOMÉTRICO) =====
    plank: {
        name: 'Plancha',
        phases: ['hold'],
        isometric: true,
        detection: {
            holdPosition: {
                joints: ['shoulder', 'hip', 'ankle'],
                targetAngle: 175,
                tolerance: 15,
            },
        },
        validation: {
            hipAlignment: {
                joints: ['shoulder', 'hip', 'ankle'],
                minAngle: 160,
                maxAngle: 190,
                errorMessage: 'Mantén la cadera alineada',
            },
        },
        voiceFeedback: {
            hold: 'Mantén la posición',
            error: 'Cadera alineada',
        },
    },

    // ===== PUENTE DE GLÚTEOS =====
    glute_bridge: {
        name: 'Puente de glúteos',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['shoulder', 'hip', 'knee'],
                upThreshold: 170,    // Cadera arriba
                downThreshold: 130,  // Cadera abajo
            },
        },
        validation: {
            kneesAlign: {
                check: 'knees_over_ankles',
                errorMessage: 'Rodillas sobre los tobillos',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Aprieta glúteos y sube',
            complete: null,
            error: 'Aprieta los glúteos',
        },
    },

    // ===== PRESS DE HOMBROS =====
    shoulder_press: {
        name: 'Press de hombros',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['hip', 'shoulder', 'wrist'],
                upThreshold: 170,    // Brazos arriba
                downThreshold: 90,   // Mancuernas a hombros
            },
        },
        validation: {
            backStraight: {
                joints: ['shoulder', 'hip', 'knee'],
                minAngle: 170,
                errorMessage: 'Mantén la espalda recta, no arquees',
            },
        },
        voiceFeedback: {
            down: 'Baja a los hombros',
            up: 'Empuja arriba',
            complete: null,
            error: 'Espalda recta',
        },
    },

    // ===== REMO =====
    row: {
        name: 'Remo',
        phases: ['extended', 'contracted'],
        detection: {
            primaryAngle: {
                joints: ['shoulder', 'elbow', 'wrist'],
                contractedThreshold: 45,   // Codos hacia atrás
                extendedThreshold: 150,    // Brazos extendidos
            },
        },
        validation: {
            backFlat: {
                joints: ['shoulder', 'hip', 'knee'],
                minAngle: 80,
                maxAngle: 120,
                errorMessage: 'Mantén la espalda plana',
            },
        },
        voiceFeedback: {
            extended: 'Extiende',
            contracted: 'Jala hacia ti',
            complete: null,
            error: 'Espalda plana',
        },
    },

    // ===== ZANCADAS / LUNGES =====
    lunge: {
        name: 'Zancadas',
        phases: ['up', 'down'],
        detection: {
            primaryAngle: {
                joints: ['hip', 'knee', 'ankle'],
                upThreshold: 160,    // De pie
                downThreshold: 90,   // Zancada profunda
            },
        },
        validation: {
            kneeAlign: {
                check: 'front_knee_over_ankle',
                errorMessage: 'La rodilla no debe pasar el tobillo',
            },
            backKnee: {
                check: 'back_knee_near_ground',
                errorMessage: 'Baja la rodilla trasera hacia el suelo',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Empuja y sube',
            complete: null,
            error: 'Rodilla alineada',
        },
    },

    // ===== ELEVACIÓN DE RODILLAS =====
    knee_raise: {
        name: 'Elevación de rodillas',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['shoulder', 'hip', 'knee'],
                upThreshold: 80,     // Rodilla arriba
                downThreshold: 160,  // Pierna abajo
            },
        },
        validation: {
            balance: {
                check: 'stable_standing',
                errorMessage: 'Mantén el equilibrio',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Rodilla al pecho',
            complete: null,
        },
    },

    // ===== CRUNCH / ABDOMINALES =====
    crunch: {
        name: 'Crunch',
        phases: ['down', 'up'],
        detection: {
            primaryAngle: {
                joints: ['hip', 'shoulder', 'head'],
                upThreshold: 100,    // Crunch arriba
                downThreshold: 160,  // Acostado
            },
        },
        validation: {
            neckRelaxed: {
                check: 'no_neck_strain',
                errorMessage: 'No jales el cuello, mira al techo',
            },
        },
        voiceFeedback: {
            down: 'Baja',
            up: 'Contrae el abdomen',
            complete: null,
            error: 'Cuello relajado',
        },
    },

    // ===== ROTACIÓN DE ANTEBRAZO / MUÑECA =====
    forearm_rotation: {
        name: 'Rotación de antebrazo',
        phases: ['neutral', 'rotated'],
        detection: {
            // Detecta cambio de posición de la muñeca respecto al codo
            wristMovement: {
                threshold: 0.03,
            },
        },
        validation: {},
        voiceFeedback: {
            neutral: 'Posición inicial',
            rotated: 'Rota',
            complete: null,
        },
    },

    // ===== ESTIRAMIENTO (cuenta tiempo mantenido) =====
    stretch: {
        name: 'Estiramiento',
        phases: ['hold'],
        isometric: true,
        detection: {
            holdPosition: {
                joints: ['shoulder', 'hip', 'knee'],
                targetAngle: 170,
                tolerance: 30,
            },
        },
        validation: {},
        voiceFeedback: {
            hold: 'Mantén el estiramiento',
            complete: null,
        },
    },

    // ===== GENÉRICO (para ejercicios sin configuración específica) =====
    generic: {
        name: 'Ejercicio',
        phases: ['down', 'up'],
        detection: {
            // Detecta SOLO movimiento MUY significativo
            anyMovement: {
                wristThreshold: 0.12,   // Antes 0.04 - ahora 3x más estricto
                elbowThreshold: 0.12,   // Antes 0.05 - ahora 2.4x más estricto
                shoulderThreshold: 0.12, // Antes 0.05 - ahora 2.4x más estricto
                verticalThreshold: 0.15, // Antes 0.08 - ahora casi 2x más estricto
            },
        },
        validation: {},
        voiceFeedback: {
            down: 'Baja',
            up: 'Sube',
            complete: null,
        },
    },
};

// Mapeo de ID de ejercicio a configuración de conteo
export const EXERCISE_REP_MAP = {
    // ===== GIMNASIO (1-18) =====
    1: 'row',           // Remo sentado en máquina
    2: 'row',           // Remo con mancuernas
    3: 'row',           // Remo sentado en polea
    4: 'row',           // Remo unilateral de pie
    5: 'pushup',        // Flexiones
    6: 'shoulder_press', // Press de banca
    7: 'lateral_raise', // Aperturas inclinadas
    8: 'shoulder_press', // Press inclinado
    9: 'lateral_raise', // Aperturas mariposa
    10: 'plank',        // Plancha
    11: 'leg_raise',    // Elevación de piernas suelo
    12: 'leg_raise',    // Elevación de piernas banco
    13: 'bicep_curl',   // Curl de bíceps de pie
    14: 'row',          // Remo inclinado
    15: 'squat',        // Sentadilla Hack
    16: 'squat',        // Prensa de piernas
    17: 'generic',      // Elevación de talones
    18: 'lunge',        // Zancadas

    // ===== FISIOTERAPIA (19-50) =====
    19: 'lateral_raise', // Aducción de hombros
    20: 'lateral_raise', // Band Pull-Apart
    21: 'crunch',        // Crunch Inverso
    22: 'bicep_curl',    // Curl de bíceps Sentado
    23: 'lateral_raise', // Elevación de brazos
    24: 'leg_raise',     // Elevación corta de piernas
    25: 'lateral_raise', // Elevación corta mancuernas
    26: 'generic',       // Elevación de manos
    27: 'leg_raise',     // Elevación de piernas
    28: 'generic',       // Elevación de puntas sentado
    29: 'knee_raise',    // Elevación de rodillas
    30: 'generic',       // Elevación de talones sentado
    31: 'lateral_raise', // Elevación lateral de brazos
    32: 'plank',         // Espalda Recta (isométrico)
    33: 'glute_bridge',  // Elevación de glúteos
    34: 'plank',         // Estiramiento yoga (mantener)
    35: 'stretch',        // Estiramiento piernas
    36: 'stretch',        // Estiramiento lateral cintura
    37: 'leg_raise',      // Extensión piernas atrás
    38: 'squat',          // Flexión corta de pierna/rodilla
    39: 'squat',          // Flexión corta de pierna
    40: 'crunch',         // Flexión espalda/pierna/abdomen
    41: 'pushup',         // Flexiones (fisio)
    42: 'stretch',        // Inclinación lateral tronco
    43: 'stretch',        // Inclinación lateral brazos abiertos
    44: 'plank',          // Plancha con elevación de brazo
    45: 'shoulder_press', // Press de hombros
    46: 'glute_bridge',   // Puente de glúteos
    47: 'stretch',        // Estiramiento manos juntas
    48: 'forearm_rotation', // Rotación de antebrazo
    49: 'forearm_rotation', // Rotación de tronco
    50: 'squat',          // Sentadillas
};

/**
 * Clase para manejar el conteo de repeticiones de un ejercicio
 */
export class ExerciseRepCounter {
    constructor(exerciseId) {
        this.exerciseId = exerciseId;
        const configKey = EXERCISE_REP_MAP[exerciseId] || 'generic';
        this.config = REP_COUNTING_CONFIGS[configKey];

        this.repCount = 0;
        this.currentPhase = null;
        this.lastPhase = null;
        this.phaseHistory = [];
        this.isFormCorrect = true;
        this.currentErrors = [];
        this.lastAngle = 0;
        this.smoothedAngle = 0;
        this.holdStartTime = null;
    }

    /**
     * Procesar landmarks y determinar si se completó una repetición
     */
    processFrame(landmarks) {
        if (!landmarks || !this.config) {
            return { counted: false, isCorrect: true, errors: [] };
        }

        const result = {
            counted: false,
            isCorrect: true,
            errors: [],
            phase: null,
            angle: 0,
        };

        // Calcular ángulo principal
        const angle = this._calculatePrimaryAngle(landmarks);
        result.angle = angle;

        // Suavizar ángulo
        this.smoothedAngle = this.smoothedAngle * 0.7 + angle * 0.3;

        // Validar forma
        const validationResult = this._validateForm(landmarks);
        result.isCorrect = validationResult.isCorrect;
        result.errors = validationResult.errors;
        this.isFormCorrect = validationResult.isCorrect;
        this.currentErrors = validationResult.errors;

        // Ejercicios isométricos (plancha, etc.)
        if (this.config.isometric) {
            return this._processIsometric(result, landmarks);
        }

        // Determinar fase actual
        const phase = this._determinePhase(this.smoothedAngle);
        result.phase = phase;

        // Agregar fase al historial si cambió
        if (phase && phase !== this.currentPhase) {
            this.phaseHistory.push(phase);
            // Mantener solo las últimas 10 fases
            if (this.phaseHistory.length > 10) {
                this.phaseHistory.shift();
            }
        }

        // Solo contar si la forma es correcta
        if (result.isCorrect) {
            // Detectar transición de fases para contar rep
            if (this._detectRepComplete(phase)) {
                this.repCount++;
                result.counted = true;
                result.repNumber = this.repCount;
            }
        }

        this.lastPhase = this.currentPhase;
        this.currentPhase = phase;
        this.lastAngle = angle;

        return result;
    }

    /**
     * Calcular ángulo principal basado en la configuración del ejercicio
     */
    _calculatePrimaryAngle(landmarks) {
        const detection = this.config.detection;

        // Ángulo entre 3 articulaciones
        if (detection.primaryAngle) {
            const { joints } = detection.primaryAngle;
            const points = this._getJointPoints(joints, landmarks);
            if (points.length === 3) {
                return calculateAngle(points[0], points[1], points[2]);
            }
        }

        // Movimiento de muñeca (para rotaciones)
        if (detection.wristMovement) {
            const leftWrist = landmarks[15];
            const rightWrist = landmarks[16];
            const leftElbow = landmarks[13];

            if (!this.lastWristPos) {
                this.lastWristPos = { x: leftWrist.x, y: leftWrist.y };
            }

            const movement = Math.abs(leftWrist.x - this.lastWristPos.x) +
                Math.abs(leftWrist.y - this.lastWristPos.y);
            this.lastWristPos = { x: leftWrist.x, y: leftWrist.y };

            // Convertir movimiento a ángulo simulado (0-180)
            return movement > detection.wristMovement.threshold ? 170 : 20;
        }

        // Posición mantenida (estiramientos isométricos)
        if (detection.holdPosition) {
            const { joints } = detection.holdPosition;
            const points = this._getJointPoints(joints, landmarks);
            if (points.length === 3) {
                return calculateAngle(points[0], points[1], points[2]);
            }
        }

        // Cualquier movimiento (genérico)
        if (detection.anyMovement) {
            const leftWrist = landmarks[15];
            const leftElbow = landmarks[13];
            const leftShoulder = landmarks[11];
            const rightWrist = landmarks[16];

            if (!this.lastPositions) {
                this.lastPositions = {
                    wrist: { x: leftWrist.x, y: leftWrist.y },
                    elbow: { x: leftElbow.x, y: leftElbow.y },
                    shoulder: { x: leftShoulder.x, y: leftShoulder.y },
                };
                return 90; // Posición neutral inicial
            }

            // Guardar posición anterior ANTES de actualizar
            const prevWristY = this.lastPositions.wrist.y;

            // Calcular movimiento total
            const wristMove = Math.abs(leftWrist.x - this.lastPositions.wrist.x) +
                Math.abs(leftWrist.y - this.lastPositions.wrist.y);
            const elbowMove = Math.abs(leftElbow.x - this.lastPositions.elbow.x) +
                Math.abs(leftElbow.y - this.lastPositions.elbow.y);
            const shoulderMove = Math.abs(leftShoulder.x - this.lastPositions.shoulder.x) +
                Math.abs(leftShoulder.y - this.lastPositions.shoulder.y);

            // Actualizar posiciones
            this.lastPositions = {
                wrist: { x: leftWrist.x, y: leftWrist.y },
                elbow: { x: leftElbow.x, y: leftElbow.y },
                shoulder: { x: leftShoulder.x, y: leftShoulder.y },
            };

            // Umbral más sensible para detectar movimiento
            const totalMove = wristMove + elbowMove + shoulderMove;
            if (totalMove > 0.03) {
                // Hay movimiento, verificar dirección vertical
                const verticalDir = leftWrist.y - prevWristY;
                if (verticalDir > 0.01) return 30;  // Bajando
                if (verticalDir < -0.01) return 160; // Subiendo
            }

            return this.lastAngle || 90; // mantener ángulo anterior
        }

        // Movimiento vertical del torso (fallback)
        if (detection.verticalMovement) {
            const shoulder = landmarks[11];
            const hip = landmarks[23];
            return Math.abs(shoulder.y - hip.y) * 100;
        }

        return 0;
    }

    /**
     * Obtener puntos de articulaciones
     */
    _getJointPoints(joints, landmarks) {
        const jointMap = {
            shoulder: 11, // LEFT_SHOULDER
            elbow: 13,    // LEFT_ELBOW
            wrist: 15,    // LEFT_WRIST
            hip: 23,      // LEFT_HIP
            knee: 25,     // LEFT_KNEE
            ankle: 27,    // LEFT_ANKLE
            head: 0,      // NOSE
        };

        return joints.map(joint => landmarks[jointMap[joint]]).filter(p => p);
    }

    /**
     * Determinar la fase actual del movimiento
     * REQUIERE movimiento significativo para cambiar de fase
     */
    _determinePhase(angle) {
        const detection = this.config.detection;
        const phases = this.config.phases;

        // Histéresis: requiere movimiento mínimo de 10 grados para cambiar fase
        const HYSTERESIS = 10;

        // Para detectar movimiento REAL, verificar que el ángulo cambió significativamente
        const angleChange = Math.abs(angle - (this.lastStableAngle || angle));
        if (angleChange > 15) {
            this.lastStableAngle = angle;
        }

        // Ángulo principal (flexiones, sentadillas, curls, etc.)
        if (detection.primaryAngle) {
            const { upThreshold, downThreshold, contractedThreshold, extendedThreshold } = detection.primaryAngle;

            // Para curl, remo (contracted/extended)
            if (contractedThreshold !== undefined) {
                // Solo cambiar si superó el umbral por el margen de histéresis
                if (angle <= contractedThreshold - HYSTERESIS) return 'contracted';
                if (angle >= extendedThreshold + HYSTERESIS) return 'extended';
                return this.currentPhase;
            }

            // Para flexiones, sentadillas (up/down) - con histéresis
            if (angle >= upThreshold + HYSTERESIS) return 'up';
            if (angle <= downThreshold - HYSTERESIS) return 'down';
        }

        // Movimiento de muñeca (rotaciones)
        if (detection.wristMovement) {
            if (angle >= 140) return phases[1] || 'rotated';  // Mayor umbral
            if (angle <= 40) return phases[0] || 'neutral';
            return this.currentPhase;
        }

        // Cualquier movimiento (genérico) - MUCHO MÁS ESTRICTO
        if (detection.anyMovement) {
            // Requiere movimiento MUY grande para detectar fase
            if (angle >= 150) return 'up';   // Antes era 100
            if (angle <= 30) return 'down';  // Antes era 60
            return this.currentPhase;
        }

        return this.currentPhase;
    }

    /**
     * Detectar si se completó una repetición
     * Funciona con cualquier par de fases definido en config.phases
     */
    _detectRepComplete(newPhase) {
        if (!this.lastPhase || !newPhase) return false;
        if (this.lastPhase === newPhase) return false; // Sin cambio de fase

        const phases = this.config.phases;
        if (!phases || phases.length < 2) return false;

        const firstPhase = phases[0];
        const secondPhase = phases[1];

        // Ciclo completo: primera fase -> segunda fase -> primera fase
        // Cuenta cuando VUELVE a la primera fase después de haber estado en la segunda
        if (this.lastPhase === secondPhase && newPhase === firstPhase) {
            return true;
        }

        // O alternativamente: segunda -> primera -> segunda (para ejercicios que empiezan en segunda fase)
        if (this.lastPhase === firstPhase && newPhase === secondPhase) {
            // Solo contar si ya hubo un ciclo previo (evita contar al inicio)
            if (this.phaseHistory.length >= 2) {
                return true;
            }
        }

        return false;
    }

    /**
     * Procesar ejercicio isométrico
     */
    _processIsometric(result, landmarks) {
        const holdConfig = this.config.detection.holdPosition;
        if (!holdConfig) return result;

        const angle = result.angle;
        const targetAngle = holdConfig.targetAngle;
        const tolerance = holdConfig.tolerance;

        const isInPosition = Math.abs(angle - targetAngle) <= tolerance;

        if (isInPosition && result.isCorrect) {
            if (!this.holdStartTime) {
                this.holdStartTime = Date.now();
            }
            result.holdTime = (Date.now() - this.holdStartTime) / 1000;
            result.phase = 'hold';
        } else {
            this.holdStartTime = null;
            result.holdTime = 0;
            result.phase = 'preparing';
        }

        return result;
    }

    /**
     * Validar la forma del ejercicio
     */
    _validateForm(landmarks) {
        const errors = [];
        const validation = this.config.validation;

        for (const [key, rule] of Object.entries(validation)) {
            if (rule.joints) {
                // Validación por ángulo
                const points = this._getJointPoints(rule.joints, landmarks);
                if (points.length === 3) {
                    const angle = calculateAngle(points[0], points[1], points[2]);

                    if (rule.minAngle && angle < rule.minAngle) {
                        errors.push({ type: key, message: rule.errorMessage });
                    }
                    if (rule.maxAngle && angle > rule.maxAngle) {
                        errors.push({ type: key, message: rule.errorMessage });
                    }
                }
            } else if (rule.check) {
                // Validaciones especiales
                const checkResult = this._runSpecialCheck(rule.check, landmarks, rule);
                if (!checkResult) {
                    errors.push({ type: key, message: rule.errorMessage });
                }
            }
        }

        return {
            isCorrect: errors.length === 0,
            errors,
        };
    }

    /**
     * Ejecutar verificaciones especiales
     */
    _runSpecialCheck(checkName, landmarks, rule) {
        switch (checkName) {
            case 'elbow_stationary': {
                const leftElbow = landmarks[13];
                const leftHip = landmarks[23];
                const distance = calculateDistance(leftElbow, leftHip);
                return distance < (rule.tolerance || 0.15);
            }

            case 'shoulder_level': {
                const leftShoulder = landmarks[11];
                const rightShoulder = landmarks[12];
                const diff = Math.abs(leftShoulder.y - rightShoulder.y);
                return diff < (rule.tolerance || 0.05);
            }

            case 'shoulder_not_shrugged': {
                const nose = landmarks[0];
                const leftShoulder = landmarks[11];
                const rightShoulder = landmarks[12];
                const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2;
                const neckLength = Math.abs(nose.y - midShoulderY);
                return neckLength > (rule.tolerance || 0.06);
            }

            case 'knee_over_toes': {
                const knee = landmarks[25];
                const ankle = landmarks[27];
                return knee.x > ankle.x - 0.05;
            }

            default:
                return true;
        }
    }

    /**
     * Obtener mensaje de voz para la fase actual
     */
    getVoiceFeedback() {
        if (!this.config.voiceFeedback) return null;

        if (this.currentErrors.length > 0) {
            return this.config.voiceFeedback.error || this.currentErrors[0].message;
        }

        if (this.currentPhase) {
            return this.config.voiceFeedback[this.currentPhase];
        }

        return null;
    }

    /**
     * Resetear contador
     */
    reset() {
        this.repCount = 0;
        this.currentPhase = null;
        this.lastPhase = null;
        this.phaseHistory = [];
        this.holdStartTime = null;
    }
}

/**
 * Crear contador de repeticiones para un ejercicio
 */
export function createRepCounter(exerciseId) {
    return new ExerciseRepCounter(exerciseId);
}

/**
 * Obtener configuración de conteo para un ejercicio
 */
export function getRepCountingConfig(exerciseId) {
    const configKey = EXERCISE_REP_MAP[exerciseId] || 'generic';
    return REP_COUNTING_CONFIGS[configKey];
}

export default {
    REP_COUNTING_CONFIGS,
    EXERCISE_REP_MAP,
    ExerciseRepCounter,
    createRepCounter,
    getRepCountingConfig,
};
