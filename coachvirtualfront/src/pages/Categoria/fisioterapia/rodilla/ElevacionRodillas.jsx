import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación de Rodillas (Hip Flexion / High Knees)
 * Enfoque Clínico:
 * 1. Flexión de Cadera: Llevar el muslo a la horizontal (90°).
 * 2. Estabilidad de Tronco: Evitar inclinación posterior (compensación lumbar).
 * 3. Equilibrio: Mantener la pierna de apoyo recta.
 */
export default function ElevacionRodillas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación de rodillas';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('stand'); // 'stand', 'lifting', 'hold', 'lowering'
  const [feedback, setFeedback] = useState('Mantén la postura erguida');
  const [metrics, setMetrics] = useState({
    activeHipAngle: 180, // Ángulo de la pierna que sube
    torsoLean: 0,        // Inclinación del tronco
    isRightActive: true, // Qué pierna está trabajando
    heightReached: false // Si llegó a la meta
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const hipHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const leanWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const STANDING_ANGLE = 160; // Pierna estirada
  const TARGET_FLEXION = 100; // Meta: ~90 grados (Muslo horizontal)
  
  const MAX_TORSO_LEAN = 12;  // Grados de inclinación permitidos hacia atrás
  const HOLD_TIME_MS = 1000;  // Pausa de control arriba
  const SMOOTH_WINDOW = 6;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Detectar Lado Activo (El que tiene la rodilla más alta / menor ángulo de cadera)
    const isRightActive = angles.rightHip < angles.leftHip;
    const rawActiveAngle = isRightActive ? angles.rightHip : angles.leftHip;
    
    // 2. Calcular Inclinación de Tronco (Shoulder vs Hip verticalidad)
    // Usamos el lado de la pierna de APOYO para medir la verticalidad del tronco, es más estable.
    const supportSide = isRightActive ? 'left' : 'right';
    const shoulder = supportSide === 'right' ? landmarks[12] : landmarks[11];
    const hip = supportSide === 'right' ? landmarks[24] : landmarks[23];
    
    // Ángulo respecto a la vertical
    let torsoAngle = 0;
    if(shoulder && hip) {
        const radians = Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x);
        const degrees = Math.abs(radians * 180.0 / Math.PI);
        torsoAngle = Math.abs(90 - degrees); // 0 es vertical perfecta
    }

    // 3. Suavizado
    const updateHistory = (val) => {
        hipHistoryRef.current.push(val);
        if (hipHistoryRef.current.length > SMOOTH_WINDOW) hipHistoryRef.current.shift();
        return hipHistoryRef.current.reduce((a, b) => a + b, 0) / hipHistoryRef.current.length;
    };
    const smoothHip = Math.round(updateHistory(rawActiveAngle));
    const smoothLean = Math.round(torsoAngle);

    // 4. Chequeo de Compensación (Inclinación hacia atrás)
    if (smoothLean > MAX_TORSO_LEAN) {
        if (!leanWarnRef.current) {
            setFeedback('⚠️ ¡No te eches hacia atrás! Tronco recto.');
            speak('Espalda recta');
            leanWarnRef.current = true;
        }
        // En terapia estricta, podríamos no contar la rep, pero dejamos que fluya con warning.
    } else {
        leanWarnRef.current = false;
    }

    setMetrics({
        activeHipAngle: smoothHip,
        torsoLean: smoothLean,
        isRightActive,
        heightReached: smoothHip <= TARGET_FLEXION
    });

    // 5. Máquina de Estados
    const now = Date.now();

    if (stage === 'stand' || stage === 'lowering') {
        // Iniciar subida
        if (smoothHip < STANDING_ANGLE - 15) {
            setStage('lifting');
            setFeedback('Sube la rodilla con control...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lifting') {
        // Llegar a la meta (90 grados aprox)
        if (smoothHip <= TARGET_FLEXION) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('⚖️ Mantén el equilibrio...');
                 speak('Bien, baja');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 500) {
            setStage('lowering');
            setFeedback('Baja suavemente.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta al suelo
        if (smoothHip > STANDING_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición correcta.');
                 speak((repCount + 1).toString());
                 setStage('stand');
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
            <div className="h-64 bg-indigo-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">🦵⬆️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Reeducación de Marcha
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Objetivos:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Mantén el tronco erguido, imagina un hilo tirando de tu cabeza.</li>
                <li>Sube la rodilla hasta la altura de la cadera (90°).</li>
                <li>La pierna de apoyo debe estar firme como un poste.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Comenzar Terapia
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Control de Psoas</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Compensación */}
                    {metrics.torsoLean > MAX_TORSO_LEAN && (
                        <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 pointer-events-none animate-pulse">
                            <div className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                                ⚠️ ESPALDA RECTA
                            </div>
                        </div>
                    )}

                    {/* Indicador de Lado Activo */}
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
                        Lado: {metrics.isRightActive ? 'Derecho' : 'Izquierdo'}
                    </div>
                </div>

                {/* Panel de Altura */}
                <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
                    <div className="flex-1">
                        <div className="flex justify-between text-sm text-slate-500 mb-2">
                            <span>Elevación Rodilla</span>
                            <span className="font-bold text-slate-800">{metrics.activeHipAngle}°</span>
                        </div>
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                            <div className="absolute right-0 w-[30%] h-full bg-green-100 border-l border-green-300"></div>
                            <div className={`absolute right-0 h-full transition-all duration-200 rounded-l-full
                                ${metrics.heightReached ? 'bg-green-500' : 'bg-indigo-500'}`}
                                style={{ width: `${Math.min(100, Math.max(0, (180 - metrics.activeHipAngle) / 0.9))}%` }}>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center justify-center w-20">
                        <span className="text-[10px] uppercase text-slate-400 font-bold">Meta</span>
                        <div className={`text-2xl ${metrics.heightReached ? 'text-green-600' : 'text-slate-300'}`}>
                            {metrics.heightReached ? '✅' : '⭕'}
                        </div>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'hold' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'hold' ? 'EQUILIBRIO' : 'DINÁMICO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🚧' : feedback.includes('✅') ? '🏆' : '📢'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Fisioterapeuta IA</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Visualizador de Inclinación */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Estabilidad de Tronco</h4>
                    <div className="flex items-end h-20 gap-4">
                        {/* Línea de referencia vertical */}
                        <div className="w-1 h-full bg-slate-200 relative">
                            <div className={`absolute bottom-0 w-1 bg-slate-800 transition-all duration-300 origin-bottom`}
                                 style={{ 
                                     height: '100%', 
                                     transform: `rotate(${metrics.torsoLean * (metrics.isRightActive ? 1 : -1)}deg)` 
                                 }}>
                                <div className={`w-3 h-3 rounded-full absolute -top-1 -left-1 ${metrics.torsoLean > MAX_TORSO_LEAN ? 'bg-red-500' : 'bg-green-500'}`}></div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-400">Mantén la línea verde vertical</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}