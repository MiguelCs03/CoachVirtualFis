import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Talones Sentado (Soleus Raise)
 * Enfoque Clínico:
 * 1. Flexión de Rodilla: Mantener rodilla a 90° para aislar el sóleo.
 * 2. Rango de Tobillo: Medir el ángulo Rodilla-Tobillo-Puntera.
 * 3. Tiempo Bajo Tensión: Fases lentas sin rebote.
 */
export default function ElevacionTalonesSentado() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación de talones sentado';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down'); // 'down', 'lifting', 'peak_hold', 'lowering'
  const [feedback, setFeedback] = useState('Siéntate de perfil, pies planos');
  const [metrics, setMetrics] = useState({
    ankleAngle: 90,     // Ángulo del tobillo
    kneeAngle: 90,      // Ángulo de rodilla (Debe ser ~90)
    isKneeCorrect: true // Check de aislamiento
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const ankleHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const kneeWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const FLAT_ANGLE = 95;       // Pie en el suelo
  const TARGET_PLANTAR = 135;  // Talón arriba (Punteras)
  
  // Rodilla (Aislamiento de Sóleo)
  const KNEE_TARGET = 90;
  const KNEE_TOLERANCE = 15;   // 75° a 105° permitido

  const HOLD_TIME_MS = 1500;   // Pausa isométrica arriba
  const SMOOTH_WINDOW = 6;

  // Cálculo manual de ángulo de tobillo para precisión lateral
  const calculateAnkleAngle = (knee, ankle, toe) => {
      if (!knee || !ankle || !toe) return 90;
      const v1 = { x: knee.x - ankle.x, y: knee.y - ankle.y };
      const v2 = { x: toe.x - ankle.x, y: toe.y - ankle.y };
      
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      const angleRad = Math.acos(dot / (mag1 * mag2));
      return Math.round(angleRad * (180 / Math.PI));
  };

  const handlePoseDetected = (landmarks) => {
    // Usamos el lado visible (perfil), por defecto el derecho
    // 26: Rodilla, 28: Tobillo, 32: Puntera
    const knee = landmarks[26];
    const ankle = landmarks[28];
    const toe = landmarks[32];
    const hip = landmarks[24];

    if (!knee || !ankle || !toe || !hip) return;

    // 1. Calcular Ángulos
    const rawAnkle = calculateAnkleAngle(knee, ankle, toe);
    const rawKnee = calculateAnkleAngle(hip, knee, ankle); // Reusamos función para ángulo rodilla (Cadera-Rodilla-Tobillo)

    // 2. Suavizado
    const updateHistory = (val) => {
        ankleHistoryRef.current.push(val);
        if (ankleHistoryRef.current.length > SMOOTH_WINDOW) ankleHistoryRef.current.shift();
        return ankleHistoryRef.current.reduce((a, b) => a + b, 0) / ankleHistoryRef.current.length;
    };
    const smoothAnkle = Math.round(updateHistory(rawAnkle));
    const smoothKnee = Math.round(rawKnee);

    // 3. Chequeo de Aislamiento (Rodilla a 90°)
    const isKneeCorrect = Math.abs(smoothKnee - KNEE_TARGET) < KNEE_TOLERANCE;

    // Feedback de Postura
    if (!isKneeCorrect) {
        if (!kneeWarnRef.current) {
            setFeedback('⚠️ Ajusta la silla: Rodillas a 90°.');
            speak('Ajusta rodillas');
            kneeWarnRef.current = true;
        }
    } else {
        kneeWarnRef.current = false;
    }

    setMetrics({
        ankleAngle: smoothAnkle,
        kneeAngle: smoothKnee,
        isKneeCorrect
    });

    if (!isKneeCorrect) return; // No contamos si la postura es mala

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'down' || stage === 'lowering') {
        // Iniciar subida (Flexión Plantar = Ángulo Aumenta)
        if (smoothAnkle > FLAT_ANGLE + 10) {
            setStage('lifting');
            setFeedback('Sube los talones lentamente...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lifting') {
        // Llegar al pico
        if (smoothAnkle >= TARGET_PLANTAR) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('peak_hold');
                 setFeedback('⛰️ Máxima altura... Sostén.');
                 speak('Sostén');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'peak_hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 1000) {
            setStage('lowering');
            setFeedback('Baja sin golpear el suelo.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta al suelo
        if (smoothAnkle < FLAT_ANGLE + 5) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición lista.');
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
                <div className="text-7xl">🦶</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Fortalecimiento de Sóleo
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Siéntate en una silla con los pies planos en el suelo.</li>
                <li>Tus rodillas deben formar un ángulo recto (90°).</li>
                <li>Levanta los talones lo más alto posible manteniendo los dedos en el suelo.</li>
                <li>Haz una pausa arriba para evitar el rebote.</li>
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Tobillo</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Rodilla Incorrecta */}
                    {!metrics.isKneeCorrect && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-amber-500/90 text-white px-6 py-4 rounded-xl animate-bounce z-20 shadow-xl text-center">
                            <div className="text-2xl mb-1">📐</div>
                            <div className="font-bold text-lg">RODILLA A 90°</div>
                            <div className="text-xs">Actual: {metrics.kneeAngle}°</div>
                        </div>
                    )}

                    {/* Indicador de Ángulo Tobillo */}
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Flexión Plantar</div>
                        <div className={`text-2xl font-mono font-bold ${metrics.ankleAngle >= TARGET_PLANTAR ? 'text-green-600' : 'text-indigo-600'}`}>
                            {metrics.ankleAngle}°
                        </div>
                        <div className="text-[10px] text-slate-400">Meta: &gt;135°</div>
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
                            ${stage === 'peak_hold' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'peak_hold' ? 'SOSTENIENDO' : stage === 'lifting' ? 'SUBIENDO' : 'BAJANDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🪑' : feedback.includes('✅') ? '✨' : '🦶'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Feedback</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Gráfico de Elevación */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Altura de Talón</h4>
                    <div className="relative w-16 h-32 bg-slate-100 rounded-b-lg border-t-4 border-slate-300 flex items-end justify-center">
                        {/* Talón */}
                        <div className="w-12 bg-indigo-500 rounded-sm transition-all duration-200 ease-out shadow-sm"
                             style={{ 
                                 height: '12px',
                                 marginBottom: `${Math.max(0, (metrics.ankleAngle - 90) * 1.5)}px` 
                             }}>
                        </div>
                        {/* Suelo */}
                        <div className="absolute bottom-0 w-full h-1 bg-slate-400"></div>
                    </div>
                    <p className="text-xs mt-2 text-slate-400 text-center">Eleva el bloque azul</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}