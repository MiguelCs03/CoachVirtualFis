/**
 * Servicio de precarga de MediaPipe
 * Precarga el modelo en background para carga instantánea
 */
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

// Cache global del modelo
let cachedVision = null;
let cachedPoseLandmarker = null;
let preloadPromise = null;
let isPreloaded = false;

// URLs del modelo
const CDN_PRIMARY = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm';
const CDN_FALLBACK = 'https://unpkg.com/@mediapipe/tasks-vision@0.10.3/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

/**
 * Precargar el modelo de MediaPipe en background
 * Llamar esto al inicio de la app
 */
export async function preloadMediaPipe() {
    // Si ya está precargando, retornar la promesa existente
    if (preloadPromise) return preloadPromise;

    // Si ya está precargado, retornar inmediatamente
    if (isPreloaded && cachedPoseLandmarker) {
        console.log('⚡ MediaPipe ya precargado');
        return { vision: cachedVision, poseLandmarker: cachedPoseLandmarker };
    }

    console.log('🚀 Precargando MediaPipe en background...');

    preloadPromise = (async () => {
        try {
            // 1. Cargar Vision
            try {
                cachedVision = await FilesetResolver.forVisionTasks(CDN_PRIMARY);
            } catch (e) {
                console.warn('CDN primario fallido, usando fallback...');
                cachedVision = await FilesetResolver.forVisionTasks(CDN_FALLBACK);
            }

            // 2. Crear PoseLandmarker con GPU (modelo ligero)
            try {
                cachedPoseLandmarker = await PoseLandmarker.createFromOptions(cachedVision, {
                    baseOptions: {
                        modelAssetPath: MODEL_URL,
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1,
                    minDetectionConfidence: 0.5,
                    minTrackingConfidence: 0.5
                });
                console.log('✅ MediaPipe precargado con GPU');
            } catch (gpuErr) {
                console.warn('GPU no disponible, usando CPU...');
                cachedPoseLandmarker = await PoseLandmarker.createFromOptions(cachedVision, {
                    baseOptions: {
                        modelAssetPath: MODEL_URL,
                        delegate: 'CPU'
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1,
                    minDetectionConfidence: 0.4,
                    minTrackingConfidence: 0.4
                });
                console.log('✅ MediaPipe precargado con CPU');
            }

            isPreloaded = true;
            return { vision: cachedVision, poseLandmarker: cachedPoseLandmarker };

        } catch (error) {
            console.error('❌ Error precargando MediaPipe:', error);
            preloadPromise = null;
            throw error;
        }
    })();

    return preloadPromise;
}

/**
 * Obtener instancia precargada de PoseLandmarker
 * Si no está precargada, carga ahora
 */
export async function getPoseLandmarker() {
    if (cachedPoseLandmarker && isPreloaded) {
        console.log('⚡ Usando PoseLandmarker precargado');
        return cachedPoseLandmarker;
    }

    // Si no está precargado, cargarlo ahora
    const result = await preloadMediaPipe();
    return result.poseLandmarker;
}

/**
 * Obtener Vision precargado
 */
export async function getVision() {
    if (cachedVision && isPreloaded) {
        return cachedVision;
    }

    const result = await preloadMediaPipe();
    return result.vision;
}

/**
 * Verificar si está precargado
 */
export function isMediaPipePreloaded() {
    return isPreloaded && cachedPoseLandmarker !== null;
}

/**
 * Limpiar caché (para testing)
 */
export function clearPreloadCache() {
    if (cachedPoseLandmarker) {
        try {
            cachedPoseLandmarker.close();
        } catch (e) {
            // Ignorar
        }
    }
    cachedVision = null;
    cachedPoseLandmarker = null;
    preloadPromise = null;
    isPreloaded = false;
}

export default {
    preloadMediaPipe,
    getPoseLandmarker,
    getVision,
    isMediaPipePreloaded,
    clearPreloadCache
};
