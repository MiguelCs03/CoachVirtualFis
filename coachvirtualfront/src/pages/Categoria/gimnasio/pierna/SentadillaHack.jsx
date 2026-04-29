import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Sentadilla Hack (Machine Hack Squat)
 * Lógica Biomecánica:
 * 1. Profundidad: El ángulo de rodilla (Cadera-Rodilla-Tobillo) debe bajar de ~95°.
 * 2. Seguridad (Anti-Lockout): Al subir, NO se debe llegar a 180° (bloqueo articular).
 * Se recomienda mantener "Soft Knees" (~170°).
 */
export default function SentadillaHack() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'descending', 'deep', 'ascending'
  const [feedback, setFeedback] = useState('Colócate en la máquina');
  const [currentAngles, setCurrentAngles] = useState({
    kneeAngle: 180,    // Promedio de flexión
    symmetryDiff: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const lockoutWarnRef = useRef(false);

  // --- UMBRALES ---
  const STANDING_THRESHOLD = 160; // Piernas estiradas (Inicio)
  const DEEP_THRESHOLD = 95;      // Profundidad válida (Paralelo o más)
  
  // Seguridad: Bloqueo de rodillas
  const KNEE_LOCK_DANGER = 176;   // Ángulo peligroso bajo carga

  const HOLD_MS = 200;
  const MIN_INTERVAL_MS = 1500;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightKnee, leftKnee } = angles; // Ángulo Cadera-Rodilla-Tobillo

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const avgKnee = Math.round(updateHistory(kneeHistoryRef, (rightKnee + leftKnee) / 2));
    const symmetryDiff = Math.abs(rightKnee - leftKnee);

    setCurrentAngles({
        kneeAngle: avgKnee,
        symmetryDiff
    });

    // 2. Detector de Bloqueo (Seguridad Crítica)
    if (avgKnee > KNEE_LOCK_DANGER) {
        if (!lockoutWarnRef.current) {
            setFeedback('⚠️ ¡NO BLOQUEES LAS RODILLAS!');
            speak('No estires del todo');
            lockoutWarnRef.current = true;
        }
    } else {
        lockoutWarnRef.current = false;
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'up' || stage === 'ascending') {
        // Iniciar bajada
        if (avgKnee < STANDING_THRESHOLD - 10) {
            setStage('descending');
            setFeedback('Baja controlado...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'descending') {
        // Detectar profundidad
        if (avgKnee < DEEP_THRESHOLD) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('deep');
                setFeedback('🔥 ¡Empuja con los talones!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'deep') {
        // Iniciar subida
        if (avgKnee > DEEP_THRESHOLD + 10) {
            setStage('ascending');
            setFeedback('Subiendo...');
        }
    }
    else if (stage === 'ascending') {
        // Llegar arriba (Sin bloquear necesariamente)
        if (avgKnee > STANDING_THRESHOLD) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                 if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
                    const newCount = repCount + 1;
                    setRepCount(newCount);
                    setFeedback(`✅ Repetición ${newCount}`);
                    speak(newCount.toString());
                    lastRepTimeRef.current = now;
                }
                setStage('up');
                holdStartRef.current = null;
            }
        }
    }
  };

  // Visualización Esqueleto
  const highlightedAngles = useMemo(() => {
    const safeKnees = currentAngles.kneeAngle <= KNEE_LOCK_DANGER;
    return [
      { indices: [24, 26, 28], angle: currentAngles.kneeAngle, isValid: safeKnees }, // Rodilla Der
      { indices: [23, 25, 27], angle: currentAngles.kneeAngle, isValid: safeKnees }, // Rodilla Izq
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Sentadilla Hack</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA monitorizará la profundidad de tus piernas y te avisará si bloqueas las rodillas (peligroso).</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Sentadilla Hack'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🏋️‍♀️</span>
                </div>
              )}
              <div className="absolute bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow animate-pulse">
                  ⚠️ NO BLOQUEAR RODILLAS
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Apoya toda la espalda en el respaldo.</li>
                <li>Baja hasta romper el paralelo (90°).</li>
                <li>Al subir, deja las rodillas un poco flexionadas ("Soft Knees").</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Iniciar rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA RUTINA ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">🏋️‍♀️ Sentadilla Hack IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Alerta de Bloqueo */}
              {currentAngles.kneeAngle > KNEE_LOCK_DANGER && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 pointer-events-none">
                      <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce text-center">
                          <div className="text-3xl">🛑</div>
                          <div className="font-black text-xl">¡NO BLOQUEES!</div>
                      </div>
                  </div>
              )}
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <div className="flex justify-around items-center text-center">
                   <div>
                       <span className="text-xs text-gray-500 uppercase">Profundidad</span>
                       <div className={`text-2xl font-bold ${stage === 'deep' ? 'text-green-600' : 'text-indigo-600'}`}>
                           {currentAngles.kneeAngle}°
                       </div>
                       <div className="text-xs text-gray-400">Meta: &lt;95°</div>
                   </div>
                   <div className="h-10 w-px bg-gray-200"></div>
                   <div>
                       <span className="text-xs text-gray-500 uppercase">Simetría</span>
                       <div className={`text-2xl font-bold ${currentAngles.symmetryDiff > 15 ? 'text-yellow-500' : 'text-green-600'}`}>
                           {currentAngles.symmetryDiff}°
                       </div>
                   </div>
               </div>
            </div>
          </div>

          {/* PANEL DERECHO */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
                <div className="mt-4 flex justify-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                        ${stage === 'deep' ? 'bg-green-500' : 'bg-gray-300'}`}>
                        PROFUNDO
                    </span>
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>

            {/* Visualizador de Recorrido */}
            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Monitor de Recorrido</h3>
                <div className="relative pt-6 pb-2">
                    {/* Barra de rango (180 a 90) */}
                    <div className="h-4 bg-gray-200 rounded-full w-full overflow-hidden flex">
                        <div className="h-full w-[20%] bg-red-300"></div> {/* Bloqueo */}
                        <div className="h-full w-[50%] bg-gray-300"></div> {/* Transición */}
                        <div className="h-full w-[30%] bg-green-300"></div> {/* Zona Profunda */}
                    </div>
                    
                    {/* Indicador */}
                    <div className="absolute top-4 transition-all duration-200 transform -translate-x-1/2"
                         style={{ left: `${Math.min(100, Math.max(0, ((currentAngles.kneeAngle - 80) / 100) * 100))}%` }}>
                        <div className="w-4 h-8 bg-indigo-600 border-2 border-white rounded shadow-lg"></div>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 mt-2">
                        <span>90° (Abajo)</span>
                        <span>180° (Arriba)</span>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}