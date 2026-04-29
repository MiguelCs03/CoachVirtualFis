/**
 * Servicio de voz mejorado para corrección de ejercicios
 * VOZ MASCULINA con actitud de entrenador motivador
 */

// Configuración - VOZ MASCULINA MOTIVADORA
const CONFIG = {
    lang: 'es-ES',
    rate: 1.15,        // Más rápido - actitud energética
    pitch: 0.85,       // Más grave - voz masculina
    volume: 1.0,
    cooldown: 2500,    // Respuesta más rápida
    priority: {
        count: 0,      // CONTEO - MÁXIMA PRIORIDAD - NUNCA SE INTERRUMPE
        critical: 1,   // Errores de postura peligrosos
        correction: 2, // Correcciones normales
        encouragement: 3, // Ánimo
        info: 4,       // Información general
    }
};

// Estado del servicio
let isInitialized = false;
let isSpeaking = false;
let currentUtterance = null;
let messageQueue = [];
let lastMessageTime = {};
let onSpeakingChange = null;
let voiceInstance = null;

// Mensajes predefinidos - ESTILO ENTRENADOR ESTRICTO Y MOTIVADOR
export const VOICE_MESSAGES = {
    // Inicio de ejercicio
    start: {
        generic: '¡VAMOS! ¡A DARLE CON TODO! ¡SIN EXCUSAS!',
        squat: '¡POSICIÓN! Pies firmes, espalda recta. ¡AHORA!',
        pushup: '¡AL SUELO! Posición de plancha, manos bien puestas. ¡YA!',
        plank: '¡COMO UNA TABLA! Cuerpo recto, sin excusas.',
        curl: '¡CODOS PEGADOS! Controla cada repetición.',
        stretch: '¡RESPIRA HONDO! Estira y mantén. ¡TÚ PUEDES!',
    },

    // Correcciones de postura - DIRECTO, FIRME, ESTRICTO
    corrections: {
        // DISTANCIA DE CÁMARA
        tooClose: '¡ALÉJATE DE LA CÁMARA! ¡NECESITO VER TODO TU CUERPO!',
        tooFar: '¡ACÉRCATE A LA CÁMARA! ¡NO TE VEO BIEN!',
        bodyNotVisible: '¡MUÉSTRAME TODO TU CUERPO! ¡RETROCEDE!',
        feetNotVisible: '¡MUESTRA TUS PIES! ¡NECESITO VER TUS PIERNAS!',

        // Espalda
        backBent: '¡ESPALDA RECTA! ¡AHORA!',
        backArched: '¡NO ARQUEES! ¡CONTROLA ESA ESPALDA!',
        shouldersUneven: '¡HOMBROS NIVELADOS! ¡YA!',

        // Caderas
        hipsTooLow: '¡SUBE ESA CADERA! ¡SIN EXCUSAS!',
        hipsTooHigh: '¡BAJA LA CADERA! ¡CONTROLA!',
        hipsUneven: '¡CADERAS FIRMES! ¡ESTABILIZA!',

        // Rodillas
        kneesPastToes: '¡RODILLAS ATRÁS! ¡NO PASES LOS PIES!',
        kneesNotBent: '¡MÁS FLEXIÓN! ¡BAJA MÁS!',
        kneesTooWide: '¡ACERCA LAS RODILLAS! ¡CONTROLA!',
        kneesTooNarrow: '¡SEPARA LAS RODILLAS! ¡ABRE!',

        // Brazos
        elbowsFlared: '¡CODOS AL CUERPO! ¡PEGADOS!',
        armsNotStraight: '¡BRAZOS RECTOS! ¡EXTIENDE!',
        wristsNotAligned: '¡MUÑECAS ALINEADAS!',
        armsUp: '¡SUBE LOS BRAZOS! ¡ARRIBA!',
        armsDown: '¡BAJA LOS BRAZOS! ¡CONTROLA!',

        // Cabeza y cuello
        headForward: '¡CABEZA ATRÁS! ¡MIRADA AL FRENTE!',
        headTilted: '¡CABEZA RECTA! ¡CONTROLA!',
        neckStrained: '¡RELAJA EL CUELLO! ¡NO FUERCES!',

        // Piernas y pies
        feetTooWide: '¡JUNTA LOS PIES! ¡CONTROLA!',
        feetTooNarrow: '¡SEPARA LOS PIES! ¡A LA ANCHURA DE HOMBROS!',
        legsNotStraight: '¡PIERNAS RECTAS! ¡EXTIENDE!',
        anklesBent: '¡TOBILLOS FIRMES! ¡ESTABILIZA!',

        // Torso
        leaningForward: '¡NO TE INCLINES! ¡CENTRO!',
        leaningBack: '¡MANTÉN LA POSICIÓN! ¡FIRME!',
        leaningSide: '¡NO TE INCLINES AL LADO! ¡CENTRO!',
        torsoRotated: '¡TORSO AL FRENTE! ¡NO GIRES!',

        // General
        offBalance: '¡EQUILIBRIO! ¡ESTABILIZA YA!',
        positionInitial: '¡POSICIÓN INICIAL! ¡PREPÁRATE!',
        moveTooFast: '¡MÁS LENTO! ¡CONTROLA EL MOVIMIENTO!',
        moveTooSlow: '¡MÁS RÁPIDO! ¡VAMOS!',
    },

    // Ánimo - ESTILO MOTIVADOR INTENSO
    encouragement: {
        good: '¡ESO ES! ¡ASÍ SE HACE!',
        perfect: '¡PERFECTO! ¡ERES UNA MÁQUINA!',
        almostThere: '¡YA CASI! ¡NO PARES AHORA!',
        keepGoing: '¡DALE DURO! ¡NO AFLOJES!',
        greatForm: '¡EXCELENTE FORMA! ¡MANTÉN!',
        halfwayThere: '¡MITAD DEL CAMINO! ¡VAMOS!',
        lastRep: '¡ÚLTIMA! ¡CON TODO LO QUE TIENES!',
        completed: '¡COMPLETADO! ¡ERES IMPARABLE!',
        tired: '¡SÉ QUE ESTÁS CANSADO! ¡PERO NO TE RINDAS!',
        rest: '¡BUEN TRABAJO! DESCANSA. LO MERECES.',
    },

    // Conteo
    counting: {
        one: 'UNO',
        two: 'DOS',
        three: 'TRES',
        four: 'CUATRO',
        five: 'CINCO',
        six: 'SEIS',
        seven: 'SIETE',
        eight: 'OCHO',
        nine: 'NUEVE',
        ten: 'DIEZ',
    },

    // Instrucciones de fase - DIRECTAS Y FUERTES
    phases: {
        inhale: '¡INHALA PROFUNDO!',
        exhale: '¡EXHALA!',
        hold: '¡MANTÉN LA POSICIÓN!',
        relax: '¡RELAJA!',
        down: '¡BAJA!',
        up: '¡SUBE!',
        squeeze: '¡APRIETA FUERTE!',
        extend: '¡EXTIENDE!',
        bend: '¡FLEXIONA!',
    },

    // Estiramientos - por tiempo
    stretch: {
        start: '¡ESTIRA Y MANTÉN! ¡RESPIRA!',
        halfway: '¡MITAD DE TIEMPO! ¡AGUANTA!',
        almostDone: '¡CASI LISTO! ¡5 SEGUNDOS MÁS!',
        complete: '¡EXCELENTE ESTIRAMIENTO! ¡AHORA RELAJA!',
    },
};

/**
 * Inicializar el servicio de voz - PREFERIR VOZ MASCULINA
 */
export function initVoiceService(options = {}) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
        console.warn('Speech synthesis not available');
        return false;
    }

    // Aplicar opciones
    Object.assign(CONFIG, options);

    // Buscar voz MASCULINA en español
    const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const spanishVoices = voices.filter(v => v.lang.startsWith('es'));

        // Priorizar voces masculinas (buscar por nombre común de voces masculinas)
        const maleKeywords = ['male', 'hombre', 'jorge', 'pablo', 'david', 'diego', 'carlos', 'andres', 'microsoft pablo', 'google español'];
        const femaleKeywords = ['female', 'mujer', 'paulina', 'monica', 'conchita', 'lucia', 'maria'];

        // Intentar encontrar voz masculina
        let selectedVoice = spanishVoices.find(v => {
            const nameLower = v.name.toLowerCase();
            const isMale = maleKeywords.some(k => nameLower.includes(k));
            const isFemale = femaleKeywords.some(k => nameLower.includes(k));
            return isMale && !isFemale;
        });

        // Si no hay masculina explícita, buscar una que NO sea femenina
        if (!selectedVoice) {
            selectedVoice = spanishVoices.find(v => {
                const nameLower = v.name.toLowerCase();
                return !femaleKeywords.some(k => nameLower.includes(k));
            });
        }

        // Fallback a cualquier voz española o la primera disponible
        voiceInstance = selectedVoice || spanishVoices[0] || voices[0];

        console.log('🎤 Voz seleccionada:', voiceInstance?.name || 'default');
        isInitialized = true;
    };

    if (window.speechSynthesis.getVoices().length) {
        loadVoices();
    } else {
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return true;
}

/**
 * Hablar un mensaje con prioridad
 */
export function speak(message, priority = 'info', force = false) {
    if (!isInitialized) initVoiceService();
    if (!window.speechSynthesis) return;

    const priorityLevel = CONFIG.priority[priority] ?? CONFIG.priority.info;
    const now = Date.now();
    const messageKey = `${priority}:${message}`;

    // Verificar cooldown (excepto para conteo y forzado)
    if (!force && priority !== 'count') {
        const lastTime = lastMessageTime[messageKey] || 0;
        if (now - lastTime < CONFIG.cooldown) return;
    }

    // Agregar a cola
    messageQueue.push({ message, priority: priorityLevel, timestamp: now });
    lastMessageTime[messageKey] = now;

    // Ordenar por prioridad
    messageQueue.sort((a, b) => a.priority - b.priority);

    // Procesar cola
    processQueue();
}

/**
 * Procesar cola de mensajes
 */
function processQueue() {
    if (isSpeaking || messageQueue.length === 0) return;

    const { message } = messageQueue.shift();
    speakNow(message);
}

/**
 * Hablar inmediatamente
 */
function speakNow(message) {
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = CONFIG.lang;
    utterance.rate = CONFIG.rate;
    utterance.pitch = CONFIG.pitch;
    utterance.volume = CONFIG.volume;

    if (voiceInstance) {
        utterance.voice = voiceInstance;
    }

    utterance.onstart = () => {
        isSpeaking = true;
        if (onSpeakingChange) onSpeakingChange(true, message);
    };

    utterance.onend = () => {
        isSpeaking = false;
        currentUtterance = null;
        if (onSpeakingChange) onSpeakingChange(false, null);
        // Procesar siguiente mensaje
        setTimeout(processQueue, 200);
    };

    utterance.onerror = () => {
        isSpeaking = false;
        currentUtterance = null;
        if (onSpeakingChange) onSpeakingChange(false, null);
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
}

/**
 * Detener todos los mensajes
 */
export function stopSpeaking() {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
    messageQueue = [];
    isSpeaking = false;
    if (onSpeakingChange) onSpeakingChange(false, null);
}

/**
 * Registrar callback para cambios de estado
 */
export function onSpeakingStateChange(callback) {
    onSpeakingChange = callback;
}

/**
 * Decir un número (1-20)
 */
export function speakNumber(num) {
    const numbers = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete',
        'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce',
        'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'];
    const text = numbers[num] || num.toString();
    speak(text, 'count', true);
}

/**
 * Dar corrección de postura
 */
export function speakCorrection(correctionKey) {
    const message = VOICE_MESSAGES.corrections[correctionKey];
    if (message) {
        speak(message, 'correction');
    }
}

/**
 * Dar ánimo
 */
export function speakEncouragement(type = 'good') {
    const message = VOICE_MESSAGES.encouragement[type];
    if (message) {
        speak(message, 'encouragement');
    }
}

/**
 * Instrucción de fase
 */
export function speakPhase(phase) {
    const message = VOICE_MESSAGES.phases[phase];
    if (message) {
        speak(message, 'critical', true);
    }
}

/**
 * Configurar volumen (0-1)
 */
export function setVolume(volume) {
    CONFIG.volume = Math.max(0, Math.min(1, volume));
}

/**
 * Configurar velocidad (0.5-2)
 */
export function setRate(rate) {
    CONFIG.rate = Math.max(0.5, Math.min(2, rate));
}

/**
 * Verificar si está hablando
 */
export function isSpeakingNow() {
    return isSpeaking;
}

export default {
    initVoiceService,
    speak,
    stopSpeaking,
    speakNumber,
    speakCorrection,
    speakEncouragement,
    speakPhase,
    setVolume,
    setRate,
    isSpeakingNow,
    onSpeakingStateChange,
    VOICE_MESSAGES,
};
