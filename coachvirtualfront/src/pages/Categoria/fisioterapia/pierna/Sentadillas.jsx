import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Sentadillas (Standard Squat)
 * Enfoque Clínico:
 * 1. Control de Tronco: Evitar flexión excesiva del tronco (Chest Drop).
 * 2. Profundidad: Alcanzar 90° de flexión de rodilla.
 * 3. Ritmo: Descenso controlado (no dejarse caer).
 */
export default function Sentadillas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Sentadillas';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('stand'); // 'stand', 'descending', 'deep', 'ascending'
  const [feedback, setFeedback] = useState('Pies al ancho de hombros');
  const [metrics, setMetrics] = useState({
    kneeFlexion: 180,   // Profundidad
    torsoLean: 0,       // Inclinación del tronco (0 = vertical)
    isPostureCorrect: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const historyRef = useRef([]);
  const holdStartRef = useRef(null);
  const postureWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const STANDING_ANGLE = 165;   // Piernas extendidas
  const DEPTH_TARGET = 95;      // Meta: Romper el paralelo o llegar a 90
  
  // Ángulo de inclinación del tronco (Vertical vs Vector Hombro-Cadera)
  // > 45 grados de inclinación hacia adelante suele ser excesivo para principiantes/rehab
  const MAX_TORSO_LEAN = 45; 

  const HOLD_TIME_MS = 500;     // Breve pausa abajo
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Profundidad (Promedio rodillas)
    const rawKnee = (angles.rightKnee + angles.leftKnee) / 2;

    // 2. Inclinación del Tronco (Vista Lateral)
    // Usamos el lado derecho por defecto, o el más visible.
    // Calculamos el ángulo del vector (Cadera -> Hombro) respecto a la vertical (Y)
    const hip = landmarks[24];      // Cadera Der
    const shoulder = landmarks[12]; // Hombro Der
    
    let rawLean = 0;
    if (hip && shoulder) {
        // dy es diferencia vertical, dx horizontal
        const dy = hip.y - shoulder.y; 
        const dx = Math.abs(hip.x - shoulder.x);
        // atan2(dx, dy) nos da el ángulo respecto a la vertical
        const radians = Math.atan2(dx, dy); 
        rawLean = radians * (180 / Math.PI);
    }

    // 3. Suavizado
    const updateHistory = (k, t) => {
        historyRef.current.push({ k, t });
        if (historyRef.current.length > SMOOTH_WINDOW) historyRef.current.shift();
        const avgK = historyRef.current.reduce((a, b) => a + b.k, 0) / historyRef.current.length;
        const avgT = historyRef.current.reduce((a, b) => a + b.t, 0) / historyRef.current.length;
        return { avgK, avgT };
    };
    
    const { avgK, avgT } = updateHistory(rawKnee, rawLean);
    const smoothKnee = Math.round(avgK);
    const smoothLean = Math.round(avgT);

    // 4. Validación Postural (Pecho arriba)
    let isPostureCorrect = true;
    if (smoothLean > MAX_TORSO_LEAN) {
        isPostureCorrect = false;
        if (!postureWarnRef.current) {
            setFeedback('⚠️ ¡Pecho arriba! No te inclines tanto.');
            speak('Levanta el pecho');
            postureWarnRef.current = true;
        }
    } else {
        if (postureWarnRef.current) {
            postureWarnRef.current = false;
            setFeedback('✅ Buena postura de espalda.');
        }
    }

    setMetrics({
        kneeFlexion: smoothKnee,
        torsoLean: smoothLean,
        isPostureCorrect
    });

    // 5. Máquina de Estados
    const now = Date.now();

    if (stage === 'stand' || stage === 'ascending') {
        // Iniciar bajada
        if (smoothKnee < STANDING_ANGLE - 10) {
            setStage('descending');
            setFeedback('Baja la cadera como sentándote en una silla...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'descending') {
        // Llegar al fondo
        if (smoothKnee <= DEPTH_TARGET) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('deep');
                 setFeedback('🔥 ¡Arriba fuerte!');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'deep') {
        // Iniciar subida
        if (smoothKnee > DEPTH_TARGET + 10) {
            setStage('ascending');
            setFeedback('Sube extendiendo caderas y rodillas.');
        }
    }
    else if (stage === 'ascending') {
        // Vuelta a estar de pie
        if (smoothKnee > STANDING_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 if (isPostureCorrect) { // Solo cuenta si la técnica fue buena
                     setRepCount(c => c + 1);
                     setFeedback('✅ Repetición válida.');
                     speak((repCount + 1).toString());
                 } else {
                     setFeedback('❌ Repetición anulada: Demasiada inclinación.');
                 }
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
            <div className="h-64 bg-blue-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">🏋️‍♀️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Patrón Funcional Básico
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Puntos Clave:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Pies un poco más anchos que los hombros.</li>
                <li>Inicia el movimiento llevando la cadera atrás, no doblando rodillas primero.</li>
                <li><strong>Pecho Orgulloso:</strong> Mantén el torso lo más vertical posible.</li>
                <li>Baja hasta que tus muslos estén paralelos al suelo.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Comenzar Sesión
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Cadena Cerrada</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Postura */}
                    {!metrics.isPostureCorrect && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 pointer-events-none animate-pulse">
                            <div className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg border-2 border-white">
                                ⬆️ LEVANTA EL PECHO
                            </div>
                        </div>
                    )}

                    {/* Indicador de Profundidad */}
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Ángulo Rodilla</div>
                        <div className={`text-2xl font-mono font-bold ${metrics.kneeFlexion <= DEPTH_TARGET ? 'text-green-600' : 'text-indigo-600'}`}>
                            {metrics.kneeFlexion}°
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
                            ${stage === 'deep' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'deep' ? 'PARALELO' : stage === 'descending' ? 'BAJANDO' : 'SUBIENDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '📐' : feedback.includes('✅') ? '🎯' : '👟'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Corrección Técnica</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Gráfico de Profundidad */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Profundidad</h4>
                    <div className="relative w-full h-8 bg-slate-100 rounded-full overflow-hidden">
                        {/* Meta (90-100) */}
                        <div className="absolute left-0 h-full w-[50%] bg-green-200 border-r border-green-400"></div>
                        
                        {/* Indicador Dinámico */}
                        <div className={`absolute top-0 h-full w-2 bg-indigo-600 transition-all duration-100`}
                             style={{ 
                                 left: `${Math.max(0, Math.min(100, ((180 - metrics.kneeFlexion) / 90) * 100))}%` 
                             }}>
                        </div>
                    </div>
                    <div className="flex justify-between w-full text-[10px] text-slate-400 mt-1">
                        <span>Pie (180°)</span>
                        <span>Paralelo (90°)</span>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}