import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Piernas (Leg Raises)
 * Lógica Biomecánica:
 * 1. Fase de Movimiento: Detectar el ángulo Hombro-Cadera-Rodilla.
 * - Abajo (Inicio): ~170-180°
 * - Arriba (Contracción): ~90-100°
 * 2. Control de Calidad: Las rodillas deben estar extendidas (>150°). 
 * Si se doblan, se invalida la repetición o se lanza advertencia.
 */
export default function ElevacionPiernasSuelo() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down'); // 'down', 'up_moving', 'top_hold', 'down_moving'
  const [feedback, setFeedback] = useState('Acuéstate y estira las piernas');
  const [currentAngles, setCurrentAngles] = useState({
    hipAngle: 180,    // Ángulo del movimiento (Torso vs Piernas)
    kneeAngle: 180,   // Ángulo de forma (Debe estar recto)
    isKneeStraight: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const hipHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const kneeErrorRef = useRef(false);

  // --- UMBRALES ---
  // Cadera (Movimiento principal)
  const UP_THRESHOLD = 100;    // Piernas arriba (ángulo L)
  const DOWN_THRESHOLD = 165;  // Piernas abajo (casi tocando suelo)
  
  // Rodillas (Validación de forma)
  const MIN_KNEE_EXTENSION = 140; // Si baja de esto, está doblando mucho las rodillas

  const HOLD_MS = 300;
  const MIN_INTERVAL_MS = 1500;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightHip, leftHip, rightKnee, leftKnee } = angles; // Hombro-Cadera-Rodilla y Cadera-Rodilla-Tobillo

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const avgHip = Math.round(updateHistory(hipHistoryRef, (rightHip + leftHip) / 2));
    const avgKnee = Math.round((rightKnee + leftKnee) / 2);
    
    const isKneeStraight = avgKnee > MIN_KNEE_EXTENSION;

    setCurrentAngles({
        hipAngle: avgHip,
        kneeAngle: avgKnee,
        isKneeStraight
    });

    // 2. Validación de Rodillas (Anti-Cheat)
    if (!isKneeStraight) {
        if (!kneeErrorRef.current) {
            setFeedback('⚠️ ¡Estira las piernas! No dobles rodillas.');
            speak('Piernas rectas');
            kneeErrorRef.current = true;
        }
        // Podríamos retornar aquí para pausar, o dejar que continúe pero con advertencia
    } else {
        if (kneeErrorRef.current) {
            kneeErrorRef.current = false;
            setFeedback('✅ Buena forma');
        }
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'down' || stage === 'down_moving') {
        // Detectar subida
        if (avgHip < DOWN_THRESHOLD - 10) {
            setStage('up_moving');
            setFeedback('Sube las piernas...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'up_moving') {
        // Detectar tope arriba
        if (avgHip < UP_THRESHOLD) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('top_hold');
                setFeedback('🛑 Controla arriba');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'top_hold') {
        // Iniciar bajada
        if (avgHip > UP_THRESHOLD + 10) {
            setStage('down_moving');
            setFeedback('Baja lento sin tocar el suelo...');
        }
    }
    else if (stage === 'down_moving') {
        // Detectar final abajo
        if (avgHip > DOWN_THRESHOLD) {
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
                setStage('down');
                holdStartRef.current = null;
            }
        }
        // Si vuelve a subir antes de tiempo (rebote incompleto)
        else if (avgHip < UP_THRESHOLD + 20) {
             // Opcional: lógica de repetición fallida
        }
    }
  };

  // Helpers visuales
  const getKneeColor = () => currentAngles.isKneeStraight ? 'text-green-600' : 'text-red-600';

  // Visualización Esqueleto
  const highlightedAngles = useMemo(() => {
    const kneesOk = currentAngles.isKneeStraight;
    return [
      { indices: [12, 24, 26], angle: currentAngles.hipAngle, isValid: true }, // Cadera (Movimiento)
      { indices: [24, 26, 28], angle: currentAngles.kneeAngle, isValid: kneesOk }, // Rodilla (Forma)
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Elevación de piernas en el suelo</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA vigilará que subas las piernas hasta 90° manteniendo las <strong>rodillas estiradas</strong>.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Elevación Piernas'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🦵</span>
                </div>
              )}
               <div className="absolute bottom-4 right-4 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold shadow">
                  Vista: PERFIL (Acostado) 📸
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Acuéstate boca arriba, manos bajo glúteos para soporte.</li>
                <li>Mantén las piernas rectas durante todo el recorrido.</li>
                <li>Sube hasta formar una "L" (90°) y baja sin tocar el suelo.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🦵 Elevación Piernas IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Overlay Rodillas */}
              {!currentAngles.isKneeStraight && (
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl animate-bounce z-20 shadow-lg">
                       <div className="text-xl font-bold text-center">⚠️ RODILLAS</div>
                       <div className="text-sm text-center">¡Estíralas!</div>
                   </div>
              )}
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-gray-50 rounded border border-gray-100 text-center">
                       <div className="text-xs text-gray-500 mb-1">Ángulo Elevación</div>
                       <div className="text-2xl font-bold text-indigo-600">{currentAngles.hipAngle}°</div>
                       <div className="text-xs text-gray-400">Meta: 90°</div>
                   </div>
                   <div className="p-3 bg-gray-50 rounded border border-gray-100 text-center">
                       <div className="text-xs text-gray-500 mb-1">Rectitud Rodillas</div>
                       <div className={`text-2xl font-bold ${getKneeColor()}`}>{currentAngles.kneeAngle}°</div>
                       <div className="text-xs text-gray-400">Meta: &gt;140°</div>
                   </div>
               </div>
            </div>
          </div>

          {/* PANEL DERECHO */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
                <div className={`mt-4 px-3 py-1 rounded-full text-xs font-bold inline-block
                    ${stage === 'top_hold' ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    {stage === 'top_hold' ? '⬆️ ARRIBA' : stage === 'down' ? '⬇️ ABAJO' : 'MOVIMIENTO'}
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('✅') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium">{feedback}</p>
            </div>

            {/* Visualizador de Altura */}
            <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center">
                 <h3 className="font-bold text-gray-700 mb-2 text-sm">Altura de Piernas</h3>
                 <div className="relative h-40 w-12 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                     {/* Zonas */}
                     <div className="absolute bottom-0 w-full h-[10%] bg-blue-200 opacity-50"></div> {/* Suelo */}
                     <div className="absolute top-0 w-full h-[20%] bg-green-200 opacity-50"></div> {/* Meta */}
                     
                     {/* Indicador Piernas */}
                     <div className="absolute bottom-0 w-full bg-indigo-500 transition-all duration-300 rounded-t-lg"
                          style={{ 
                              height: `${Math.max(0, Math.min(100, 100 - ((currentAngles.hipAngle - 90) / 90 * 100)))}%`
                          }}>
                     </div>
                 </div>
                 <div className="mt-2 text-xs text-gray-400 text-center">
                     Sube hasta la zona verde
                 </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}