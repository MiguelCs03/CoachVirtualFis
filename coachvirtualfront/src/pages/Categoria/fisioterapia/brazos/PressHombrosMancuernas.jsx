import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Press de Hombros con Mancuernas
 * Enfoque Clínico:
 * 1. Simetría: Detectar disquinesias o debilidad unilateral (un brazo sube menos).
 * 2. Control de Tronco: Evitar inclinación lateral (compensación).
 * 3. Rango Protegido: Evitar que los codos bajen excesivamente en la fase excéntrica.
 */
export default function PressHombrosMancuernas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Press de hombros con mancuernas';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('start'); // 'start', 'pushing', 'top', 'lowering'
  const [feedback, setFeedback] = useState('Mancuernas a la altura de las orejas');
  const [metrics, setMetrics] = useState({
    leftArm: 0,         // Altura relativa o ángulo
    rightArm: 0,
    symmetryDiff: 0,    // Diferencia entre brazos
    torsoLean: 0        // Inclinación lateral
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const armHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const symmetryWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const START_ELBOW_ANGLE = 70;  // Codos flexionados (abajo)
  const TOP_ELBOW_ANGLE = 160;   // Brazos extendidos (arriba)
  
  // Simetría: Diferencia máxima permitida en grados de extensión
  const MAX_SYMMETRY_DIFF = 20; 
  
  // Inclinación lateral del tronco (compensación)
  const MAX_TORSO_LEAN = 8; // Grados

  const HOLD_TIME_MS = 1000;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Análisis de Extensión de Brazos (Elbow Angle)
    // Usamos el ángulo del codo para medir cuánto se ha estirado el brazo hacia arriba
    const rawL = angles.leftElbow;
    const rawR = angles.rightElbow;

    // 2. Análisis de Inclinación de Tronco (Mid-Shoulder vs Mid-Hip)
    const lSho = landmarks[11]; const rSho = landmarks[12];
    const lHip = landmarks[23]; const rHip = landmarks[24];
    
    let leanAngle = 0;
    if (lSho && rSho && lHip && rHip) {
        const midShoX = (lSho.x + rSho.x) / 2;
        const midHipX = (lHip.x + rHip.x) / 2;
        // Cálculo simplificado de desviación horizontal
        leanAngle = Math.abs((midShoX - midHipX) * 100); // Factor de escala arbitrario para sensibilidad
    }

    // 3. Suavizado
    const updateHistory = (l, r) => {
        armHistoryRef.current.push({ l, r });
        if (armHistoryRef.current.length > SMOOTH_WINDOW) armHistoryRef.current.shift();
        const avgL = armHistoryRef.current.reduce((a, b) => a + b.l, 0) / armHistoryRef.current.length;
        const avgR = armHistoryRef.current.reduce((a, b) => a + b.r, 0) / armHistoryRef.current.length;
        return { avgL, avgR };
    };
    
    const { avgL, avgR } = updateHistory(rawL, rawR);
    const avgExtension = (avgL + avgR) / 2;
    const diff = Math.abs(avgL - avgR);

    // 4. Feedback de Simetría y Postura
    let statusMsg = feedback; // Mantener mensaje actual por defecto

    // Prioridad 1: Inclinación
    if (leanAngle > MAX_TORSO_LEAN) {
        if (!symmetryWarnRef.current) {
            statusMsg = '⚠️ ¡Tronco recto! No te inclines.';
            speak('Endereza el cuerpo');
            symmetryWarnRef.current = true;
        }
    }
    // Prioridad 2: Asimetría
    else if (diff > MAX_SYMMETRY_DIFF && stage === 'pushing') {
        statusMsg = '⚖️ Iguala la velocidad de los brazos';
        symmetryWarnRef.current = true;
    } else {
        symmetryWarnRef.current = false;
        // Mensajes normales de fase si no hay error
        if (stage === 'start') statusMsg = 'Prepara... Sube controlado';
        if (stage === 'pushing') statusMsg = 'Empuja hacia el techo...';
        if (stage === 'top') statusMsg = 'Sostén arriba...';
        if (stage === 'lowering') statusMsg = 'Baja los codos lentamente';
    }
    
    setFeedback(statusMsg);
    setMetrics({
        leftArm: Math.round(avgL),
        rightArm: Math.round(avgR),
        symmetryDiff: Math.round(diff),
        torsoLean: Math.round(leanAngle)
    });

    // 5. Máquina de Estados
    const now = Date.now();

    if (stage === 'start' || stage === 'lowering') {
        // Iniciar empuje
        if (avgExtension > START_ELBOW_ANGLE + 15) {
            setStage('pushing');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'pushing') {
        // Llegar arriba
        if (avgExtension >= TOP_ELBOW_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('top');
                 speak('Baja');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'top') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 500) {
            setStage('lowering');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta abajo
        if (avgExtension < START_ELBOW_ANGLE + 10) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 speak((repCount + 1).toString());
                 setStage('start');
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
                <div className="text-7xl">🏋️‍♂️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Fuerza Overhead & Estabilidad
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Puntos de Control:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Siéntate o párate con la espalda recta. Activa el abdomen.</li>
                <li>Empuja ambas mancuernas verticalmente hasta extender los brazos.</li>
                <li><strong>Simetría:</strong> Evita que un brazo suba más rápido que el otro.</li>
                <li>No arquees la espalda baja al subir el peso.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Iniciar Terapia
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Estabilidad Glenohumeral</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Nivel de Burbuja Digital (Simetría) */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 h-8 bg-black/40 backdrop-blur-md rounded-full border border-white/30 flex items-center px-2">
                        {/* Zona central segura */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-8 h-full border-l border-r border-white/20"></div>
                        
                        {/* Burbuja */}
                        <div className={`w-6 h-6 rounded-full shadow-inner transition-all duration-200
                            ${Math.abs(metrics.leftArm - metrics.rightArm) > 20 ? 'bg-red-500' : 'bg-green-400'}`}
                             style={{ 
                                 transform: `translateX(${
                                     // Lógica de burbuja: Si Izq sube más (ángulo mayor), burbuja va a derecha
                                     (metrics.leftArm - metrics.rightArm) * 1.5
                                 }px)` 
                             }}>
                        </div>
                    </div>
                    <p className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] text-white font-bold shadow-black drop-shadow-md">
                        NIVEL DE BRAZOS
                    </p>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'top' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'top' ? 'TOP' : stage.toUpperCase()}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') || feedback.includes('⚖️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🚧' : feedback.includes('⚖️') ? '⚖️' : '📢'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Biofeedback</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Gráfico de Barras Comparativo */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm text-center">Extensión Izq vs Der</h4>
                    <div className="flex justify-center items-end gap-6 h-32">
                        {/* Barra Izquierda */}
                        <div className="flex flex-col items-center gap-2 w-12">
                            <div className="relative w-full h-24 bg-slate-100 rounded-t-lg overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-blue-500 transition-all duration-200"
                                     style={{ height: `${(metrics.leftArm / 180) * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500">L</span>
                        </div>
                        
                        {/* Barra Derecha */}
                        <div className="flex flex-col items-center gap-2 w-12">
                            <div className="relative w-full h-24 bg-slate-100 rounded-t-lg overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-indigo-500 transition-all duration-200"
                                     style={{ height: `${(metrics.rightArm / 180) * 100}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-slate-500">R</span>
                        </div>
                    </div>
                    <div className="text-center text-xs text-slate-400 mt-2">
                        Dif: {metrics.symmetryDiff}°
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}