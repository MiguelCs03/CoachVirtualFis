import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Brazos (Abducción Bilateral)
 * Enfoque Clínico:
 * 1. Monitoreo de "Shoulder Hiking": Detectar elevación vertical de las clavículas (trampa del trapecio).
 * 2. Simetría: Ambos brazos deben subir a la misma velocidad y altura.
 * 3. Codos Extendidos: Evitar flexión compensatoria.
 */
export default function ElevacionBrazos() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación de brazos';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down'); // 'down', 'lifting', 'hold', 'lowering'
  const [feedback, setFeedback] = useState('Brazos relajados a los lados');
  const [metrics, setMetrics] = useState({
    avgArmAngle: 0,      // Altura promedio de brazos
    shrugDetected: false,// ¿Está encogiendo hombros?
    symmetryDiff: 0      // Diferencia entre izq y der
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const shoulderBaseYRef = useRef(null); // Altura base de hombros
  const armHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const shrugWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const START_ANGLE = 20;     // Brazos abajo
  const TARGET_ANGLE = 85;    // Meta: ~90 grados (Horizontal)
  
  // Tolerancia de encogimiento (Hiking)
  // Si el hombro sube verticalmente más de 0.03 (coord normalizada), es trampa.
  const SHRUG_THRESHOLD = 0.035; 

  const HOLD_TIME_MS = 2000;  // 2 segundos de isometría
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // Datos crudos para análisis de altura (Hiking)
    const lSho = landmarks[11]; // Hombro Izq
    const rSho = landmarks[12]; // Hombro Der
    const nose = landmarks[0];  // Nariz (Punto fijo relativo cabeza)

    // 1. Calcular Ángulo de Abducción (Axila)
    const rawLeft = angles.leftShoulder;
    const rawRight = angles.rightShoulder;
    
    // Suavizado
    const updateHistory = (l, r) => {
        armHistoryRef.current.push({ l, r });
        if (armHistoryRef.current.length > SMOOTH_WINDOW) armHistoryRef.current.shift();
        const avgL = armHistoryRef.current.reduce((a, b) => a + b.l, 0) / armHistoryRef.current.length;
        const avgR = armHistoryRef.current.reduce((a, b) => a + b.r, 0) / armHistoryRef.current.length;
        return { avgL, avgR };
    };
    
    const { avgL, avgR } = updateHistory(rawLeft, rawRight);
    const avgArmAngle = Math.round((avgL + avgR) / 2);
    const symmetryDiff = Math.abs(avgL - avgR);

    // 2. Detección de "Shrug" (Encogimiento de hombros)
    // Usamos la distancia vertical entre la nariz y el punto medio de los hombros.
    // Si esta distancia se acorta, los hombros están subiendo hacia la cabeza.
    let isShrugging = false;
    if (lSho && rSho && nose) {
        const shoulderMidY = (lSho.y + rSho.y) / 2;
        const neckLength = Math.abs(shoulderMidY - nose.y);

        // Calibrar al inicio (brazos abajo)
        if (stage === 'down' && avgArmAngle < 25) {
            shoulderBaseYRef.current = neckLength;
        }

        // Chequear durante el movimiento
        if (shoulderBaseYRef.current && stage !== 'down') {
            // Si la longitud del cuello se reduce, hay encogimiento
            const compression = shoulderBaseYRef.current - neckLength;
            if (compression > SHRUG_THRESHOLD) {
                isShrugging = true;
            }
        }
    }

    // Feedback de Trampa
    if (isShrugging) {
        if (!shrugWarnRef.current) {
            setFeedback('⚠️ ¡Relaja el cuello! No subas los hombros.');
            speak('Baja los hombros');
            shrugWarnRef.current = true;
        }
    } else {
        shrugWarnRef.current = false;
    }

    setMetrics({
        avgArmAngle,
        shrugDetected: isShrugging,
        symmetryDiff
    });

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'down' || stage === 'lowering') {
        // Iniciar subida
        if (avgArmAngle > START_ANGLE + 10) {
            setStage('lifting');
            setFeedback('Sube los brazos formando una "T"...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lifting') {
        // Llegar a 90 grados
        if (avgArmAngle >= TARGET_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('🧘 Sostén ahí. Hombros lejos de las orejas.');
                 speak('Mantén');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 1000) {
            setStage('lowering');
            setFeedback('Baja muy despacio (Control excéntrico).');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta abajo
        if (avgArmAngle < START_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Descansa. Respira.');
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
            <div className="h-64 bg-blue-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">🖐️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Hombro Doloroso / Manguito Rotador
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Ponte de frente a la cámara.</li>
                <li>Levanta ambos brazos hacia los lados hasta la altura de los hombros (Forma de T).</li>
                <li><strong>Crucial:</strong> Mantén el cuello largo y relajado. No encojas los hombros.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Iniciar Sesión
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Abducción Activa</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Shrug */}
                    {metrics.shrugDetected && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-6 py-4 rounded-xl animate-bounce z-20 shadow-xl text-center">
                            <div className="text-3xl mb-1">🐢</div>
                            <div className="font-bold text-lg">NO ENCOJAS HOMBROS</div>
                            <div className="text-xs">Relaja el trapecio</div>
                        </div>
                    )}

                    {/* Nivel de Brazos */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex justify-between text-xs text-white font-bold mb-1 px-1 drop-shadow-md">
                            <span>Abajo</span>
                            <span>Horizontal (90°)</span>
                        </div>
                        <div className="h-3 bg-black/30 rounded-full overflow-hidden backdrop-blur-sm border border-white/30">
                            <div className={`h-full transition-all duration-200 ${metrics.shrugDetected ? 'bg-red-500' : 'bg-indigo-400'}`}
                                 style={{ width: `${Math.min(100, (metrics.avgArmAngle / 90) * 100)}%` }}></div>
                        </div>
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
                            {stage === 'hold' ? 'ISOMETRÍA' : 'MOVIMIENTO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🐢' : feedback.includes('✅') ? '🦢' : 'ℹ️'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Control Postural</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Visualizador de Simetría */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm text-center">Simetría de Brazos</h4>
                    <div className="flex items-center justify-center gap-4">
                        <div className="text-xs text-slate-400">Izq</div>
                        {/* Balanza */}
                        <div className="w-32 h-1 bg-slate-200 rounded relative">
                            <div className={`absolute w-4 h-4 rounded-full top-1/2 -translate-y-1/2 transition-all duration-300 shadow-sm border
                                ${metrics.symmetryDiff > 15 ? 'bg-red-500 border-red-700' : 'bg-green-500 border-green-700'}`}
                                style={{ left: `calc(50% + ${Math.max(-45, Math.min(45, metrics.symmetryDiff * (metrics.avgArmAngle % 2 === 0 ? 1 : -1)))}%)` }}> {/* Simulación de movimiento */}
                            </div>
                        </div>
                        <div className="text-xs text-slate-400">Der</div>
                    </div>
                    <p className="text-center text-xs mt-2 text-slate-500">
                        {metrics.symmetryDiff > 15 ? '⚠️ Desnivelado' : '✅ Nivelado'}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}