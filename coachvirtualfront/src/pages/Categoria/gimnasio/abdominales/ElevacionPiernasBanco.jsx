import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Piernas en Banco
 * Diferencias con Suelo:
 * 1. Rango Negativo: Las piernas pueden bajar más (Ángulo Hip > 180° si se mide absoluto, 
 * pero para efectos prácticos validamos el retorno a la horizontal ~170-180°).
 * 2. Estrictez: Se penaliza más el doblar rodillas (Knee Tuck) ya que el banco facilita la trampa.
 */
export default function ElevacionPiernasBanco() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down'); // 'down', 'up_moving', 'top_hold', 'down_moving'
  const [feedback, setFeedback] = useState('Acuéstate en el banco, piernas fuera');
  const [currentAngles, setCurrentAngles] = useState({
    hipAngle: 180,    // Ángulo Torso-Piernas
    kneeAngle: 180,   // Rectitud de piernas
    isKneeStraight: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const hipHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const kneeErrorRef = useRef(false);

  // --- UMBRALES ---
  const UP_THRESHOLD = 105;    // Piernas arriba (aprox 90-100 grados)
  const DOWN_THRESHOLD = 170;  // Piernas abajo (alineadas con el banco o más abajo)
  
  // Validación de forma estricta
  const MIN_KNEE_EXTENSION = 145; // Deben estar casi rectas

  const HOLD_MS = 250;
  const MIN_INTERVAL_MS = 1500;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightHip, leftHip, rightKnee, leftKnee } = angles;

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

    // 2. Detector de Rodillas Dobladas (Trampa común)
    if (!isKneeStraight) {
        if (!kneeErrorRef.current) {
            setFeedback('⚠️ ¡Piernas rectas! No las dobles.');
            speak('Estira las rodillas');
            kneeErrorRef.current = true;
        }
    } else {
        if (kneeErrorRef.current) {
            kneeErrorRef.current = false;
            setFeedback('✅ Buena extensión');
        }
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'down' || stage === 'down_moving') {
        // Iniciar subida
        if (avgHip < DOWN_THRESHOLD - 15) {
            setStage('up_moving');
            setFeedback('Sube con control...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'up_moving') {
        // Llegar al tope
        if (avgHip < UP_THRESHOLD) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('top_hold');
                setFeedback('🛑 Aguanta un segundo');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'top_hold') {
        // Iniciar bajada
        if (avgHip > UP_THRESHOLD + 10) {
            setStage('down_moving');
            setFeedback('Baja lento hasta la horizontal...');
        }
    }
    else if (stage === 'down_moving') {
        // Llegar abajo (Horizontal o más abajo)
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
    }
  };

  // Visualización
  const highlightedAngles = useMemo(() => {
    const kneesOk = currentAngles.isKneeStraight;
    return [
      { indices: [12, 24, 26], angle: currentAngles.hipAngle, isValid: true }, // Cadera
      { indices: [24, 26, 28], angle: currentAngles.kneeAngle, isValid: kneesOk }, // Rodillas
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Elevación de piernas en banco</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA comprobará que bajes las piernas hasta la horizontal y mantengas las <strong>rodillas rectas</strong>.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Elevación Banco'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🪑</span>
                </div>
              )}
              <div className="absolute bottom-0 w-full bg-black/60 text-white text-center py-2 text-sm backdrop-blur-sm">
                  Tip: Sujétate fuerte del banco con las manos
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Acuéstate dejando las piernas colgando fuera del banco.</li>
                <li>Mantén las piernas rectas (¡No las dobles!).</li>
                <li>Baja hasta que el cuerpo quede alineado.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🪑 Elevación Banco IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Alerta Visual de Rodillas */}
              {!currentAngles.isKneeStraight && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl animate-pulse flex flex-col items-center">
                          <span className="text-3xl">⚠️</span>
                          <span className="font-bold text-lg">¡NO DOBLES!</span>
                          <span className="text-xs">Piernas rectas</span>
                      </div>
                  </div>
              )}
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                <div className="flex justify-around items-center text-center">
                    <div>
                        <span className="text-xs text-gray-500 uppercase">Elevación</span>
                        <div className="text-2xl font-bold text-indigo-600">{currentAngles.hipAngle}°</div>
                        <div className="text-xs text-gray-400">Meta Arriba: &lt;105°</div>
                    </div>
                    <div className="h-10 w-px bg-gray-200"></div>
                    <div>
                        <span className="text-xs text-gray-500 uppercase">Rodillas</span>
                        <div className={`text-2xl font-bold ${currentAngles.isKneeStraight ? 'text-green-600' : 'text-red-600'}`}>
                            {currentAngles.kneeAngle}°
                        </div>
                        <div className="text-xs text-gray-400">Meta: &gt;145°</div>
                    </div>
                </div>
            </div>
          </div>

          {/* INFO */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
                <div className="mt-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                        ${stage === 'top_hold' ? 'bg-green-500' : stage === 'down' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                        {stage === 'top_hold' ? 'ARRIBA' : stage === 'down' ? 'ABAJO' : 'MOVIENDO'}
                    </span>
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('✅') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-white border-blue-500 text-gray-700'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Rango de Movimiento</h3>
                <div className="flex items-end h-24 gap-1 justify-center">
                     {/* Barra dinámica simulando la pierna */}
                     <div className="w-4 bg-gray-300 rounded-t-lg relative h-full">
                         <div className="absolute bottom-0 w-full bg-indigo-500 rounded-t-lg transition-all duration-300"
                              style={{ height: `${Math.min(100, Math.max(0, (180 - currentAngles.hipAngle) / 0.9))}%` }}>
                         </div>
                     </div>
                </div>
                <p className="text-xs text-center mt-2 text-gray-500">
                    Sube la barra azul hasta arriba (90°)
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}