import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Flexión Corta de Pierna (Mini-Squat / Partial Knee Bend)
 * Enfoque Clínico:
 * 1. Rango Seguro: Flexión de rodilla entre 0° (extensión) y 45° (flexión).
 * 2. Alineación: Detectar valgo (rodilla hacia adentro).
 * 3. Control: Movimiento lento excéntrico/concéntrico.
 */
export default function FlexionCortaPierna() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Flexión Corta de Pierna';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('stand'); // 'stand', 'descending', 'hold', 'ascending'
  const [feedback, setFeedback] = useState('Ponte de pie frente a la cámara');
  const [metrics, setMetrics] = useState({
    kneeAngle: 180,     // Ángulo de flexión
    kneeAlignment: 0,   // Desviación lateral (Valgo/Varo)
    isAligned: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const alignmentWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const STANDING_ANGLE = 170; // Casi recto
  const TARGET_FLEXION = 135; // ~45 grados de flexión (180 - 45 = 135)
  const MAX_SAFE_FLEXION = 120; // No bajar más de 60 grados en rehab temprana
  
  // Alineación (Diferencia X entre rodilla y línea Cadera-Tobillo)
  // Simplificado: Si rodilla.x se desvía mucho del centro entre cadera.x y tobillo.x
  const VALGUS_TOLERANCE = 0.05; // Unidades relativas de MediaPipe

  const HOLD_TIME_MS = 1000;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    // Detectamos la pierna más visible o activa. Asumimos vista frontal para ver valgo.
    // Si es lateral, el valgo es difícil, nos enfocamos en flexión.
    
    // Usamos ambas piernas para promedio si es bilateral, o la activa si es unilateral.
    // Para simplificar este ejemplo terapéutico, usaremos la pierna derecha como referencia principal
    // o la que tenga menor ángulo (esté flexionando).
    const isRightActive = angles.rightKnee < angles.leftKnee;
    const activeKneeAngle = isRightActive ? angles.rightKnee : angles.leftKnee;
    
    // Datos crudos para alineación
    const hip = isRightActive ? landmarks[24] : landmarks[23];
    const knee = isRightActive ? landmarks[26] : landmarks[25];
    const ankle = isRightActive ? landmarks[28] : landmarks[27];

    // 1. Suavizado
    const updateHistory = (val) => {
        kneeHistoryRef.current.push(val);
        if (kneeHistoryRef.current.length > SMOOTH_WINDOW) kneeHistoryRef.current.shift();
        return kneeHistoryRef.current.reduce((a, b) => a + b, 0) / kneeHistoryRef.current.length;
    };
    const smoothKnee = Math.round(updateHistory(activeKneeAngle));

    // 2. Chequeo de Alineación (Valgo Dinámico)
    // Calculamos la posición X esperada de la rodilla (interpolación lineal entre cadera y tobillo)
    let isAligned = true;
    let deviation = 0;
    if (hip && knee && ankle) {
        const expectedKneeX = (hip.x + ankle.x) / 2;
        deviation = knee.x - expectedKneeX; // Positivo o negativo según lado
        
        // Ajuste según pierna (Derecha vs Izquierda) para detectar "hacia adentro"
        const isValgus = isRightActive ? deviation < -VALGUS_TOLERANCE : deviation > VALGUS_TOLERANCE;
        
        if (isValgus) {
            isAligned = false;
            if (!alignmentWarnRef.current) {
                setFeedback('⚠️ ¡Cuidado! Rodilla hacia adentro. Alíneala con el pie.');
                speak('Rodilla alineada');
                alignmentWarnRef.current = true;
            }
        } else {
            if (alignmentWarnRef.current) {
                alignmentWarnRef.current = false;
                setFeedback('✅ Buena alineación.');
            }
        }
    }

    setMetrics({
        kneeAngle: smoothKnee,
        kneeAlignment: deviation,
        isAligned
    });

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'stand' || stage === 'ascending') {
        // Iniciar bajada
        if (smoothKnee < STANDING_ANGLE - 5) {
            setStage('descending');
            setFeedback('Baja despacio controlando la rodilla...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'descending') {
        // Controlar límite
        if (smoothKnee < MAX_SAFE_FLEXION) {
            setFeedback('🛑 ¡Suficiente! No bajes tanto.');
        }
        // Llegar a meta
        else if (smoothKnee <= TARGET_FLEXION) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('⏱️ Sostén la flexión...');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        // Mantener isométrico breve
        if (!holdStartRef.current) holdStartRef.current = now;
        
        if (now - holdStartRef.current >= 1000) { // 1 seg extra de hold explícito
            setStage('ascending');
            setFeedback('Sube lento extendiendo la pierna.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'ascending') {
        if (smoothKnee > STANDING_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Muy bien. Descansa un segundo.');
                 speak((repCount + 1).toString());
                 setStage('stand');
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
                <div className="text-7xl">🦿</div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                  Rehabilitación Funcional
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Colócate frente a la cámara (vista frontal es mejor para ver alineación).</li>
                <li>Realiza una pequeña sentadilla (aprox 45°).</li>
                <li><strong>Clave:</strong> La rodilla debe apuntar al segundo dedo del pie, ¡no hacia adentro!</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Comenzar Terapia
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Control Motor</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Semáforo de Alineación */}
                    <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full shadow-lg backdrop-blur-md border-2 transition-all
                        ${metrics.isAligned ? 'bg-white/90 border-green-400 text-green-700' : 'bg-red-50/90 border-red-400 text-red-700 animate-pulse'}`}>
                        <span className="text-sm font-bold flex items-center gap-2">
                            {metrics.isAligned ? '📏 ALINEACIÓN CORRECTA' : '⚠️ RODILLA HACIA ADENTRO'}
                        </span>
                    </div>
                </div>

                {/* Panel de Ángulo Preciso */}
                <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Flexión Actual</p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-mono font-light text-slate-800">{Math.abs(180 - metrics.kneeAngle)}°</span>
                            <span className="text-sm text-slate-400">/ 45° Meta</span>
                        </div>
                    </div>
                    
                    {/* Mini gráfico circular */}
                    <div className="relative w-16 h-16">
                        <svg className="w-full h-full" viewBox="0 0 36 36">
                            <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                            <path className={metrics.isAligned ? "text-indigo-500" : "text-red-500"} 
                                  strokeDasharray={`${Math.min(100, (Math.abs(180 - metrics.kneeAngle) / 45) * 100)}, 100`} 
                                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                                  fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* CONTROL Y FEEDBACK */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-6 flex justify-center gap-2">
                        <div className={`h-2 w-8 rounded-full transition-colors ${stage === 'descending' ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                        <div className={`h-2 w-8 rounded-full transition-colors ${stage === 'hold' ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                        <div className={`h-2 w-8 rounded-full transition-colors ${stage === 'ascending' ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 uppercase font-bold">{stage}</p>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') || feedback.includes('🛑') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '👁️' : feedback.includes('✅') ? '🌟' : '💬'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Feedback Terapéutico</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}