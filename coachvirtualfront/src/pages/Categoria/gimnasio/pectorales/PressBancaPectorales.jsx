import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Press de Banca con Mancuernas (Dumbbell Bench Press)
 * Lógica Clave:
 * 1. Simetría: Comparar codo izquierdo vs derecho. Si difieren > 20°, alertar.
 * 2. Rango: Bajada profunda (<85°) y subida completa (>160°).
 */
export default function PressBancaPectorales() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'lowering', 'bottom', 'pushing'
  const [feedback, setFeedback] = useState('Prepara las mancuernas arriba');
  const [currentAngles, setCurrentAngles] = useState({
    leftElbow: 180,
    rightElbow: 180,
    symmetryDiff: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]); // Guardamos pares {l, r}
  const holdStartRef = useRef(null);
  const symmetryWarnRef = useRef(false);

  // --- UMBRALES ---
  const UP_THRESHOLD = 160;     // Brazos extendidos
  const DOWN_THRESHOLD = 85;    // Punto de máxima flexión (pecho)
  const START_LOWERING = 150;   // Comienza a bajar
  
  const MAX_SYMMETRY_DIFF = 25; // Grados de diferencia permitidos

  const HOLD_MS = 200;
  const MIN_INTERVAL_MS = 1500; // Un poco más lento que con barra
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow } = angles;

    // 1. Suavizado
    elbowHistoryRef.current.push({ l: leftElbow, r: rightElbow });
    if (elbowHistoryRef.current.length > SMOOTH_WINDOW) elbowHistoryRef.current.shift();
    
    const avg = (key) => elbowHistoryRef.current.reduce((a, b) => a + b[key], 0) / elbowHistoryRef.current.length;
    const smoothLeft = Math.round(avg('l'));
    const smoothRight = Math.round(avg('r'));
    const avgElbow = (smoothLeft + smoothRight) / 2;
    const symmetryDiff = Math.abs(smoothLeft - smoothRight);

    setCurrentAngles({
        leftElbow: smoothLeft,
        rightElbow: smoothRight,
        symmetryDiff
    });

    // 2. Chequeo de Simetría
    if (symmetryDiff > MAX_SYMMETRY_DIFF) {
        if (!symmetryWarnRef.current) {
            setFeedback('⚠️ ¡Empuja parejo con ambos brazos!');
            speak('Nivela los brazos');
            symmetryWarnRef.current = true;
        }
        // No bloqueamos el conteo, pero mostramos alerta visual clara
    } else {
        symmetryWarnRef.current = false;
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'up' || stage === 'pushing') {
        // Detectar inicio de bajada
        if (avgElbow < START_LOWERING) {
            setStage('lowering');
            setFeedback('Baja controlando el peso...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Detectar fondo (Bottom)
        if (avgElbow < DOWN_THRESHOLD) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('bottom');
                setFeedback('🔥 ¡Sube explosivo!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'bottom') {
        // Detectar subida
        if (avgElbow > DOWN_THRESHOLD + 15) {
            setStage('pushing');
            setFeedback('Subiendo...');
        }
    }
    else if (stage === 'pushing') {
        // Detectar final de repetición
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

  // Helpers visuales
  const getSymmetryColor = () => currentAngles.symmetryDiff > MAX_SYMMETRY_DIFF ? 'bg-red-500' : 'bg-green-500';
  
  // Visualización
  const highlightedAngles = useMemo(() => {
    const symmetryOk = currentAngles.symmetryDiff <= MAX_SYMMETRY_DIFF;
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: symmetryOk },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: symmetryOk }
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Press de banca con mancuernas</h1>
          <p className="text-gray-600 mb-6 text-lg">Rutina para pectorales con mancuernas. La IA comprobará la <strong>simetría</strong> entre tus brazos y la profundidad.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Press de banca'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🏋️</span>
                </div>
              )}
               <div className="absolute bottom-0 w-full bg-black/60 text-white text-center py-2 text-sm backdrop-blur-sm">
                  Enfoque: Simetría Izquierda/Derecha
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Acuéstate en el banco, pies firmes.</li>
                <li>Baja las mancuernas hasta que los codos pasen el torso.</li>
                <li>Sube ambos brazos al mismo tiempo (sin desnivelar).</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🏋️ Press Banca IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMNA CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Alerta de Asimetría Overlay */}
              {currentAngles.symmetryDiff > MAX_SYMMETRY_DIFF && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 pointer-events-none animate-pulse">
                      <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-black text-2xl shadow-2xl">
                          ⚠️ ¡DESNIVELADO!
                      </div>
                  </div>
              )}
            </div>

            {/* Dashboard Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                <div className="grid grid-cols-2 gap-6">
                    {/* Medidor de Simetría */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between text-sm text-gray-600 mb-2">
                            <span>Balance (Izq vs Der)</span>
                            <span className={currentAngles.symmetryDiff > MAX_SYMMETRY_DIFF ? 'text-red-500 font-bold' : 'text-green-500 font-bold'}>
                                {currentAngles.symmetryDiff}° Dif
                            </span>
                        </div>
                        {/* Barra Visual de Balance */}
                        <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                            {/* Centro ideal */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-black z-10"></div>
                            {/* Indicador actual */}
                            <div className={`absolute top-0 bottom-0 w-full transition-all duration-200 ${getSymmetryColor()}`}
                                 style={{ 
                                     left: '50%', 
                                     width: `${Math.min(currentAngles.symmetryDiff * 2, 100)}%`,
                                     transform: `translateX(${currentAngles.leftElbow > currentAngles.rightElbow ? '-100%' : '0'})`
                                 }}>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                            <span>Izquierda +Alta</span>
                            <span>Derecha +Alta</span>
                        </div>
                    </div>

                    {/* Medidor de Profundidad */}
                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex flex-col justify-center text-center">
                        <span className="text-xs text-gray-500 mb-1">Profundidad Codos</span>
                        <div className="text-3xl font-bold text-indigo-900">
                            {Math.round((currentAngles.leftElbow + currentAngles.rightElbow) / 2)}°
                        </div>
                        <span className="text-[10px] text-gray-400">Meta Abajo: &lt;85°</span>
                    </div>
                </div>
            </div>
          </div>

          {/* COLUMNA DERECHA */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-500 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
                <div className="mt-4 flex justify-center gap-2">
                     <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                         ${stage === 'bottom' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}>
                         FONDO
                     </span>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold text-white
                         ${stage === 'up' ? 'bg-blue-500' : 'bg-gray-300'}`}>
                         ARRIBA
                     </span>
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-white border-indigo-500 text-gray-700'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>
            
            {/* Guía rápida */}
            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Técnica Correcta</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Baja hasta estirar el pecho.
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-green-500">✓</span> Mantén las muñecas rectas.
                    </li>
                    <li className="flex items-center gap-2">
                        <span className="text-red-500">⚠️</span> No rebotes las mancuernas.
                    </li>
                </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}