import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Prensa de Piernas (Leg Press)
 * Lógica Biomecánica:
 * 1. Seguridad Crítica: Detección de Bloqueo de Rodilla (Knee Lockout).
 * - Nunca llegar a 180° bajo carga. Mantener "Soft Knees" (~170°).
 * 2. Rango de Movimiento (ROM):
 * - Inicio: Piernas extendidas (pero no bloqueadas).
 * - Fondo: Rodillas cerca del pecho (<90°).
 */
export default function PrensaPiernas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'lowering', 'deep', 'pushing'
  const [feedback, setFeedback] = useState('Coloca los pies en la plataforma');
  const [currentAngles, setCurrentAngles] = useState({
    kneeAngle: 170,   // Promedio de ambas rodillas
    symmetryDiff: 0,  // Diferencia entre izq/der
    isLocked: false   // Estado de peligro
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const lockWarnRef = useRef(false);

  // --- UMBRALES ---
  const EXTENDED_SAFE = 165;  // Punto alto seguro (Soft knees)
  const LOCKOUT_DANGER = 176; // PELIGRO: Hiperextensión
  const DEEP_THRESHOLD = 90;  // Profundidad óptima
  
  const HOLD_MS = 200;
  const MIN_INTERVAL_MS = 1500;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightKnee, leftKnee } = angles;

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const avgKnee = Math.round(updateHistory(kneeHistoryRef, (rightKnee + leftKnee) / 2));
    const symmetryDiff = Math.abs(rightKnee - leftKnee);
    const isLocked = avgKnee >= LOCKOUT_DANGER;

    setCurrentAngles({
        kneeAngle: avgKnee,
        symmetryDiff,
        isLocked
    });

    // 2. Detector de Seguridad (Anti-Lockout)
    if (isLocked) {
        if (!lockWarnRef.current) {
            setFeedback('🛑 ¡NO BLOQUEES! Flexiona un poco.');
            speak('No estires del todo');
            lockWarnRef.current = true;
        }
    } else {
        lockWarnRef.current = false;
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'up' || stage === 'pushing') {
        // Iniciar bajada
        if (avgKnee < EXTENDED_SAFE - 10) {
            setStage('lowering');
            setFeedback('Baja las rodillas al pecho...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Llegar al fondo
        if (avgKnee < DEEP_THRESHOLD) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('deep');
                setFeedback('🔥 ¡Empuja fuerte!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'deep') {
        // Iniciar subida
        if (avgKnee > DEEP_THRESHOLD + 10) {
            setStage('pushing');
            setFeedback('Subiendo...');
        }
    }
    else if (stage === 'pushing') {
        // Llegar arriba (Sin bloquear)
        // Consideramos repetición válida si pasa de 155° (no hace falta llegar al bloqueo)
        if (avgKnee > EXTENDED_SAFE - 10) { 
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
    const safety = !currentAngles.isLocked;
    return [
      { indices: [24, 26, 28], angle: currentAngles.kneeAngle, isValid: safety }, // Rodilla Der
      { indices: [23, 25, 27], angle: currentAngles.kneeAngle, isValid: safety }, // Rodilla Izq
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Prensa de Piernas</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA controlará que bajes lo suficiente y evitará que <strong>bloquees las rodillas</strong> al subir.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Prensa'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🦵</span>
                </div>
              )}
              <div className="absolute bottom-4 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold animate-pulse shadow-lg">
                 ⚠️ PRECAUCIÓN: No estires las piernas al 100%
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Coloca los pies a la anchura de los hombros.</li>
                <li>Baja hasta que las rodillas formen 90°.</li>
                <li>Al empujar, deja una pequeña flexión en la rodilla ("Soft Knees").</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🦵 Prensa Piernas IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Alerta de Bloqueo */}
              {currentAngles.isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/40 pointer-events-none z-20">
                      <div className="bg-red-600 text-white px-8 py-6 rounded-2xl shadow-2xl animate-bounce text-center border-4 border-white">
                          <span className="text-4xl block mb-2">🛑</span>
                          <span className="font-black text-2xl block">¡RODILLAS BLOQUEADAS!</span>
                          <span className="text-sm">Flexiona inmediatamente</span>
                      </div>
                  </div>
              )}
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <div className="flex justify-around items-center text-center">
                   <div className="flex flex-col items-center">
                       <span className="text-xs text-gray-500 uppercase">Ángulo Rodilla</span>
                       <div className={`text-3xl font-bold ${currentAngles.isLocked ? 'text-red-600' : 'text-indigo-600'}`}>
                           {currentAngles.kneeAngle}°
                       </div>
                       <div className="text-[10px] text-gray-400 mt-1">
                           {currentAngles.isLocked ? 'PELIGRO' : 'Seguro'}
                       </div>
                   </div>
                   
                   <div className="h-12 w-px bg-gray-200"></div>

                   <div className="flex flex-col items-center">
                       <span className="text-xs text-gray-500 uppercase">Simetría</span>
                       <div className={`text-2xl font-bold ${currentAngles.symmetryDiff > 15 ? 'text-yellow-500' : 'text-green-600'}`}>
                           {currentAngles.symmetryDiff}°
                       </div>
                       <div className="text-[10px] text-gray-400 mt-1">Dif. L/R</div>
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
                        ${stage === 'deep' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}>
                        PROFUNDO
                    </span>
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('🛑') ? 'bg-red-100 border-red-600 text-red-800' : 
                  feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium text-center flex items-center justify-center gap-2">
                    {feedback.includes('🛑') && <span>⚠️</span>}
                    {feedback}
                </p>
            </div>

            {/* Monitor de Seguridad (Barra de Rango) */}
            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Monitor de Seguridad</h3>
                <div className="relative pt-6 pb-2">
                    {/* Barra de rango inverso (90 a 180) */}
                    <div className="h-6 bg-gray-200 rounded-full w-full overflow-hidden flex relative">
                        <div className="h-full w-[40%] bg-green-200 flex items-center justify-center text-[9px] text-green-800 font-bold">ZONA TRABAJO</div> 
                        <div className="h-full w-[40%] bg-yellow-100 flex items-center justify-center text-[9px] text-yellow-700">TRANSICIÓN</div>
                        <div className="h-full w-[20%] bg-red-400 flex items-center justify-center text-[9px] text-white font-bold animate-pulse">PELIGRO</div>
                    </div>
                    
                    {/* Indicador */}
                    <div className="absolute top-4 transition-all duration-100 transform -translate-x-1/2 z-10"
                         style={{ left: `${Math.min(100, Math.max(0, ((currentAngles.kneeAngle - 90) / 90) * 100))}%` }}>
                        <div className={`w-2 h-10 rounded border-2 border-white shadow-lg ${currentAngles.isLocked ? 'bg-red-600' : 'bg-indigo-600'}`}></div>
                    </div>

                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 px-1">
                        <span>90° (Fondo)</span>
                        <span className="text-red-500 font-bold">180° (Bloqueo)</span>
                    </div>
                </div>
                <p className="text-xs text-center mt-3 text-gray-500 italic">
                    Mantén el indicador fuera de la zona roja.
                </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}