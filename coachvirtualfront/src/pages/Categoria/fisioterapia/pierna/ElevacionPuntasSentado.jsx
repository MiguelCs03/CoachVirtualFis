import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Puntas Sentado (Dorsiflexión)
 * Enfoque Clínico:
 * 1. Fortalecimiento Tibial Anterior: Vital para la marcha.
 * 2. Rango de Movimiento: Llevar el pie desde ~90-100° (neutro/plantar) a <80° (dorsiflexión).
 * 3. Estabilidad: No levantar la rodilla/muslo.
 */
export default function ElevacionPuntasSentado() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación de puntas sentado';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('flat'); // 'flat', 'lifting', 'hold', 'lowering'
  const [feedback, setFeedback] = useState('Siéntate de perfil y apoya los pies');
  const [metrics, setMetrics] = useState({
    ankleAngle: 90,     // Ángulo del tobillo
    kneeHeightChange: 0, // Para detectar si levanta la pierna
    isLegStable: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const ankleHistoryRef = useRef([]);
  const kneeBaseYRef = useRef(null);
  const holdStartRef = useRef(null);
  const stabilityWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const FLAT_ANGLE = 95;      // Pie en el suelo
  const TARGET_DORSIFLEX = 75; // Puntas arriba (ángulo agudo)
  
  // Tolerancia de movimiento de rodilla (Trampa)
  const KNEE_MOVE_TOLERANCE = 0.03; 

  const HOLD_TIME_MS = 1000;
  const SMOOTH_WINDOW = 6;

  // Cálculo manual del ángulo del tobillo para mayor precisión en perfil
  const calculateAnkleAngle = (knee, ankle, toe) => {
      if (!knee || !ankle || !toe) return 90;
      // Vector Tibia (Rodilla -> Tobillo)
      // Vector Pie (Tobillo -> Puntera)
      const v1 = { x: knee.x - ankle.x, y: knee.y - ankle.y };
      const v2 = { x: toe.x - ankle.x, y: toe.y - ankle.y };
      
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      const angleRad = Math.acos(dot / (mag1 * mag2));
      return Math.round(angleRad * (180 / Math.PI));
  };

  const handlePoseDetected = (landmarks) => {
    // Usamos el lado visible (asumimos perfil, detectamos cuál es)
    // Lado derecho: 26, 28, 32. Lado izquierdo: 25, 27, 31.
    // Simplificación: Usamos el lado derecho como default o el que tenga mejor confianza.
    const knee = landmarks[26];
    const ankle = landmarks[28];
    const toe = landmarks[32];

    if (!knee || !ankle || !toe) return;

    // 1. Calcular Ángulo
    const rawAngle = calculateAnkleAngle(knee, ankle, toe);

    // 2. Chequeo de Estabilidad de Rodilla (No levantar el muslo)
    if (stage === 'flat' && !kneeBaseYRef.current) {
        kneeBaseYRef.current = knee.y;
    }
    
    let isLegStable = true;
    let kneeDiff = 0;
    if (kneeBaseYRef.current) {
        kneeDiff = Math.abs(kneeBaseYRef.current - knee.y);
        if (kneeDiff > KNEE_MOVE_TOLERANCE) {
            isLegStable = false;
        }
    }

    // Feedback de trampa
    if (!isLegStable && stage !== 'flat') {
        if (!stabilityWarnRef.current) {
            setFeedback('⚠️ ¡No levantes la pierna! Solo mueve el pie.');
            speak('Rodilla quieta');
            stabilityWarnRef.current = true;
        }
    } else {
        stabilityWarnRef.current = false;
    }

    // 3. Suavizado
    const updateHistory = (val) => {
        ankleHistoryRef.current.push(val);
        if (ankleHistoryRef.current.length > SMOOTH_WINDOW) ankleHistoryRef.current.shift();
        return ankleHistoryRef.current.reduce((a, b) => a + b, 0) / ankleHistoryRef.current.length;
    };
    const smoothAnkle = Math.round(updateHistory(rawAngle));

    setMetrics({
        ankleAngle: smoothAnkle,
        kneeHeightChange: kneeDiff,
        isLegStable
    });

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'flat' || stage === 'lowering') {
        // Iniciar dorsiflexión (ángulo disminuye)
        if (smoothAnkle < FLAT_ANGLE - 5) {
            setStage('lifting');
            setFeedback('Sube las puntas hacia la espinilla...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lifting') {
        // Llegar a la meta
        if (smoothAnkle <= TARGET_DORSIFLEX) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('🦶 Sostén arriba...');
                 speak('Sostén');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 1000) {
            setStage('lowering');
            setFeedback('Baja suavemente al suelo.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta al suelo
        if (smoothAnkle > FLAT_ANGLE - 2) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición lista.');
                 speak((repCount + 1).toString());
                 setStage('flat');
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
                <div className="text-7xl">👣</div>
              )}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-xs font-bold animate-pulse">
                  📸 CÁMARA LATERAL (PERFIL)
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Siéntate con los pies planos en el suelo.</li>
                <li>Mantén los talones pegados al piso.</li>
                <li>Levanta solo la punta de los pies lo más alto posible.</li>
                <li><strong>No muevas las rodillas.</strong></li>
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Activación Tibial</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Movimiento de Rodilla */}
                    {!metrics.isLegStable && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500/90 text-white px-6 py-4 rounded-xl animate-bounce z-20 shadow-xl text-center">
                            <div className="text-2xl mb-1">🛑</div>
                            <div className="font-bold text-lg">RODILLA QUIETA</div>
                        </div>
                    )}

                    {/* Indicador de Ángulo */}
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Dorsiflexión</div>
                        <div className={`text-2xl font-mono font-bold ${metrics.ankleAngle <= TARGET_DORSIFLEX ? 'text-green-600' : 'text-indigo-600'}`}>
                            {metrics.ankleAngle}°
                        </div>
                        <div className="text-[10px] text-slate-400">Meta: &lt;75°</div>
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
                            {stage === 'hold' ? 'SOSTENIENDO' : stage === 'lifting' ? 'SUBIENDO' : 'RELAJADO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🦵' : feedback.includes('✅') ? '✨' : '👣'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Feedback</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Gráfico de Pie */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Rango de Movimiento</h4>
                    <div className="relative w-32 h-32 bg-slate-50 rounded-full border border-slate-200 overflow-hidden">
                        {/* Pie estático (Fondo) */}
                        <div className="absolute bottom-0 left-8 w-16 h-4 bg-slate-300 rounded"></div>
                        <div className="absolute bottom-0 left-8 w-4 h-16 bg-slate-300 rounded"></div>
                        
                        {/* Pie Dinámico (Aguja) */}
                        <div className="absolute bottom-2 left-10 w-20 h-2 bg-indigo-500 origin-left transition-transform duration-200"
                             style={{ transform: `rotate(-${Math.max(0, 95 - metrics.ankleAngle)}deg)` }}>
                             <div className="absolute right-0 -top-1 w-4 h-4 bg-indigo-600 rounded-full"></div>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-400">Levanta la punta</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}