import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Zancadas con Mancuernas (Lunges)
 * Lógica Biomecánica:
 * 1. Detección Dinámica: Identificar cuál es la pierna delantera (la que tiene menor ángulo de rodilla).
 * 2. Profundidad: La rodilla delantera debe bajar a ~90°.
 * 3. Torso: Debe mantenerse vertical (no inclinarse adelante).
 */
export default function ZancadasMancuernas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('standing'); // 'standing', 'descending', 'deep', 'ascending'
  const [feedback, setFeedback] = useState('Da un paso largo hacia adelante');
  const [currentMetrics, setCurrentMetrics] = useState({
    activeKnee: 180,  // Ángulo de la rodilla que está trabajando
    torsoLean: 180,   // Ángulo del torso
    isRightLeg: true  // Para saber qué pierna está adelante
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const torsoWarningRef = useRef(false);

  // --- UMBRALES ---
  const STANDING_THRESHOLD = 160; // Piernas casi rectas
  const DEEP_THRESHOLD = 95;      // Meta: 90 grados aprox
  const TORSO_LEAN_LIMIT = 150;   // Si baja de esto (se cierra la cadera), está muy inclinado adelante

  const HOLD_MS = 200;
  const MIN_INTERVAL_MS = 1300;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightKnee, leftKnee, rightHip, leftHip } = angles;

    // 1. Determinar Pierna Activa (La que está haciendo la zancada)
    // En una zancada, la pierna delantera es la que se flexiona más.
    const isRightForward = rightKnee < leftKnee;
    const rawActiveKnee = isRightForward ? rightKnee : leftKnee;
    const rawTorso = isRightForward ? rightHip : leftHip; // Usamos la cadera del lado activo para ver inclinación

    // 2. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothKnee = Math.round(updateHistory(kneeHistoryRef, rawActiveKnee));
    const smoothTorso = Math.round(rawTorso);

    setCurrentMetrics({
        activeKnee: smoothKnee,
        torsoLean: smoothTorso,
        isRightLeg: isRightForward
    });

    // 3. Validación de Torso (No inclinarse)
    // En la zancada, la cadera de la pierna delantera se cierra (90°), pero si baja demasiado (<70-80) es pecho a rodilla.
    // Usamos una heurística: Si la rodilla está bajando pero el torso se inclina demasiado.
    // Nota: Ajuste fino para "Torso Vertical" vs "Torso Inclinado".
    // Simplificación: Si detectamos una inclinación excesiva visual (depende de cómo calculateBodyAngles mida Hip).
    // Asumiremos que < 80 en cadera delantera indica inclinación excesiva del tronco.
    if (smoothKnee < 120 && smoothTorso < 75) { 
        if (!torsoWarningRef.current) {
            setFeedback('⚠️ ¡Torso arriba! No te inclines.');
            speak('Espalda recta');
            torsoWarningRef.current = true;
        }
    } else {
        torsoWarningRef.current = false;
    }

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'standing' || stage === 'ascending') {
        // Detectar bajada
        if (smoothKnee < STANDING_THRESHOLD - 20) {
            setStage('descending');
            setFeedback('Baja la rodilla trasera...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'descending') {
        // Detectar profundidad (90 grados)
        if (smoothKnee < DEEP_THRESHOLD) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('deep');
                setFeedback('🔥 ¡Sube fuerte!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'deep') {
        // Iniciar subida
        if (smoothKnee > DEEP_THRESHOLD + 15) {
            setStage('ascending');
            setFeedback('Arriba...');
        }
    }
    else if (stage === 'ascending') {
        // Vuelta a posición inicial
        if (smoothKnee > STANDING_THRESHOLD) {
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
                setStage('standing');
                holdStartRef.current = null;
            }
        }
    }
  };

  // Visualización
  const highlightedAngles = useMemo(() => {
    const isR = currentMetrics.isRightLeg;
    return [
      // Resaltar solo la pierna activa
      { indices: isR ? [24, 26, 28] : [23, 25, 27], angle: currentMetrics.activeKnee, isValid: true },
      // Línea de espalda
      { indices: isR ? [12, 24, 26] : [11, 23, 25], angle: currentMetrics.torsoLean, isValid: !torsoWarningRef.current }
    ];
  }, [currentMetrics, torsoWarningRef]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Zancadas con mancuernas</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA detectará automáticamente qué pierna estás usando. Busca llegar a <strong>90 grados</strong> con la rodilla delantera.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Zancadas'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🚶‍♂️</span>
                </div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-lg text-xs font-bold shadow">
                  🔄 Alterna piernas libremente
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Mantén el torso erguido, mirada al frente.</li>
                <li>Da un paso largo: rodilla delantera sobre el tobillo.</li>
                <li>Baja hasta que la rodilla trasera casi toque el suelo.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🚶‍♂️ Zancadas IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Indicador de Pierna Activa */}
              <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">
                  Pierna Activa: <strong>{currentMetrics.isRightLeg ? 'DERECHA' : 'IZQUIERDA'}</strong>
              </div>

              {/* Alerta de Torso */}
              {torsoWarningRef.current && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-yellow-500/90 text-white px-6 py-3 rounded-xl shadow-lg animate-bounce">
                      <span className="text-2xl font-bold">⬆️ ¡TORSO ARRIBA!</span>
                  </div>
              )}
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <div className="flex justify-around items-center text-center">
                   <div className="flex flex-col items-center">
                       <span className="text-xs text-gray-500 uppercase">Ángulo Rodilla</span>
                       <div className={`text-3xl font-bold ${stage === 'deep' ? 'text-green-600' : 'text-indigo-600'}`}>
                           {currentMetrics.activeKnee}°
                       </div>
                       <div className="text-[10px] text-gray-400 mt-1">Meta: 90°</div>
                   </div>
                   
                   <div className="h-12 w-px bg-gray-200"></div>

                   <div className="flex flex-col items-center w-1/2">
                        {/* Barra de Profundidad */}
                       <span className="text-xs text-gray-500 uppercase mb-1">Profundidad</span>
                       <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                           <div className={`h-full transition-all duration-200 ${currentMetrics.activeKnee < DEEP_THRESHOLD ? 'bg-green-500' : 'bg-blue-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, (180 - currentMetrics.activeKnee) / 0.9))}%` }}>
                           </div>
                       </div>
                   </div>
               </div>
            </div>
          </div>

          {/* PANEL DERECHO */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones Totales</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : 
                  feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3 text-sm">Consejo de Estabilidad</h3>
                <p className="text-sm text-gray-600">
                    Imagina que eres un ascensor: bajas y subes <strong>verticalmente</strong>, no en diagonal hacia adelante.
                </p>
                <div className="mt-4 flex justify-center items-center gap-4 text-xs text-gray-400">
                    <div className="flex flex-col items-center">
                        <span className="text-2xl">❌</span>
                        <span>Inclinado</span>
                    </div>
                    <div className="h-8 w-px bg-gray-200"></div>
                    <div className="flex flex-col items-center">
                        <span className="text-2xl">✅</span>
                        <span>Vertical</span>
                    </div>
                </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}