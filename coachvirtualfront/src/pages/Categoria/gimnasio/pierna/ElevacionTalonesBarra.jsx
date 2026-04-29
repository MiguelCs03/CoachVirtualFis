import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Talones (Calf Raise)
 * Lógica Biomecánica:
 * 1. Foco: Articulación del Tobillo (Rodilla-Tobillo-Puntera).
 * - Abajo (Dorsiflexión/Neutro): < 110°.
 * - Arriba (Flexión Plantar): > 135°.
 * 2. Control: Las rodillas deben estar extendidas (Bloqueadas o casi bloqueadas).
 * Si se doblan (< 160°), se considera trampa (impulso).
 */
export default function ElevacionTalonesBarra() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down'); // 'down', 'rising', 'peak_hold', 'lowering'
  const [feedback, setFeedback] = useState('Ponte de PERFIL a la cámara');
  const [currentAngles, setCurrentAngles] = useState({
    ankleAngle: 90,   // Ángulo del tobillo (Movimiento)
    kneeAngle: 180,   // Ángulo de rodilla (Estabilidad)
    isKneeStable: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const ankleHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const kneeErrorRef = useRef(false);

  // --- UMBRALES ---
  const UP_THRESHOLD = 135;    // Talón alto (Punteras)
  const DOWN_THRESHOLD = 110;  // Talón en suelo
  
  // Validación de rodillas (No hacer sentadilla)
  const KNEE_MIN_EXT = 160;    // Rodillas deben estar rectas

  const HOLD_MS = 300;         // Pausa arriba es crucial para gemelos
  const MIN_INTERVAL_MS = 1000;
  const SMOOTH_WINDOW = 5;

  // Función auxiliar para calcular ángulo específico del tobillo
  // (A veces poseUtils estándar no incluye el pie completo)
  const calculateAnkleAngle = (knee, ankle, footIndex) => {
      if (!knee || !ankle || !footIndex) return 90;
      const radians = Math.atan2(footIndex.y - ankle.y, footIndex.x - ankle.x) - 
                      Math.atan2(knee.y - ankle.y, knee.x - ankle.x);
      let angle = Math.abs(radians * 180.0 / Math.PI);
      if (angle > 180.0) angle = 360 - angle;
      return angle;
  };

  const handlePoseDetected = (landmarks) => {
    // Índices MediaPipe: 26(Rodilla Der), 28(Tobillo Der), 32(Puntera Der)
    // Usamos el lado derecho como primario, o el izquierdo si es más visible
    const rKnee = landmarks[26];
    const rAnkle = landmarks[28];
    const rToe = landmarks[32];
    
    // Si no detectamos pies, salimos
    if (!rKnee || !rAnkle || !rToe) return;

    // Calculamos ángulos manuales para mayor precisión en tobillo
    const rawAnkle = calculateAnkleAngle(rKnee, rAnkle, rToe);
    
    // Usamos poseUtils para la rodilla (más estándar)
    const bodyAngles = calculateBodyAngles(landmarks);
    const rawKnee = bodyAngles.rightKnee;

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothAnkle = Math.round(updateHistory(ankleHistoryRef, rawAnkle));
    const smoothKnee = Math.round(rawKnee);
    const isKneeStable = smoothKnee > KNEE_MIN_EXT;

    setCurrentAngles({
        ankleAngle: smoothAnkle,
        kneeAngle: smoothKnee,
        isKneeStable
    });

    // 2. Validación de Estabilidad (Rodillas)
    if (!isKneeStable) {
        if (!kneeErrorRef.current) {
            setFeedback('⚠️ ¡No dobles las rodillas!');
            speak('Mantén las piernas rectas');
            kneeErrorRef.current = true;
        }
    } else {
        if (kneeErrorRef.current) {
            kneeErrorRef.current = false;
            setFeedback('✅ Buena estabilidad');
        }
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'down' || stage === 'lowering') {
        // Iniciar subida
        if (smoothAnkle > DOWN_THRESHOLD + 10) {
            setStage('rising');
            setFeedback('Sube lo más alto posible...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'rising') {
        // Llegar al pico
        if (smoothAnkle > UP_THRESHOLD) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('peak_hold');
                setFeedback('🏔️ ¡Aguanta arriba!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'peak_hold') {
        // Iniciar bajada
        if (smoothAnkle < UP_THRESHOLD - 10) {
            setStage('lowering');
            setFeedback('Baja los talones lento...');
        }
    }
    else if (stage === 'lowering') {
        // Llegar al suelo
        if (smoothAnkle < DOWN_THRESHOLD) {
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
    }
  };

  // Visualización Esqueleto
  const highlightedAngles = useMemo(() => {
    const kneeOk = currentAngles.isKneeStable;
    return [
      { indices: [24, 26, 28], angle: currentAngles.kneeAngle, isValid: kneeOk }, // Rodilla
      { indices: [26, 28, 32], angle: currentAngles.ankleAngle, isValid: true },  // Tobillo (Puntera)
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Elevación de Talones</h1>
          <p className="text-gray-600 mb-6 text-lg">
            Para que la IA detecte correctamente este ejercicio, es <strong>fundamental</strong> que te coloques de <strong>PERFIL</strong> a la cámara.
          </p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Elevación Talones'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🦶</span>
                </div>
              )}
              <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-xs font-bold animate-pulse">
                  📸 CÁMARA LATERAL REQUERIDA
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Mantén las piernas rectas pero sin bloquear violentamente.</li>
                <li>Sube hasta quedarte de puntillas.</li>
                <li>Baja el talón hasta tocar el suelo suavemente.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🦶 Gemelos IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Overlay de Altura */}
              <div className="absolute bottom-4 right-4 bg-white/90 px-4 py-2 rounded-lg border border-indigo-100 shadow-lg">
                  <div className="text-xs text-gray-500 uppercase">Ángulo Tobillo</div>
                  <div className="text-2xl font-bold text-indigo-600">{currentAngles.ankleAngle}°</div>
                  <div className="text-[10px] text-gray-400">Meta: &gt;135°</div>
              </div>
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <div className="flex justify-between items-center">
                   <div className="flex-1 text-center">
                       <span className="text-xs text-gray-500 uppercase">Rodillas</span>
                       <div className={`text-xl font-bold ${currentAngles.isKneeStable ? 'text-green-600' : 'text-red-500'}`}>
                           {currentAngles.kneeAngle}°
                       </div>
                       <div className="text-xs">{currentAngles.isKneeStable ? '✅ Rectas' : '❌ Dobladas'}</div>
                   </div>
                   <div className="h-8 w-px bg-gray-200"></div>
                   <div className="flex-1 text-center">
                       <span className="text-xs text-gray-500 uppercase">Fase</span>
                       <div className="text-lg font-bold text-indigo-600 uppercase">
                           {stage.replace('_', ' ')}
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
                <div className="mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                        ${stage === 'peak_hold' ? 'bg-green-500 animate-pulse' : 'bg-blue-400'}`}>
                        {stage === 'peak_hold' ? '🏔️ CIMA' : 'TRABAJANDO'}
                    </span>
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('🏔️') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>

            {/* Visualizador Vertical de Talón */}
            <div className="bg-white rounded-lg shadow-xl p-6 flex flex-col items-center">
                <h3 className="font-bold text-gray-700 mb-2 text-sm">Elevación del Talón</h3>
                <div className="relative h-32 w-8 bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                    {/* Fondo suelo */}
                    <div className="absolute bottom-0 w-full h-[20%] bg-gray-300"></div>
                    {/* Meta Arriba */}
                    <div className="absolute top-0 w-full h-[30%] bg-green-100 border-b border-green-300"></div>
                    
                    {/* Indicador Talón */}
                    <div className="absolute w-full bg-indigo-500 transition-all duration-200 ease-out rounded-t"
                         style={{ 
                             bottom: 0,
                             height: `${Math.max(10, Math.min(100, (currentAngles.ankleAngle - 90) * 1.8))}%`
                         }}>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2">Llega a la zona verde</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}