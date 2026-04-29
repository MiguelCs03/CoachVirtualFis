/**
 * Componente universal de detección de ejercicio con cámara
 * Funciona con cualquiera de los 50 ejercicios del sistema
 * Incluye corrección de postura y feedback de voz
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';
import { analyzeExercisePose, speak, getPoseConfigForExercise } from '../../services/IA/poseDetectionConfig';
import { getEjercicioById } from '../../services/IA/ejerciciosDataset';

export default function UniversalExerciseDetector({
    exerciseId,
    onRepComplete,
    onPoseAnalysis,
    showCorrections = true,
    enableVoice = true,
}) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentCorrections, setCurrentCorrections] = useState([]);
    const [repCount, setRepCount] = useState(0);
    const [isInPosition, setIsInPosition] = useState(false);
    const [exerciseInfo, setExerciseInfo] = useState(null);

    const poseLandmarkerRef = useRef(null);
    const animationFrameRef = useRef(null);
    const streamRef = useRef(null);
    const repStateRef = useRef('idle'); // idle, down, up
    const lastCorrectionTimeRef = useRef(0);
    const lastRepTimeRef = useRef(0); // Para debounce de repeticiones

    // Cargar info del ejercicio
    useEffect(() => {
        const info = getEjercicioById(exerciseId);
        setExerciseInfo(info);

        // Anunciar inicio con voz
        if (enableVoice && info) {
            const config = getPoseConfigForExercise(exerciseId);
            if (config?.voiceMessages?.start) {
                setTimeout(() => speak(config.voiceMessages.start, true), 1000);
            }
        }
    }, [exerciseId, enableVoice]);

    useEffect(() => {
        let isMounted = true;

        const initializePoseDetector = async () => {
            try {
                setIsLoading(true);
                setError(null);

                // Initialize MediaPipe
                const vision = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
                );

                const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
                        delegate: 'GPU'
                    },
                    runningMode: 'VIDEO',
                    numPoses: 1
                });

                if (!isMounted) return;
                poseLandmarkerRef.current = poseLandmarker;

                // Access camera with fallback options
                let stream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: {
                            width: { ideal: 1280 },
                            height: { ideal: 720 },
                            facingMode: 'user'
                        },
                        audio: false
                    });
                } catch (camError) {
                    // Fallback to simpler constraints
                    stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: false
                    });
                }

                if (!isMounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;

                if (videoRef.current) {
                    const video = videoRef.current;
                    video.srcObject = stream;

                    // Wait for metadata to load
                    await new Promise((resolve) => {
                        video.onloadedmetadata = () => {
                            // Set video dimensions explicitly
                            video.width = video.videoWidth || 640;
                            video.height = video.videoHeight || 480;
                            resolve();
                        };
                    });

                    // Play with error handling
                    try {
                        await video.play();
                    } catch (playError) {
                        console.warn('Auto-play blocked, waiting for user interaction');
                        // Will be handled by user clicking "Iniciar"
                    }

                    if (isMounted) {
                        setIsLoading(false);
                        startDetection();
                    }
                }
            } catch (err) {
                console.error('Error initializing pose detector:', err);
                if (isMounted) {
                    setError(err.message || 'No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara.');
                    setIsLoading(false);
                }
            }
        };

        const startDetection = () => {
            if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            const drawingUtils = new DrawingUtils(ctx);

            const detect = async () => {
                if (!isMounted || video.readyState !== video.HAVE_ENOUGH_DATA) {
                    animationFrameRef.current = requestAnimationFrame(detect);
                    return;
                }

                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                const startTimeMs = performance.now();
                const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                if (results.landmarks && results.landmarks.length > 0) {
                    const landmarks = results.landmarks[0];

                    // Dibujar landmarks
                    for (const lm of results.landmarks) {
                        drawingUtils.drawLandmarks(lm, {
                            radius: 4,
                            color: '#00FF00',
                            fillColor: '#FF0000'
                        });
                        drawingUtils.drawConnectors(
                            lm,
                            PoseLandmarker.POSE_CONNECTIONS,
                            { color: '#00FF00', lineWidth: 2 }
                        );
                    }

                    // Analizar pose
                    const analysis = analyzeExercisePose(exerciseId, landmarks);
                    setIsInPosition(analysis.isCorrect);
                    setCurrentCorrections(analysis.corrections);

                    // Callback de análisis
                    if (onPoseAnalysis) {
                        onPoseAnalysis(analysis);
                    }

                    // Voice feedback para correcciones
                    if (enableVoice && analysis.corrections.length > 0) {
                        const now = Date.now();
                        if (now - lastCorrectionTimeRef.current > 4000) {
                            const correction = analysis.corrections[0];
                            const message = analysis.voiceMessages?.[correction.type] || correction.message;
                            speak(message);
                            lastCorrectionTimeRef.current = now;
                        }
                    }

                    // Voice feedback para posición correcta
                    if (enableVoice && analysis.isCorrect && !isInPosition) {
                        speak(analysis.voiceMessages?.correct || 'Excelente postura');
                    }

                    // Detectar repeticiones (basado en posición de cadera para la mayoría)
                    detectRepetition(landmarks);
                }

                animationFrameRef.current = requestAnimationFrame(detect);
            };

            detect();
        };

        const detectRepetition = (landmarks) => {
            // Lógica simple de detección de repetición basada en movimiento vertical
            const hip = landmarks[23]; // left hip
            const shoulder = landmarks[11]; // left shoulder

            if (!hip || !shoulder) return;

            const verticalRatio = hip.y - shoulder.y;
            const now = Date.now();

            // Estado de la repetición con DEBOUNCE de 1.5 segundos
            if (repStateRef.current === 'idle' && verticalRatio < 0.3) {
                repStateRef.current = 'down';
            } else if (repStateRef.current === 'down' && verticalRatio > 0.35) {
                // Solo contar si pasó el debounce  
                if (!lastRepTimeRef.current || now - lastRepTimeRef.current > 1500) {
                    repStateRef.current = 'up';
                    setRepCount(prev => {
                        const newCount = prev + 1;

                        // DELAY de 250ms para sincronizar voz con UI
                        if (enableVoice) {
                            setTimeout(() => {
                                speak(newCount.toString(), true);
                            }, 250);
                        }
                        if (onRepComplete) {
                            onRepComplete(newCount);
                        }
                        return newCount;
                    });
                    repStateRef.current = 'idle';
                    lastRepTimeRef.current = now;
                }
            }
        };

        initializePoseDetector();

        return () => {
            isMounted = false;
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (poseLandmarkerRef.current) {
                poseLandmarkerRef.current.close();
            }
        };
    }, [exerciseId, enableVoice, onPoseAnalysis, onRepComplete]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-8">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white text-lg">Cargando detector de poses...</p>
                <p className="text-gray-400 text-sm mt-2">Preparando cámara y modelo de IA</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-br from-red-900/20 to-slate-900 rounded-xl p-8 border border-red-500/30">
                <div className="text-6xl mb-4">📷</div>
                <p className="text-red-400 text-lg font-semibold mb-2">Error de cámara</p>
                <p className="text-gray-300 text-center max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    return (
        <div className="relative bg-slate-900 rounded-xl overflow-hidden">
            {/* Header con info del ejercicio */}
            {exerciseInfo && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-bold text-lg">{exerciseInfo.nombre}</h3>
                            <p className="text-gray-300 text-sm">{exerciseInfo.musculo} • {exerciseInfo.tipo}</p>
                        </div>
                        <div className="bg-blue-600 px-4 py-2 rounded-xl">
                            <p className="text-white text-2xl font-bold">{repCount}</p>
                            <p className="text-blue-200 text-xs">repeticiones</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Video y Canvas */}
            <div className="relative" style={{ minHeight: '480px', backgroundColor: '#1e293b' }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-auto block"
                    style={{
                        transform: 'scaleX(-1)',
                        minHeight: '480px',
                        objectFit: 'cover'
                    }}
                />
                <canvas
                    ref={canvasRef}
                    className="absolute top-0 left-0 w-full h-full pointer-events-none"
                    style={{ transform: 'scaleX(-1)' }}
                />
            </div>

            {/* Indicador de posición */}
            <div className={`absolute bottom-4 left-4 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${isInPosition
                ? 'bg-green-500 text-white'
                : 'bg-yellow-500 text-black'
                }`}>
                {isInPosition ? '✓ Postura correcta' : '⚠ Ajusta tu postura'}
            </div>

            {/* Correcciones */}
            {showCorrections && currentCorrections.length > 0 && (
                <div className="absolute bottom-4 right-4 max-w-xs">
                    {currentCorrections.slice(0, 2).map((correction, index) => (
                        <div
                            key={index}
                            className="bg-red-500/90 text-white px-3 py-2 rounded-lg text-sm mb-2 animate-pulse"
                        >
                            {correction.message}
                        </div>
                    ))}
                </div>
            )}

            {/* GIF de referencia */}
            {exerciseInfo?.url && (
                <div className="absolute top-20 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white/30 shadow-lg">
                    <img
                        src={exerciseInfo.url}
                        alt={exerciseInfo.nombre}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 text-center">
                        Referencia
                    </div>
                </div>
            )}
        </div>
    );
}
