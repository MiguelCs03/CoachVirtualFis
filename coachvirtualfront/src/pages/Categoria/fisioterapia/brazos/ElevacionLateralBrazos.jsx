import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación Lateral de Brazos (Lateral Raises)
 * Enfoque Clínico:
 * 1. Abducción en el Plano Escapular: Ligeramente hacia adelante (no T perfecta rígida).
 * 2. Evitar Trampa de Trapecio: Hombros abajo mientras brazos suben.
 * 3. Altura Controlada: No superar los 90° sin rotación externa.
 */
export default function ElevacionLateralBrazos() {
    // --- UI STATE ---
    const [started, setStarted] = useState(false);
    const location = useLocation();
    const passedImage = location?.state?.imageUrl || null;
    const passedNombre = location?.state?.nombre || 'Elevación lateral de brazos';

    // --- THERAPY STATE ---
    const [repCount, setRepCount] = useState(0);
    const [stage, setStage] = useState('down'); // 'down', 'raising', 'hold', 'lowering'
    const [feedback, setFeedback] = useState('Brazos a los lados, cuerpo quieto');
    const [metrics, setMetrics] = useState({
        armAngle: 0,        // Ángulo de abducción
        shoulderHike: false, // Encogimiento de hombros
        torsoStability: true // Balanceo
    });

    const { speak } = useSpeech({ lang: 'es-ES' });

    // Explicar el ejercicio al iniciar
    useEffect(() => {
        if (started) {
            // Dar tiempo para que la cámara se active
            setTimeout(() => {
                speak('Vamos a hacer elevación lateral de brazos. Levanta los brazos hacia los lados hasta la altura de los hombros. Mantén los codos ligeramente doblados y no encojas los hombros. ¡Comenzamos!');
            }, 1500);
        }
    }, [started, speak]);

    // Refs
    const armHistoryRef = useRef([]);
    const neckLengthBaseRef = useRef(null);
    const holdStartRef = useRef(null);
    const hikeWarnRef = useRef(false);

    // --- UMBRALES CLÍNICOS ---
    const START_ANGLE = 20;
    const TARGET_ANGLE = 85;    // Meta: ~90 grados (Horizontal)

    // Seguridad: No pasar de 95 grados en abducción pura para evitar pinzamiento
    const MAX_SAFE_ANGLE = 100;

    // Tolerancia de encogimiento (Hiking)
    const SHRUG_TOLERANCE = 0.04;

    const HOLD_TIME_MS = 1000;
    const SMOOTH_WINDOW = 5;

    const handlePoseDetected = (landmarks) => {
        const angles = calculateBodyAngles(landmarks);

        // 1. Ángulo de Abducción (Promedio)
        const rawLeft = angles.leftShoulder;
        const rawRight = angles.rightShoulder;

        // Suavizado
        const updateHistory = (val) => {
            armHistoryRef.current.push(val);
            if (armHistoryRef.current.length > SMOOTH_WINDOW) armHistoryRef.current.shift();
            return armHistoryRef.current.reduce((a, b) => a + b, 0) / armHistoryRef.current.length;
        };

        const avgRaw = (rawLeft + rawRight) / 2;
        const smoothArm = Math.round(updateHistory(avgRaw));

        // 2. Detección de "Shrug" (Encogimiento) - Usando longitud de cuello
        const nose = landmarks[0];
        const lSho = landmarks[11];
        const rSho = landmarks[12];

        let isHhiking = false;
        if (nose && lSho && rSho) {
            const midShoulderY = (lSho.y + rSho.y) / 2;
            const currentNeckLen = Math.abs(midShoulderY - nose.y);

            // Calibrar en reposo
            if (stage === 'down' && smoothArm < 25) {
                neckLengthBaseRef.current = currentNeckLen;
            }

            if (neckLengthBaseRef.current) {
                // Si el cuello se acorta, los hombros suben
                if (neckLengthBaseRef.current - currentNeckLen > SHRUG_TOLERANCE) {
                    isHhiking = true;
                }
            }
        }

        // Feedback de Hiking
        if (isHhiking) {
            if (!hikeWarnRef.current) {
                setFeedback('⚠️ Hombros abajo. Relaja el cuello.');
                speak('No encojas los hombros');
                hikeWarnRef.current = true;
            }
        } else {
            hikeWarnRef.current = false;
        }

        setMetrics({
            armAngle: smoothArm,
            shoulderHike: isHhiking,
            torsoStability: true // Simplificado para este ejemplo
        });

        // 3. Máquina de Estados
        const now = Date.now();

        if (stage === 'down' || stage === 'lowering') {
            if (smoothArm > START_ANGLE + 10) {
                setStage('raising');
                setFeedback('Sube los brazos hacia los lados...');
                holdStartRef.current = null;
            }
        }
        else if (stage === 'raising') {
            // Control de Rango Máximo
            if (smoothArm > MAX_SAFE_ANGLE) {
                setFeedback('🛑 ¡Alto! No subas más de los hombros.');
            }
            // Llegar a meta
            else if (smoothArm >= TARGET_ANGLE) {
                if (!holdStartRef.current) {
                    holdStartRef.current = now;
                } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                    setStage('hold');
                    setFeedback('🦅 Mantén la "T"...');
                    speak('Sostén');
                    holdStartRef.current = null;
                }
            }
        }
        else if (stage === 'hold') {
            if (!holdStartRef.current) holdStartRef.current = now;
            if (now - holdStartRef.current >= 1000) {
                setStage('lowering');
                setFeedback('Baja resistiendo la gravedad.');
                holdStartRef.current = null;
            }
        }
        else if (stage === 'lowering') {
            if (smoothArm < START_ANGLE) {
                if (!holdStartRef.current) {
                    holdStartRef.current = now;
                } else if (now - holdStartRef.current >= 500) {
                    setRepCount(c => c + 1);
                    setFeedback('✅ Bien hecho. Repite.');
                    speak((repCount + 1).toString());
                    setStage('down');
                    holdStartRef.current = null;
                }
            }
        }
    };

    // --- VISTA PREVIA ---
    if (!started) {
        return (
            <div className="min-h-screen bg-gray-50 p-8">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-3xl font-bold mb-4 text-slate-800">{passedNombre}</h1>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
                        <div className="h-64 bg-indigo-50 flex items-center justify-center relative">
                            {passedImage ? (
                                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-7xl">🦾</div>
                            )}
                            <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                                Fortalecimiento Deltoides
                            </div>
                        </div>
                        <div className="p-8">
                            <h3 className="text-lg font-semibold text-slate-700 mb-3">Técnica Correcta:</h3>
                            <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                                <li>Levanta los brazos lateralmente hasta la altura de los hombros.</li>
                                <li>Mantén los codos ligeramente flexionados, no bloqueados.</li>
                                <li>No uses impulso del cuerpo para subir.</li>
                            </ul>
                            <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                                Iniciar Ejercicio
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- VISTA TERAPIA ---
    return (
        <div className="min-h-screen bg-slate-50 p-6">
            <div className="max-w-5xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{passedNombre}</h2>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Hombro</span>
                    </div>
                    <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* CÁMARA */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                            <YogaPoseDetector onPoseDetected={handlePoseDetected} />

                            {/* Alerta de Hiking */}
                            {metrics.shoulderHike && (
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500/90 text-white px-6 py-4 rounded-xl animate-bounce z-20 shadow-xl border-2 border-white text-center">
                                    <div className="text-2xl mb-1">🐢</div>
                                    <div className="font-bold text-lg">HOMBROS ABAJO</div>
                                </div>
                            )}

                            {/* Medidor de Ángulo */}
                            <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-4 py-2 rounded-xl border shadow-sm text-right">
                                <div className="text-[10px] uppercase font-bold text-slate-500">Elevación</div>
                                <div className="text-3xl font-light text-slate-800">{metrics.armAngle}°</div>
                                <div className="text-[10px] text-indigo-600 font-bold">Meta: 90°</div>
                            </div>
                        </div>
                    </div>

                    {/* PANEL LATERAL */}
                    <div className="space-y-6">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-500 text-center">
                            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                            <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                            <div className="mt-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'hold' ? 'bg-green-500' : 'bg-slate-400'}`}>
                                    {stage === 'hold' ? 'SOSTENIENDO' : stage === 'raising' ? 'SUBIENDO' : 'BAJANDO'}
                                </span>
                            </div>
                        </div>

                        <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') || feedback.includes('🛑') ? 'bg-amber-50 border-amber-200 text-amber-800' :
                                feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                    'bg-white border-slate-200 text-slate-600'}`}>
                            <div className="text-2xl mt-1">
                                {feedback.includes('⚠️') ? '👋' : feedback.includes('✅') ? '👌' : '📢'}
                            </div>
                            <div>
                                <h4 className="font-bold text-sm mb-1">Feedback</h4>
                                <p className="text-sm leading-relaxed">{feedback}</p>
                            </div>
                        </div>

                        {/* Gráfico de Elevación */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                            <h4 className="font-bold text-slate-700 mb-4 text-sm text-center">Trayectoria del Brazo</h4>
                            <div className="relative h-24 mx-auto w-40 overflow-hidden">
                                {/* Arco de fondo */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 border-[12px] border-slate-100 rounded-full clip-path-top"></div>

                                {/* Arco de progreso */}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 border-[12px] border-indigo-500 rounded-full clip-path-top"
                                    style={{
                                        clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)', // Solo mitad superior
                                        maskImage: `conic-gradient(transparent ${180 - metrics.armAngle * 2}deg, black 0)` // Máscara dinámica (aprox)
                                    }}></div>

                                {/* Simulación manual con SVG mejor */}
                                <svg className="absolute bottom-0 left-0 w-full h-full" viewBox="0 0 100 50">
                                    <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                                    <path d="M10,50 A40,40 0 0,1 90,50" fill="none" stroke="#6366f1" strokeWidth="8"
                                        strokeDasharray="126"
                                        strokeDashoffset={126 - (126 * Math.min(metrics.armAngle, 90) / 90)}
                                        className="transition-all duration-300 ease-out" />
                                </svg>
                            </div>
                            <div className="flex justify-between px-8 text-[10px] text-slate-400 mt-1">
                                <span>0°</span>
                                <span>90°</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}