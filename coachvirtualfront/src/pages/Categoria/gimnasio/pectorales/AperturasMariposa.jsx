import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Aperturas en Máquina Mariposa (Pec Deck)
 * Lógica Biomecánica:
 * 1. Altura de Codos: Vital para seguridad. Los codos no deben caer muy por debajo de los hombros.
 * 2. Recorrido: Medimos el ángulo del Húmero vs Torso (Apertura horizontal).
 * 3. Squeeze: Pausa isométrica al cerrar.
 */
export default function AperturasMariposa() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('open'); // 'open', 'closing', 'squeeze', 'opening'
  const [feedback, setFeedback] = useState('Abre el pecho, codos altos');
  const [currentMetrics, setCurrentMetrics] = useState({
    armAngle: 85,       // Ángulo apertura (Brazo vs Torso)
    elbowHeightOk: true // Check booleano
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const armHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const elbowWarningRef = useRef(false);

  // --- UMBRALES ---
  // Ángulo Brazo-Torso (0° = brazos pegados al cuerpo/al frente, 90° = brazos en cruz)
  const OPEN_THRESHOLD = 75;   // Brazos abiertos
  const CLOSE_THRESHOLD = 25;  // Brazos juntos al frente
  
  // Tolerancia de altura (Y coordinate difference). 
  // En mediapipe Y crece hacia abajo. Elbow.y > Shoulder.y significa codo abajo.
  const MAX_ELBOW_DROP = 0.15; // Unidades normalizadas (ajustable)

  const HOLD_MS = 400;         // Squeeze importante en máquina
  const MIN_INTERVAL_MS = 1200;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightShoulder, leftShoulder, rightElbow, leftElbow, rightHip, leftHip } = angles; // Ángulos
    
    // Necesitamos coordenadas crudas para altura, no solo ángulos
    const rSho = landmarks[12];
    const rElb = landmarks[14];
    const lSho = landmarks[11];
    const lElb = landmarks[13];

    // 1. Calcular Ángulo de Apertura (Promedio Húmero vs Torso)
    // Usamos una aproximación basada en la pose 2D calculada en poseUtils o heurística simple
    // Aquí asumimos que 'rightShoulder' en `angles` devuelve el ángulo axilar aprox.
    // Si no, usamos el promedio del ángulo axilar.
    const avgArmAngle = Math.round((rightShoulder + leftShoulder) / 2); // Asumiendo que poseUtils da ángulo axila

    // Suavizado
    armHistoryRef.current.push(avgArmAngle);
    if (armHistoryRef.current.length > SMOOTH_WINDOW) armHistoryRef.current.shift();
    const smoothArm = Math.round(armHistoryRef.current.reduce((a, b) => a + b, 0) / armHistoryRef.current.length);

    // 2. Check de Altura de Codos (Forma Correcta)
    // Calculamos la caída relativa del codo respecto al hombro
    const rDrop = rElb.y - rSho.y;
    const lDrop = lElb.y - lSho.y;
    const avgDrop = (rDrop + lDrop) / 2;
    
    const isElbowHeightOk = avgDrop < MAX_ELBOW_DROP;

    setCurrentMetrics({
        armAngle: smoothArm,
        elbowHeightOk: isElbowHeightOk
    });

    // Feedback de codos
    if (!isElbowHeightOk) {
        if (!elbowWarningRef.current) {
            setFeedback('⚠️ ¡Sube los codos! A nivel del hombro.');
            speak('Codos arriba');
            elbowWarningRef.current = true;
        }
        // No bloqueamos, pero advertimos
    } else {
        if (elbowWarningRef.current) {
            elbowWarningRef.current = false;
            setFeedback('✅ Altura correcta');
        }
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'open' || stage === 'opening') {
        // Detectar cierre
        if (smoothArm < CLOSE_THRESHOLD + 15) {
            setStage('closing');
            setFeedback('Junta las manos...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'closing') {
        // Detectar contacto/cierre total
        if (smoothArm < CLOSE_THRESHOLD) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('squeeze');
                setFeedback('🔒 ¡Aprieta el pecho!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'squeeze') {
        // Iniciar apertura
        if (smoothArm > CLOSE_THRESHOLD + 10) {
            setStage('opening');
            setFeedback('Abre controlando el peso...');
        }
    }
    else if (stage === 'opening') {
        // Vuelta al inicio
        if (smoothArm > OPEN_THRESHOLD) {
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
                setStage('open');
                holdStartRef.current = null;
            }
        }
    }
  };

  // Visualización
  const highlightedAngles = useMemo(() => {
    return [
      // Línea Hombro-Codo (Crucial)
      { indices: [12, 14], angle: currentMetrics.armAngle, isValid: currentMetrics.elbowHeightOk },
      { indices: [11, 13], angle: currentMetrics.armAngle, isValid: currentMetrics.elbowHeightOk },
    ];
  }, [currentMetrics]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Aperturas Mariposa</h1>
          <p className="text-gray-600 mb-6 text-lg">La IA verificará que mantengas los <strong>codos altos</strong> (alineados con hombros) para proteger tus articulaciones.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Mariposa'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🦋</span>
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Siéntate con la espalda pegada al respaldo.</li>
                <li>Ajusta la altura del asiento para que los agarres queden a nivel de hombros.</li>
                <li>No dejes caer los codos durante el movimiento.</li>
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
          <h1 className="text-3xl font-bold text-indigo-900">🦋 Mariposa IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Alerta de Codos Caídos */}
              {!currentMetrics.elbowHeightOk && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600/90 text-white px-6 py-4 rounded-xl shadow-2xl animate-bounce z-20">
                      <div className="text-2xl font-black text-center">⬆️ SUBE CODOS</div>
                      <div className="text-xs text-center mt-1">Protege tus hombros</div>
                  </div>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                <div className="flex justify-between items-center px-4">
                    <div className="text-center">
                        <span className="text-xs text-gray-500 uppercase">Apertura</span>
                        <div className="text-2xl font-bold text-indigo-600">{currentMetrics.armAngle}°</div>
                    </div>
                    <div className="text-center">
                        <span className="text-xs text-gray-500 uppercase">Alineación</span>
                        <div className={`text-lg font-bold ${currentMetrics.elbowHeightOk ? 'text-green-600' : 'text-red-600'}`}>
                            {currentMetrics.elbowHeightOk ? '✅ Correcta' : '❌ Baja'}
                        </div>
                    </div>
                </div>
            </div>
          </div>

          {/* FEEDBACK */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">Repeticiones</h2>
                <div className="text-8xl font-black text-indigo-600">{repCount}</div>
                <div className={`mt-4 px-4 py-2 rounded-full text-sm font-bold inline-block transition-colors
                    ${stage === 'squeeze' ? 'bg-green-500 text-white animate-pulse' : 'bg-gray-100 text-gray-500'}`}>
                    {stage === 'squeeze' ? '🔥 SQUEEZE 🔥' : stage.toUpperCase()}
                </div>
            </div>

            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('🔒') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-white border-blue-500 text-gray-700'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                 <h3 className="font-bold text-gray-700 mb-3 text-sm">Barra de Progreso (Repetición)</h3>
                 <div className="relative pt-4">
                     <div className="flex justify-between text-xs text-gray-400 mb-1">
                         <span>Abierto</span>
                         <span>Cerrado</span>
                     </div>
                     <div className="h-4 bg-gray-200 rounded-full overflow-hidden transform rotate-180"> 
                        {/* Rotamos para que izquierda sea abierto (mayor angulo) y derecha cerrado (menor angulo) visualmente si se prefiere, o logica inversa */}
                         <div className={`h-full transition-all duration-200 ${stage === 'squeeze' ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${Math.max(0, Math.min(100, 100 - ((currentMetrics.armAngle - 25) / 65 * 100)))}%` }}>
                         </div>
                     </div>
                 </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}