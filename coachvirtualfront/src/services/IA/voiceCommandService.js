/**
 * Servicio de reconocimiento de comandos de voz
 * Permite control por voz: "muéstrame", "enséñame", "explícame", "siguiente", etc.
 */

// Comandos reconocidos
export const VOICE_COMMANDS = {
    // Mostrar ejercicio
    SHOW_EXERCISE: ['muéstrame', 'mostrar', 'ver ejercicio', 'ver el ejercicio', 'enséñamelo'],
    // Explicar ejercicio
    EXPLAIN_EXERCISE: ['explícame', 'explicar', 'qué es', 'para qué sirve', 'explica'],
    // Enseñar/Tutorial
    TEACH_EXERCISE: ['enséñame', 'enseñar', 'cómo se hace', 'tutorial', 'aprendo'],
    // Siguiente ejercicio
    NEXT_EXERCISE: ['siguiente', 'próximo', 'next', 'continuar', 'adelante'],
    // Ejercicio anterior
    PREV_EXERCISE: ['anterior', 'atrás', 'volver', 'repetir'],
    // Pausar
    PAUSE: ['pausa', 'pausar', 'espera', 'detener', 'para', 'stop'],
    // Reanudar
    RESUME: ['continúa', 'continuar', 'sigue', 'reanudar', 'empezar', 'vamos'],
    // Descanso
    REST: ['descanso', 'descansar', 'necesito descanso', 'parar'],
    // Reiniciar
    RESTART: ['reiniciar', 'empezar de nuevo', 'desde el inicio', 'reset'],
    // Ayuda
    HELP: ['ayuda', 'qué puedo decir', 'comandos', 'opciones'],
    // Repetir instrucciones
    REPEAT: ['repite', 'repetir', 'no entendí', 'otra vez', 'de nuevo'],
};

// Estado del reconocimiento
let recognition = null;
let isListening = false;
let onCommandCallback = null;
let onTranscriptCallback = null;

/**
 * Verificar si el navegador soporta reconocimiento de voz
 */
export function isVoiceRecognitionSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}

/**
 * Inicializar reconocimiento de voz
 */
export function initVoiceRecognition(options = {}) {
    if (!isVoiceRecognitionSupported()) {
        console.warn('Voice recognition not supported');
        return false;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();

    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.lang = options.lang ?? 'es-ES';

    recognition.onresult = (event) => {
        const last = event.results.length - 1;
        const transcript = event.results[last][0].transcript.toLowerCase().trim();
        const isFinal = event.results[last].isFinal;

        if (onTranscriptCallback) {
            onTranscriptCallback(transcript, isFinal);
        }

        if (isFinal) {
            const command = detectCommand(transcript);
            if (command && onCommandCallback) {
                onCommandCallback(command, transcript);
            }
        }
    };

    recognition.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        if (event.error === 'not-allowed') {
            console.warn('Microphone permission denied');
        }
    };

    recognition.onend = () => {
        // Reiniciar si debería estar escuchando
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.warn('Could not restart recognition');
            }
        }
    };

    return true;
}

/**
 * Detectar comando desde transcripción
 */
function detectCommand(transcript) {
    for (const [command, keywords] of Object.entries(VOICE_COMMANDS)) {
        for (const keyword of keywords) {
            if (transcript.includes(keyword)) {
                return command;
            }
        }
    }
    return null;
}

/**
 * Iniciar escucha
 */
export function startListening() {
    if (!recognition) {
        initVoiceRecognition();
    }

    if (recognition && !isListening) {
        try {
            recognition.start();
            isListening = true;
            return true;
        } catch (e) {
            console.error('Error starting recognition:', e);
            return false;
        }
    }
    return false;
}

/**
 * Detener escucha
 */
export function stopListening() {
    if (recognition && isListening) {
        recognition.stop();
        isListening = false;
    }
}

/**
 * Registrar callback para comandos
 */
export function onVoiceCommand(callback) {
    onCommandCallback = callback;
}

/**
 * Registrar callback para transcripciones
 */
export function onTranscript(callback) {
    onTranscriptCallback = callback;
}

/**
 * Estado de escucha
 */
export function isCurrentlyListening() {
    return isListening;
}

/**
 * Obtener texto de ayuda de comandos
 */
export function getHelpText() {
    return `
    Puedes decir:
    - "Muéstrame el ejercicio" para ver la demostración
    - "Explícame el ejercicio" para escuchar la explicación
    - "Siguiente" para pasar al próximo ejercicio
    - "Pausa" para detener el entrenamiento
    - "Continúa" para reanudar
    - "Descanso" para tomar un descanso
    - "Ayuda" para escuchar estos comandos
  `.trim();
}

export default {
    VOICE_COMMANDS,
    isVoiceRecognitionSupported,
    initVoiceRecognition,
    startListening,
    stopListening,
    onVoiceCommand,
    onTranscript,
    isCurrentlyListening,
    getHelpText,
};
