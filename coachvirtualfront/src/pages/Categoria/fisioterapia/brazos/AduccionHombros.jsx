import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Aducción de Hombros (Shoulder Adduction)
 * Enfoque Clínico:
 * 1. Control Escapular: Evitar la elevación del hombro (Hiking).
 * 2. Rango Puro: Llevar el brazo desde abducción (~90°) hacia el cuerpo (0°).
 * 3. Codo Extendido: Evitar flexión de codo compensatoria.
 */
export default function AduccionHombros() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Aducción de hombros';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('setup'); // 'setup', 'abducted', 'adducting', 'hold', 'abducting'
  const [feedback, setFeedback] = useState('Ponte de frente, brazos a los lados');
  const [metrics, setMetrics] = useState({
    shoulderAngle: 90,  // Ángulo del brazo respecto al torso
    shoulderElevation: 0, // Nivelación de hombros
    isShoulderRelaxed: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const armHistoryRef = useRef([]);
  const shoulderHeightRef = useRef(null); // Altura base del hombro relajado
  const holdStartRef = useRef(null);
  const hikeWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const START_ABDUCTION = 80; // Brazo separado (aprox T-pose o menos)
  const TARGET_ADDUCTION = 20; // Brazo pegado al cuerpo
  
  // Tolerancia de elevación de hombro (Shoulder Hike)
  // Si el hombro sube > 5% de la altura del torso, es compensación.
  const HIKE_TOLERANCE = 0.05; 

  const HOLD_TIME_MS = 1000;
  const SMOOTH_WINDOW = 6;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Detectar Lado Activo
    // El brazo que está más separado del cuerpo es el que va a iniciar el movimiento
    // O si es con banda, asumimos el que se mueve.
    // Usaremos el ángulo axilar (Torso-Hombro-Codo).
    const rAxilla = angles.rightShoulder; // Asumiendo que poseUtils da esto
    const lAxilla = angles.leftShoulder;
    
    const isRightActive = rAxilla > lAxilla; // El que está más abierto
    const activeAngleRaw = isRightActive ? rAxilla : lAxilla;
    
    // 2. Detectar Elevación de Hombro (Compensación Trapecio)
    const shoulderY = isRightActive ? landmarks[12].y : landmarks[11].y;
    const hipY = isRightActive ? landmarks[24].y : landmarks[23].y;
    const torsoHeight = Math.abs(hipY - shoulderY);
    
    // Calibrar altura base en reposo
    if (stage === 'setup' || !shoulderHeightRef.current) {
        shoulderHeightRef.current = shoulderY;
    }

    // Chequear elevación relativa
    let isShoulderRelaxed = true;
    if (shoulderHeightRef.current) {
        // En MediaPipe Y disminuye hacia arriba. Si Y es menor, subió.
        const elevation = shoulderHeightRef.current - shoulderY;
        if (elevation > torsoHeight * HIKE_TOLERANCE) {
            isShoulderRelaxed = false;
        }
    }

    // Feedback de Compensación
    if (!isShoulderRelaxed) {
        if (!hikeWarnRef.current) {
            setFeedback('⚠️ ¡Baja el hombro! No uses el cuello.');
            speak('Relaja el hombro');
            hikeWarnRef.current = true;
        }
    } else {
        hikeWarnRef.current = false;
    }

    // 3. Suavizado
    const updateHistory = (val) => {
        armHistoryRef.current.push(val);
        if (armHistoryRef.current.length > SMOOTH_WINDOW) armHistoryRef.current.shift();
        return armHistoryRef.current.reduce((a, b) => a + b, 0) / armHistoryRef.current.length;
    };
    const smoothArm = Math.round(updateHistory(activeAngleRaw));

    setMetrics({
        shoulderAngle: smoothArm,
        shoulderElevation: 0,
        isShoulderRelaxed
    });

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'setup') {
        if (smoothArm > START_ABDUCTION - 20) {
            setStage('abducted');
            setFeedback('Brazo separado. Ahora ciérralo hacia tu cuerpo.');
            speak('Cierra el brazo');
        } else {
            setFeedback('Separa el brazo para empezar (Banda tensa)');
        }
    }
    else if (stage === 'abducted' || stage === 'abducting') {
        // Iniciar cierre (aducción)
        if (smoothArm < START_ABDUCTION - 10) {
            setStage('adducting');
            setFeedback('Acerca el brazo al cuerpo lentamente...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'adducting') {
        // Llegar al cuerpo
        if (smoothArm <= TARGET_ADDUCTION) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('🔒 Sostén pegado al cuerpo...');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        
        if (now - holdStartRef.current >= 1000) {
            setStage('abducting');
            setFeedback('Separa el brazo despacio (frena la banda).');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'abducting') {
        // Vuelta a inicio
        if (smoothArm >= START_ABDUCTION) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición correcta.');
                 speak((repCount + 1).toString());
                 setStage('abducted');
                 holdStartRef.current = null;
             }
        }
    }
  };

  // --- VISTA PREVIA ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">{passedNombre}</h1>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="h-64 bg-blue-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">🤲</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Control Motor del Hombro
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Indicaciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Ponte de frente. Sujeta la banda elástica con el brazo separado.</li>
                <li>Lleva la mano hacia tu cadera (aducción) sin doblar el codo.</li>
                <li><strong>Muy importante:</strong> No subas el hombro hacia la oreja.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Iniciar Terapia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA TERAPIA ---
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
              <h2 className="text-xl font-bold text-slate-800">{passedNombre}</h2>
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Estabilidad Escapular</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Hombro Levantado */}
                    {!metrics.isShoulderRelaxed && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white px-6 py-3 rounded-xl animate-bounce z-20 shadow-xl border-2 border-white">
                            <div className="text-2xl font-bold text-center">⬇️ BAJA EL HOMBRO</div>
                            <div className="text-xs text-center">Relaja el cuello</div>
                        </div>
                    )}

                    {/* Indicador Ángulo */}
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Ángulo Brazo</div>
                        <div className="text-2xl font-mono font-bold text-indigo-600">{metrics.shoulderAngle}°</div>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'hold' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'hold' ? 'CONTRACCIÓN' : stage === 'adducting' ? 'CERRANDO' : 'ABRIENDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🙅' : feedback.includes('✅') ? '🙆' : '🗣️'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Terapeuta Virtual</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Visualizador de Aducción */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm text-center">Rango de Movimiento</h4>
                    <div className="relative h-32 flex justify-center">
                        {/* Cuerpo simulado */}
                        <div className="w-16 h-full bg-slate-100 rounded-t-full border border-slate-200 relative z-10"></div>
                        
                        {/* Brazo simulado (aguja) */}
                        <div className="absolute top-2 left-1/2 w-1 h-24 bg-indigo-500 origin-top transition-transform duration-300 rounded-full"
                             style={{ transform: `rotate(-${metrics.shoulderAngle}deg)` }}>
                             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-indigo-700 rounded-full"></div>
                        </div>
                        
                        {/* Arco de meta */}
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-48 h-48 border-l-4 border-green-200 rounded-full opacity-50 pointer-events-none"
                             style={{ clipPath: 'polygon(0 0, 0% 100%, 50% 50%)', transform: 'rotate(-20deg)' }}></div>
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-400">Cierra el brazo hacia la línea media</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}