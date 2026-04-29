import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Remo Unilateral de Pie en Polea
 * Lógica Clave:
 * 1. Unilateralidad: Detectar qué brazo está trabajando (el que se flexiona).
 * 2. ESTABILIDAD (Core): El torso NO debe rotar ni inclinarse (Rocking).
 * - Se monitorea la desviación del ángulo del torso respecto a la vertical.
 */
export default function RemoUnilateralPiePolea() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('extended'); 
  const [feedback, setFeedback] = useState('Mantén el torso firme, sin rotar');
  const [currentAngles, setCurrentAngles] = useState({
    activeElbow: 180,  // Ángulo del brazo que trabaja
    torsoStability: 180, // Ángulo vertical del torso
    isStable: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]);
  const torsoBaseRef = useRef(null); // Guardamos el ángulo inicial del torso como referencia
  const activeSideRef = useRef(null); // 'right' | 'left'
  const holdStartRef = useRef(null);
  const stabilityWarningRef = useRef(false);

  // --- UMBRALES ---
  const EXTENDED_THRESHOLD = 150; // Brazo estirado
  const FLEXED_THRESHOLD = 90;    // Brazo jalado
  
  // Umbral de Estabilidad (Grados de desviación permitidos)
  // Si el torso se mueve más de 8 grados de su posición inicial, es inestable.
  const STABILITY_TOLERANCE = 8; 

  const HOLD_MS = 300;
  const MIN_INTERVAL_MS = 1200;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow, rightHip, leftHip, rightKnee, leftKnee, rightShoulder, leftShoulder } = angles;

    // 1. Determinar lado activo (Heurística simple: el codo más flexionado o el que se mueve)
    // Si no hemos decidido lado, miramos cuál está flexionado
    if (!activeSideRef.current) {
        if (rightElbow < 130) activeSideRef.current = 'right';
        else if (leftElbow < 130) activeSideRef.current = 'left';
    }

    // Selección de datos según lado activo (Default derecha si no se detecta aún)
    const isRight = activeSideRef.current === 'right';
    const rawElbow = isRight ? rightElbow : leftElbow;
    
    // Ángulo de Torso Vertical (Hombro - Cadera - Rodilla)
    // Usamos el lado visible (asumiendo perfil)
    const torsoAngleRaw = isRight 
        ? calculateAngle(landmarks[12], landmarks[24], landmarks[26]) // Der
        : calculateAngle(landmarks[11], landmarks[23], landmarks[25]); // Izq

    // Función auxiliar si calculateBodyAngles no devuelve torso vertical exacto
    function calculateAngle(a, b, c) {
        if(!a || !b || !c) return 180;
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180.0 / Math.PI);
        if (angle > 180.0) angle = 360 - angle;
        return angle;
    }

    // 2. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothElbow = Math.round(updateHistory(elbowHistoryRef, rawElbow));
    // No suavizamos tanto el torso para detectar movimientos bruscos (inestabilidad)
    const currentTorso = Math.round(torsoAngleRaw); 

    // Setear referencia inicial del torso si no existe
    if (torsoBaseRef.current === null && smoothElbow > 160) {
        torsoBaseRef.current = currentTorso;
    }

    // 3. Chequeo de Estabilidad (Core Check)
    let stable = true;
    if (torsoBaseRef.current) {
        const deviation = Math.abs(currentTorso - torsoBaseRef.current);
        if (deviation > STABILITY_TOLERANCE) {
            stable = false;
            if (!stabilityWarningRef.current) {
                setFeedback('⚠️ ¡Cuerpo firme! No te balances.');
                speak('Estabiliza el tronco');
                stabilityWarningRef.current = true;
            }
        } else {
            stabilityWarningRef.current = false;
        }
    }

    setCurrentAngles({
        activeElbow: smoothElbow,
        torsoStability: currentTorso,
        isStable: stable
    });

    // Si es inestable, no contamos reps (o advertimos)
    if (!stable) return; 

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'extended' || stage === 'return_hold') {
        if (smoothElbow < EXTENDED_THRESHOLD - 10) {
            setStage('pulling');
            setFeedback('Jala sin girar el cuerpo...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'pulling') {
        if (smoothElbow < FLEXED_THRESHOLD) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('squeezing');
                setFeedback('🔥 ¡Mantén tensión!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'squeezing') {
        if (smoothElbow > FLEXED_THRESHOLD + 10) {
            setStage('returning');
            setFeedback('Regresa lento (Negativa)...');
        }
    }
    else if (stage === 'returning') {
        if (smoothElbow > EXTENDED_THRESHOLD) {
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
                setStage('extended');
                holdStartRef.current = null;
            }
        }
    }
  };

  // Visualización
  const highlightedAngles = useMemo(() => {
    return [
        // Brazo activo (Mostramos ambos por si acaso, la lógica filtra)
        { indices: [12, 14, 16], angle: currentAngles.activeElbow, isValid: true },
        { indices: [11, 13, 15], angle: currentAngles.activeElbow, isValid: true },
        // Línea de Estabilidad (Hombro-Cadera-Rodilla)
        { indices: [12, 24, 26], angle: currentAngles.torsoStability, isValid: currentAngles.isStable },
    ];
  }, [currentAngles]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Remo Unilateral de Pie</h1>
          <p className="text-gray-600 mb-6 text-lg">
            Entrenamiento de <strong>anti-rotación</strong>. La IA verificará que tu brazo trabaje mientras tu cuerpo permanece inmóvil.
          </p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Remo Unilateral'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🦾</span>
                </div>
              )}
               <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1 rounded-full text-xs backdrop-blur-md">
                  Enfoque: ESTABILIDAD
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Ponte de perfil a la cámara (lado del brazo que trabaja).</li>
                <li>Activa el abdomen para no girar.</li>
                <li>Si te balanceas, la IA pausará el conteo.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🦾 Remo Unilateral IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Indicador de Estabilidad en Video */}
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg border-2 backdrop-blur-md shadow-xl transition-all duration-300
                  ${currentAngles.isStable ? 'bg-green-500/80 border-green-400 text-white' : 'bg-red-500/80 border-red-400 text-white animate-shake'}`}>
                  <div className="text-xs font-bold uppercase">Estabilidad Core</div>
                  <div className="text-xl font-black">{currentAngles.isStable ? 'SOLIDO' : 'INESTABLE'}</div>
              </div>

              {/* Overlay de lado activo */}
              <div className="absolute bottom-4 left-4 bg-black/50 text-white px-2 py-1 rounded text-xs">
                  Brazo Activo: {activeSideRef.current === 'right' ? 'Derecho' : activeSideRef.current === 'left' ? 'Izquierdo' : 'Detectando...'}
              </div>
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <div className="flex justify-between items-center">
                   <div className="text-center px-4">
                       <div className="text-xs text-gray-500">Fase</div>
                       <div className={`text-lg font-bold uppercase ${stage === 'squeezing' ? 'text-green-600' : 'text-indigo-600'}`}>
                           {stage.replace('_', ' ')}
                       </div>
                   </div>
                   <div className="h-8 w-px bg-gray-300"></div>
                   <div className="text-center px-4">
                       <div className="text-xs text-gray-500">Ángulo Codo</div>
                       <div className="text-2xl font-mono font-bold text-gray-800">{currentAngles.activeElbow}°</div>
                   </div>
                   <div className="h-8 w-px bg-gray-300"></div>
                   <div className="text-center px-4">
                        <div className="text-xs text-gray-500">Inclinación</div>
                        <div className={`text-lg font-bold ${currentAngles.isStable ? 'text-gray-700' : 'text-red-500'}`}>
                            {currentAngles.torsoStability}°
                        </div>
                   </div>
               </div>
            </div>
          </div>

          {/* PANEL LATERAL */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className={`text-8xl font-black transition-colors duration-200 ${currentAngles.isStable ? 'text-indigo-600' : 'text-gray-300'}`}>
                    {repCount}
                </div>
                {!currentAngles.isStable && <p className="text-xs text-red-500 mt-2 animate-pulse">Estabiliza para contar</p>}
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('🔥') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3">Tips de Ejecución</h3>
                <ul className="text-sm text-gray-600 space-y-3">
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">1.</span>
                        <span>Mantén el pecho alto y la mirada al frente.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">2.</span>
                        <span>Imagina que eres una estatua, solo se mueve el brazo.</span>
                    </li>
                    <li className="flex gap-2">
                        <span className="text-indigo-500 font-bold">3.</span>
                        <span>El codo debe pasar rozando las costillas.</span>
                    </li>
                </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}