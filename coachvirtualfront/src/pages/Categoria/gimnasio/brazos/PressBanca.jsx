import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de rutina de Press de Banca (Dumbbell Bench Press)
 * Lógica Clave:
 * 1. Simetría: Verificar que ambos brazos empujen igual.
 * 2. Rango: Bajar hasta que los codos rompan el paralelo (<90°) y subir a extensión completa.
 */
export default function PressBanca() {
  const [started, setStarted] = useState(false);
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'down_moving', 'bottom_hold', 'up_moving'
  const [feedback, setFeedback] = useState('Prepara las mancuernas arriba');
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    symmetryDiff: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;
  
  // Refs de control
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const symmetryErrorRef = useRef(false);

  // --- UMBRALES BIOMECÁNICOS (Press Banca) ---
  const DOWN_ENTER = 140;     // Comienza la bajada
  const DOWN_CONFIRM = 85;    // Punto bajo (profundidad ideal)
  const UP_ENTER = 120;       // Comienza la subida
  const UP_CONFIRM = 160;     // Extensión completa (sin bloquear violentamente)
  
  const MAX_SYMMETRY_DIFF = 25; // Diferencia máxima permitida entre brazo izq/der en grados
  const HOLD_MS = 250;          // Pausa breve para validar control
  const MIN_INTERVAL_MS = 1200; // Tiempo entre reps
  const SMOOTH_WINDOW = 6;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow } = angles;

    // 1. Suavizado
    elbowHistoryRef.current.push({ r: rightElbow, l: leftElbow });
    if (elbowHistoryRef.current.length > SMOOTH_WINDOW) elbowHistoryRef.current.shift();
    
    const avg = (prop) => elbowHistoryRef.current.reduce((a, b) => a + b[prop], 0) / elbowHistoryRef.current.length;
    const smoothRight = Math.round(avg('r'));
    const smoothLeft = Math.round(avg('l'));
    
    // Calculamos la "pose media" para determinar la fase del ejercicio
    const avgElbow = (smoothRight + smoothLeft) / 2;
    const symmetryDiff = Math.abs(smoothRight - smoothLeft);

    setCurrentAngles({
      rightElbow: smoothRight,
      leftElbow: smoothLeft,
      symmetryDiff: symmetryDiff
    });

    // 2. Chequeo de Simetría (Vital en mancuernas)
    if (symmetryDiff > MAX_SYMMETRY_DIFF) {
       if (!symmetryErrorRef.current) {
           setFeedback('⚠️ ¡Empuja parejo con ambos brazos!');
           speak('Nivela los brazos');
           symmetryErrorRef.current = true;
       }
       // No detenemos el conteo completamente, pero advertimos
    } else {
        symmetryErrorRef.current = false;
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'up' || stage === 'top_hold') {
        // Detectar bajada
        if (avgElbow < DOWN_ENTER) {
            setStage('down_moving');
            setFeedback('Bajando controlado...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'down_moving') {
        // Validar fondo
        if (avgElbow < DOWN_CONFIRM) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('bottom_hold');
                setFeedback('🔥 ¡Empuja explosivo!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'bottom_hold') {
        // Detectar inicio subida
        if (avgElbow > UP_ENTER) {
            setStage('up_moving');
            setFeedback('Subiendo...');
        }
    }
    else if (stage === 'up_moving') {
        // Validar extensión arriba
        if (avgElbow > UP_CONFIRM) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                // Rep completada
                if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
                    const newCount = repCount + 1;
                    setRepCount(newCount);
                    setFeedback(`💪 Repetición ${newCount}`);
                    speak(newCount.toString());
                    lastRepTimeRef.current = now;
                }
                setStage('up');
                holdStartRef.current = null;
            }
        }
        // Si falla la subida (vuelve a bajar antes de tiempo)
        else if (avgElbow < DOWN_ENTER) {
             setStage('down_moving');
             setFeedback('¡No completaste la subida!');
        }
    }
  };

  const getElbowColor = (angle) => {
      // Azul neutro, Amarillo moviendo, Verde en objetivos
      if (stage === 'bottom_hold' && angle < DOWN_CONFIRM + 10) return 'text-green-600';
      if (stage === 'up' && angle > UP_CONFIRM - 10) return 'text-green-600';
      if (stage.includes('moving')) return 'text-yellow-600';
      return 'text-blue-600';
  };

  // Visualización en esqueleto
  const highlightedAngles = useMemo(() => {
    const symmetryOk = currentAngles.symmetryDiff <= MAX_SYMMETRY_DIFF;
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: symmetryOk },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: symmetryOk }
    ];
  }, [currentAngles]);

  const resetCounter = () => {
    setRepCount(0);
    setStage('up');
    setFeedback('Lista para empezar');
  };

  // --- VISTA PREVIA ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Press de banca con mancuernas</h1>
          <p className="text-gray-600 mb-8 text-lg">La IA verificará la profundidad de tu bajada y la simetría entre tus brazos.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56 flex items-center justify-center overflow-hidden bg-gray-100">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Press de banca'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🏋️</span>
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Tumbado en banco o suelo.</li>
                <li>Baja las mancuernas hasta el nivel del pecho.</li>
                <li>Sube ambos brazos al mismo tiempo.</li>
                <li>Mantén los codos estables.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                Iniciar rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA ACTIVA ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">🏋️ Press de banca (Rutina)</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Volver a descripción</button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* COLUMNA CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
                    
                    {/* Indicador de Simetría en Video */}
                    <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-sm backdrop-blur-sm font-bold
                        ${currentAngles.symmetryDiff > MAX_SYMMETRY_DIFF ? 'bg-red-500/80 text-white' : 'bg-green-500/80 text-white'}`}>
                        {currentAngles.symmetryDiff > MAX_SYMMETRY_DIFF ? '⚠️ DESBALANCE' : '⚖️ BALANCEADO'}
                    </div>
                </div>

                {/* Panel Métricas */}
                <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos (Codos)</h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                        <div className={`p-2 rounded ${getElbowColor(currentAngles.leftElbow)} bg-gray-50`}>
                            <div className="text-xs text-gray-500">Izquierdo</div>
                            <div className="text-2xl font-bold">{currentAngles.leftElbow}°</div>
                        </div>
                        <div className={`p-2 rounded ${getElbowColor(currentAngles.rightElbow)} bg-gray-50`}>
                            <div className="text-xs text-gray-500">Derecho</div>
                            <div className="text-2xl font-bold">{currentAngles.rightElbow}°</div>
                        </div>
                         <div className="p-2 rounded bg-gray-50 flex flex-col justify-center items-center">
                            <div className="text-xs text-gray-500">Fase</div>
                            <div className="text-sm font-bold uppercase text-indigo-600">{stage.split('_')[0]}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* COLUMNA CONTROL */}
            <div className="space-y-6">
                 <div className="bg-white rounded-lg shadow-xl p-6 text-center">
                    <h2 className="text-gray-600 font-medium uppercase tracking-wide text-sm">Repeticiones</h2>
                    <div className="text-8xl font-extrabold text-indigo-600 my-4">{repCount}</div>
                    <button onClick={resetCounter} className="text-indigo-500 hover:text-indigo-700 text-sm underline">Reiniciar contador</button>
                 </div>

                 <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                    ${feedback.includes('⚠️') ? 'bg-yellow-50 border-yellow-400 text-yellow-800' : 
                      feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                      'bg-white border-indigo-500 text-gray-700'}`}>
                    <h3 className="font-bold mb-1">Feedback IA:</h3>
                    <p className="text-lg">{feedback}</p>
                 </div>

                 <div className="bg-white rounded-lg shadow-xl p-6">
                     <h3 className="font-semibold text-gray-700 mb-2">Tips de Ejecución</h3>
                     <ul className="text-sm text-gray-600 space-y-2">
                         <li>⬇️ <strong>Bajada:</strong> Controlada, 2-3 segundos.</li>
                         <li>⬆️ <strong>Subida:</strong> Explosiva, 1 segundo.</li>
                         <li>⚠️ <strong>Ojo:</strong> No choques las mancuernas arriba para mantener tensión.</li>
                     </ul>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}