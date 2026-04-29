import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Piernas (Leg Raises) - Enfoque Clínico
 * Objetivos:
 * 1. Fortalecimiento de Core sin compromiso lumbar.
 * 2. Control de Rodillas: Mantener extensión completa (>160°).
 * 3. Fase Excéntrica: Bajada lenta para evitar arqueo lumbar.
 */
export default function ElevacionPiernas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación de piernas';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down'); // 'down', 'up', 'hold', 'lowering'
  const [feedback, setFeedback] = useState('Espalda pegada al suelo, piernas rectas');
  const [metrics, setMetrics] = useState({
    hipAngle: 180,      // Ángulo Tronco-Piernas
    kneeStraightness: 180, // Ángulo de rodilla
    isSafe: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const hipHistoryRef = useRef([]);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const kneeWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const START_ANGLE = 160; // Piernas abajo
  const TARGET_ANGLE = 100; // Meta: ~90 grados (Vertical)
  
  // Seguridad: Rodillas deben estar rectas
  const MIN_KNEE_EXTENSION = 150; 

  const HOLD_TIME_MS = 1000; // Pausa breve arriba
  const SMOOTH_WINDOW = 6;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // Usamos el promedio de ambas piernas para evaluar el movimiento global
    const rawHip = (angles.rightHip + angles.leftHip) / 2;
    const rawKnee = (angles.rightKnee + angles.leftKnee) / 2;

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothHip = Math.round(updateHistory(hipHistoryRef, rawHip));
    const smoothKnee = Math.round(updateHistory(kneeHistoryRef, rawKnee));

    // 2. Chequeo de Rodillas (Forma)
    let isSafe = true;
    if (smoothKnee < MIN_KNEE_EXTENSION) {
        isSafe = false;
        if (!kneeWarnRef.current) {
            setFeedback('⚠️ ¡Estira las rodillas! No las dobles.');
            speak('Piernas rectas');
            kneeWarnRef.current = true;
        }
    } else {
        if (kneeWarnRef.current) {
            kneeWarnRef.current = false;
            setFeedback('✅ Buena extensión.');
        }
    }

    setMetrics({
        hipAngle: smoothHip,
        kneeStraightness: smoothKnee,
        isSafe
    });

    // Si la forma es mala, no avanzamos lógica de reps
    if (!isSafe) return;

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'down' || stage === 'lowering') {
        // Iniciar subida
        if (smoothHip < START_ANGLE - 10) {
            setStage('up');
            setFeedback('Sube sin despegar la espalda baja...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'up') {
        // Llegar a la vertical (o 90 grados)
        if (smoothHip <= TARGET_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('⚓ Controla arriba...');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 500) {
            setStage('lowering');
            setFeedback('Baja MUY lento (control abdominal).');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta abajo
        if (smoothHip > START_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición correcta.');
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
                <div className="text-7xl">🦵⬆️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Fortalecimiento Abdominal
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Túmbate boca arriba, manos a los lados o bajo los glúteos para soporte lumbar.</li>
                <li>Mantén las piernas totalmente rectas (bloquea rodillas).</li>
                <li>Sube hasta formar una "L" (90°).</li>
                <li><strong>Clave:</strong> Al bajar, no permitas que se haga un hueco en tu espalda baja.</li>
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Control de Core</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Rodillas Dobladas */}
                    {!metrics.isSafe && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 pointer-events-none animate-pulse">
                            <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg border-2 border-white">
                                🦵 ESTIRA LAS PIERNAS
                            </div>
                        </div>
                    )}

                    {/* Indicador de Altura */}
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm text-right">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Ángulo Elevación</div>
                        <div className={`text-2xl font-mono font-bold ${metrics.hipAngle <= TARGET_ANGLE ? 'text-green-600' : 'text-indigo-600'}`}>
                            {metrics.hipAngle}°
                        </div>
                        <div className="text-[10px] text-slate-400">Meta: 90°</div>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'lowering' ? 'bg-blue-500' : 'bg-slate-300 text-slate-600'}`}>
                            {stage === 'lowering' ? 'CONTROLA BAJADA' : stage === 'up' ? 'SUBIENDO' : 'PREPARADO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '📏' : feedback.includes('✅') ? '🔥' : '🗣️'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Feedback</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Gráfico de Elevación */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Trayectoria</h4>
                    <div className="relative w-12 h-32 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        {/* Zona Meta (Arriba) */}
                        <div className="absolute top-0 w-full h-[20%] bg-green-100 border-b border-green-300"></div>
                        
                        {/* Indicador de Pierna */}
                        <div className="absolute bottom-0 w-full bg-indigo-500 transition-all duration-200 ease-out rounded-t-full"
                             style={{ height: `${Math.min(100, Math.max(0, ((180 - metrics.hipAngle) / 90) * 100))}%` }}>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-400 text-center">Sube hasta la zona verde</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}