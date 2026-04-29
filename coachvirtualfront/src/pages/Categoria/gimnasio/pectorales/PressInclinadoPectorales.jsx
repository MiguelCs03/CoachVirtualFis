import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Press Inclinado con Mancuernas
 * Lógica Biomecánica:
 * 1. Validación de Inclinación: El torso debe estar inclinado (no plano, no vertical).
 * - Rango ideal (Cadera): 115° - 155°.
 * 2. Simetría: Ambos brazos deben moverse coordinados.
 * 3. Rango: Bajada profunda para estirar clavículas.
 */
export default function PressInclinadoPectorales() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); 
  const [feedback, setFeedback] = useState('Acomódate en el banco inclinado');
  const [currentAngles, setCurrentAngles] = useState({
    leftElbow: 180,
    rightElbow: 180,
    torsoAngle: 135, // Ángulo Hombro-Cadera-Rodilla
    symmetryDiff: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]);
  const torsoHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const postureErrorRef = useRef(false); // Para controlar alertas de inclinación

  // --- UMBRALES ---
  // Inclinación (El factor diferencial de este ejercicio)
  const INCLINE_MIN = 110; // Demasiado vertical (Press Hombro)
  const INCLINE_MAX = 160; // Demasiado plano (Press Plano)

  // Codos
  const UP_THRESHOLD = 160;
  const DOWN_THRESHOLD = 85;
  const START_LOWERING = 150;
  
  const MAX_SYMMETRY_DIFF = 25;
  const HOLD_MS = 200;
  const MIN_INTERVAL_MS = 1500;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow, rightHip, leftHip } = angles;

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothLeft = Math.round(leftElbow);
    const smoothRight = Math.round(rightElbow);
    const avgElbow = Math.round(updateHistory(elbowHistoryRef, (smoothLeft + smoothRight) / 2));
    
    // Ángulo Torso (Promedio de ambas caderas)
    const smoothTorso = Math.round(updateHistory(torsoHistoryRef, (rightHip + leftHip) / 2));
    
    const symmetryDiff = Math.abs(smoothLeft - smoothRight);

    setCurrentAngles({
        leftElbow: smoothLeft,
        rightElbow: smoothRight,
        torsoAngle: smoothTorso,
        symmetryDiff
    });

    // 2. Validación de Inclinación (Vital para este ejercicio)
    if (smoothTorso > INCLINE_MAX) {
        if (!postureErrorRef.current) {
            setFeedback('⚠️ Estás muy plano. Levanta el respaldo.');
            postureErrorRef.current = true;
        }
        return; // No contamos reps si el banco está mal
    } else if (smoothTorso < INCLINE_MIN) {
        if (!postureErrorRef.current) {
            setFeedback('⚠️ Muy vertical. Reclínate un poco.');
            postureErrorRef.current = true;
        }
        return;
    } else {
        if (postureErrorRef.current) {
            setFeedback('✅ Ángulo perfecto para pecho superior');
            postureErrorRef.current = false;
        }
    }

    // 3. Simetría
    if (symmetryDiff > MAX_SYMMETRY_DIFF) {
        setFeedback('⚠️ Nivela los brazos');
    }

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'up' || stage === 'pushing') {
        if (avgElbow < START_LOWERING) {
            setStage('lowering');
            setFeedback('Baja hacia la parte alta del pecho...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        if (avgElbow < DOWN_THRESHOLD) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('bottom');
                setFeedback('🔥 ¡Arriba!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'bottom') {
        if (avgElbow > DOWN_THRESHOLD + 10) {
            setStage('pushing');
            setFeedback('Empujando...');
        }
    }
    else if (stage === 'pushing') {
        if (avgElbow > UP_THRESHOLD) {
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

  // Visualización
  const highlightedAngles = useMemo(() => {
    const inclineOk = !postureErrorRef.current;
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: true },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: true },
      { indices: [12, 24, 26], angle: currentAngles.torsoAngle, isValid: inclineOk } // Torso
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Press Inclinado con Mancuernas</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA verificará que la <strong>inclinación del banco</strong> sea la correcta para trabajar el pectoral superior.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Press inclinado'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🔺</span>
                </div>
              )}
               <div className="absolute bottom-0 w-full bg-black/60 text-white text-center py-2 text-sm backdrop-blur-sm">
                  Ángulo Objetivo: 30° - 45° (Banco)
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Ajusta el banco (aprox 30-45 grados).</li>
                <li>Si la IA dice "Muy plano", sube el respaldo.</li>
                <li>Si dice "Muy vertical", bájalo.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🔺 Press Inclinado IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Indicador Visual de Inclinación */}
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg border-2 backdrop-blur-md shadow-xl
                  ${!postureErrorRef.current ? 'bg-white/90 border-green-500 text-green-700' : 'bg-red-100/90 border-red-500 text-red-700'}`}>
                  <div className="text-xs font-bold uppercase mb-1">Inclinación Torso</div>
                  <div className="text-3xl font-black">{currentAngles.torsoAngle}°</div>
                  <div className="text-xs font-bold">{currentAngles.torsoAngle > 155 ? 'Muy Plano 📉' : currentAngles.torsoAngle < 115 ? 'Muy Vertical 📈' : 'Óptimo ✨'}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded text-center">
                        <div className="text-xs text-gray-500">Simetría</div>
                        <div className={`text-xl font-bold ${currentAngles.symmetryDiff > 20 ? 'text-red-500' : 'text-green-500'}`}>
                            {currentAngles.symmetryDiff}°
                        </div>
                        <div className="text-[10px] text-gray-400">Diferencia L/R</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded text-center">
                        <div className="text-xs text-gray-500">Profundidad</div>
                        <div className="text-xl font-bold text-blue-600">
                            {Math.round((currentAngles.leftElbow + currentAngles.rightElbow)/2)}°
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* COLUMNA INFO */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 
                  feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-white border-blue-500 text-gray-700'}`}>
                <p className="text-lg font-medium">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-4 text-sm">Medidor de Inclinación</h3>
                {/* Barra Visual */}
                <div className="relative h-12 bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                    {/* Zonas */}
                    <div className="absolute h-full bg-red-200 w-[20%] left-0 flex items-center justify-center text-[8px] text-red-800 rotate-90 sm:rotate-0">Vertical</div>
                    <div className="absolute h-full bg-green-200 w-[40%] left-[20%] flex items-center justify-center text-[10px] font-bold text-green-800">ZONA ÓPTIMA</div>
                    <div className="absolute h-full bg-red-200 w-[40%] right-0 flex items-center justify-center text-[8px] text-red-800 rotate-90 sm:rotate-0">Plano</div>
                    
                    {/* Cursor */}
                    <div className="absolute top-0 bottom-0 w-1 bg-black shadow-lg transition-all duration-500 z-10"
                         style={{ left: `${Math.min(Math.max(((currentAngles.torsoAngle - 90) / 90) * 100, 0), 100)}%` }}>
                    </div>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                    Tu ángulo actual: <strong>{currentAngles.torsoAngle}°</strong>
                </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}