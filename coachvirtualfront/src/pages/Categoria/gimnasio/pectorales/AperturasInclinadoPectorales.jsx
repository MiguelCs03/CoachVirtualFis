import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Aperturas Inclinadas (Incline Dumbbell Flyes)
 * Lógica Biomecánica:
 * 1. "Codo Congelado": El ángulo del codo debe mantenerse estático entre 135° y 165°.
 * - Si es > 170°: Peligroso (bloqueado).
 * - Si es < 130°: Se convierte en Press (trampa).
 * 2. Rango de Apertura: Medimos el ángulo del hombro para detectar la apertura (stretch) y el cierre (squeeze).
 */
export default function AperturasInclinadoPectorales() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('closed'); // 'closed', 'opening', 'stretch_hold', 'closing'
  const [feedback, setFeedback] = useState('Brazos arriba, codos semiflexionados');
  const [currentAngles, setCurrentAngles] = useState({
    elbowAvg: 150,    // Promedio flexión codos (Debe ser constante)
    shoulderOp: 160,  // Apertura de brazos (Variable)
    incline: 135      // Ángulo torso (Contexto)
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const elbowErrorRef = useRef(null); // 'locked' | 'bent' | null

  // --- UMBRALES ---
  // 1. Seguridad del Codo (Ventana de "Semiflexión")
  const ELBOW_MIN_SAFE = 130; // Menos de esto es un Press
  const ELBOW_MAX_SAFE = 172; // Más de esto es peligroso (brazo recto)

  // 2. Movimiento (Hombros/Apertura)
  // Usamos el ángulo del brazo relativo al torso
  const OPEN_ENTER = 100;     // Brazos abiertos (T-pose o más abajo)
  const CLOSED_CONFIRM = 155; // Brazos juntos arriba

  const HOLD_MS = 400;        // El stretch abajo es importante mantenerlo un poco
  const MIN_INTERVAL_MS = 1500; // Movimiento lento y controlado
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow, rightShoulder, leftShoulder, rightHip, leftHip } = angles;

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothElbowR = Math.round(rightElbow);
    const smoothElbowL = Math.round(leftElbow);
    const avgElbow = Math.round(updateHistory(elbowHistoryRef, (smoothElbowR + smoothElbowL) / 2));
    
    // Ángulo de apertura (Brazo vs Torso) - Usamos Shoulder como proxy del movimiento
    const avgShoulderOpen = Math.round((rightShoulder + leftShoulder) / 2);
    // Ángulo de inclinación torso (Hombro-Cadera-Rodilla aprox)
    const avgIncline = Math.round((rightHip + leftHip) / 2); 

    setCurrentAngles({
        elbowAvg: avgElbow,
        shoulderOp: avgShoulderOpen,
        incline: avgIncline
    });

    // 2. Validación de "Codo Congelado" (Técnica)
    // Esta validación es constante, no importa la fase
    if (avgElbow > ELBOW_MAX_SAFE) {
        if (elbowErrorRef.current !== 'locked') {
            setFeedback('⚠️ ¡No estires los brazos! Dobla un poco.');
            speak('Desbloquea los codos');
            elbowErrorRef.current = 'locked';
        }
        // Permitimos continuar pero con advertencia, o pausamos si es crítico
    } else if (avgElbow < ELBOW_MIN_SAFE) {
        if (elbowErrorRef.current !== 'bent') {
            setFeedback('⚠️ ¡No empujes! Mantén los codos abiertos.');
            speak('Esto no es un press');
            elbowErrorRef.current = 'bent';
        }
    } else {
        if (elbowErrorRef.current) {
            elbowErrorRef.current = null;
            setFeedback('✅ Codos perfectos, abre el pecho');
        }
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'closed' || stage === 'closing') {
        // Iniciar apertura (bajada)
        if (avgShoulderOpen < CLOSED_CONFIRM - 10) {
            setStage('opening');
            setFeedback('Abre lento, siente el estiramiento...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'opening') {
        // Detectar máxima apertura (Stretch)
        if (avgShoulderOpen < OPEN_ENTER) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('stretch_hold');
                setFeedback('✨ Siente el estiramiento');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'stretch_hold') {
        // Iniciar cierre (subida)
        if (avgShoulderOpen > OPEN_ENTER + 10) {
            setStage('closing');
            setFeedback('Cierra imaginando que abrazas un árbol');
        }
    }
    else if (stage === 'closing') {
        // Confirmar cierre arriba
        if (avgShoulderOpen > CLOSED_CONFIRM) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS/2) {
                 if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
                    const newCount = repCount + 1;
                    setRepCount(newCount);
                    setFeedback(`✅ Repetición ${newCount}`);
                    speak(newCount.toString());
                    lastRepTimeRef.current = now;
                }
                setStage('closed');
                holdStartRef.current = null;
            }
        }
    }
  };

  // Helpers visuales
  const getElbowStatusColor = () => {
      if (currentAngles.elbowAvg > ELBOW_MAX_SAFE) return 'text-red-600';
      if (currentAngles.elbowAvg < ELBOW_MIN_SAFE) return 'text-yellow-600';
      return 'text-green-600';
  };

  // Highlight Skeleton
  const highlightedAngles = useMemo(() => {
    const elbowOk = !elbowErrorRef.current;
    return [
      { indices: [12, 14, 16], angle: currentAngles.elbowAvg, isValid: elbowOk }, // Codo
      { indices: [11, 13, 15], angle: currentAngles.elbowAvg, isValid: elbowOk },
      // Apertura (Hombro)
      { indices: [14, 12, 24], angle: currentAngles.shoulderOp, isValid: true }, 
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Aperturas Inclinadas</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA vigilará que mantengas los <strong>codos semiflexionados</strong> (rígidos) para aislar el pecho y no convertilo en press.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Aperturas'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🫧</span>
                </div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">
                      💡 Visualiza: "Abrazar un árbol enorme"
                  </span>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Abre los brazos hasta sentir estiramiento en el pecho.</li>
                <li><strong>No dobles ni estires</strong> los codos durante el movimiento.</li>
                <li>Movimiento circular, no lineal.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🫧 Aperturas IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Medidor de Codos (Gauge) */}
              <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-3 rounded-xl shadow-lg border border-gray-200 w-32">
                  <div className="text-xs font-bold text-center mb-1 text-gray-500 uppercase">Ángulo Codo</div>
                  <div className={`text-2xl font-black text-center ${getElbowStatusColor()}`}>
                      {currentAngles.elbowAvg}°
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full mt-1 relative overflow-hidden">
                      {/* Zonas de seguridad */}
                      <div className="absolute left-0 w-1/3 h-full bg-yellow-300 opacity-50"></div> {/* Press */}
                      <div className="absolute left-1/3 w-1/3 h-full bg-green-400 opacity-80"></div> {/* Safe */}
                      <div className="absolute right-0 w-1/3 h-full bg-red-400 opacity-50"></div> {/* Locked */}
                      
                      {/* Marcador */}
                      <div className="absolute top-0 bottom-0 w-1 bg-black transition-all duration-300"
                           style={{ left: `${((currentAngles.elbowAvg - 100) / 80) * 100}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                      <span>Press</span>
                      <span>Recto</span>
                  </div>
              </div>
            </div>

            {/* Info Adicional */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Apertura Brazos</span>
                        <span className="font-bold text-xl text-blue-600">{currentAngles.shoulderOp}°</span>
                    </div>
                    <div className="h-8 w-px bg-gray-300"></div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-500">Inclinación Banco</span>
                        <span className="font-bold text-xl text-gray-700">{currentAngles.incline}°</span>
                    </div>
                </div>
            </div>
          </div>

          {/* FEEDBACK */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
                <p className={`mt-4 text-sm font-medium px-3 py-1 rounded-full inline-block
                    ${stage === 'stretch_hold' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {stage === 'stretch_hold' ? '✨ MÁXIMA APERTURA' : stage.toUpperCase()}
                </p>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 
                  feedback.includes('✅') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                 <h3 className="font-bold text-gray-700 mb-3 text-sm">Zona de Peligro</h3>
                 <div className="space-y-2 text-sm">
                     <div className="flex items-center justify-between">
                         <span className="text-gray-600">Brazo Recto (Daño codo)</span>
                         <span className={currentAngles.elbowAvg > ELBOW_MAX_SAFE ? 'text-red-600 font-bold' : 'text-gray-400'}>&gt;172°</span>
                     </div>
                     <div className="flex items-center justify-between">
                         <span className="text-gray-600">Muy doblado (Es Press)</span>
                         <span className={currentAngles.elbowAvg < ELBOW_MIN_SAFE ? 'text-yellow-600 font-bold' : 'text-gray-400'}>&lt;130°</span>
                     </div>
                     <div className="mt-3 text-xs text-gray-400 italic border-t pt-2">
                         El ángulo ideal es ~150° constante.
                     </div>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}