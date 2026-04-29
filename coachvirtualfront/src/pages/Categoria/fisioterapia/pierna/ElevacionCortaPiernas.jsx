import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Elevación Corta de Piernas (Marcha Estática / Single Leg Balance)
 * Enfoque Clínico:
 * 1. Transferencia de Peso: Levantar un pie del suelo manteniendo el equilibrio.
 * 2. Estabilidad Pélvica: Evitar que la cadera de apoyo colapse lateralmente.
 * 3. Rango Funcional: Elevación pequeña (~30-45° de cadera), controlada.
 */
export default function ElevacionCortaPiernas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación corta de piernas';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('stand'); // 'stand', 'lifting', 'balance', 'lowering'
  const [feedback, setFeedback] = useState('Pies juntos, espalda recta');
  const [metrics, setMetrics] = useState({
    activeHipAngle: 180, // Ángulo de la pierna que se mueve
    pelvicTilt: 0,       // Inclinación pélvica (Estabilidad)
    isStable: true,
    isRightLeg: true     // Lado activo
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const hipHistoryRef = useRef([]);
  const pelvicBaseYRef = useRef(null);
  const holdStartRef = useRef(null);
  const wobbleWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const LIFT_THRESHOLD = 155; // Inicio de elevación (ángulo se cierra desde 180)
  const TARGET_HEIGHT = 140;  // Meta corta (~40 grados de flexión)
  
  // Tolerancia de inclinación pélvica (Diferencia Y entre caderas)
  const PELVIC_DROP_TOLERANCE = 0.04; 

  const HOLD_TIME_MS = 1500;  // Equilibrio sostenido
  const SMOOTH_WINDOW = 6;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Detectar Lado Activo (El que se flexiona)
    const isRightLeg = angles.rightHip < angles.leftHip;
    const rawActiveHip = isRightLeg ? angles.rightHip : angles.leftHip;

    // 2. Análisis de Estabilidad Pélvica (Trendelenburg Check)
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    
    let pelvicTilt = 0;
    let isStable = true;

    if (lHip && rHip) {
        // Diferencia vertical entre caderas
        const dy = Math.abs(lHip.y - rHip.y);
        pelvicTilt = dy * 100; // Escalado arbitrario para visualización

        // Si la diferencia es mucha, la pelvis está caída
        if (dy > PELVIC_DROP_TOLERANCE) {
            isStable = false;
        }
    }

    // Feedback de Estabilidad
    if (!isStable && stage !== 'stand') {
        if (!wobbleWarnRef.current) {
            setFeedback('⚠️ ¡Cadera nivelada! No te dejes caer de lado.');
            speak('Nivela la cadera');
            wobbleWarnRef.current = true;
        }
    } else {
        wobbleWarnRef.current = false;
    }

    // 3. Suavizado
    const updateHistory = (val) => {
        hipHistoryRef.current.push(val);
        if (hipHistoryRef.current.length > SMOOTH_WINDOW) hipHistoryRef.current.shift();
        return hipHistoryRef.current.reduce((a, b) => a + b, 0) / hipHistoryRef.current.length;
    };
    const smoothHip = Math.round(updateHistory(rawActiveHip));

    setMetrics({
        activeHipAngle: smoothHip,
        pelvicTilt: Math.round(pelvicTilt),
        isStable,
        isRightLeg
    });

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'stand' || stage === 'lowering') {
        // Iniciar levantamiento
        if (smoothHip < LIFT_THRESHOLD - 5) {
            setStage('lifting');
            setFeedback('Levanta el pie suavemente...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lifting') {
        // Llegar a altura objetivo (corta)
        if (smoothHip <= TARGET_HEIGHT) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('balance');
                 setFeedback('⚖️ Mantén el equilibrio en una pierna...');
                 speak('Equilibrio');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'balance') {
        if (!holdStartRef.current) holdStartRef.current = now;
        
        // Si pierde estabilidad, reiniciamos el contador de hold
        if (!isStable) holdStartRef.current = now;

        if (now - holdStartRef.current >= 1000) {
            setStage('lowering');
            setFeedback('Baja controlando el apoyo.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Vuelta al suelo
        if (smoothHip > LIFT_THRESHOLD) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Paso completado.');
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
            <div className="h-64 bg-blue-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">🦵↕️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Equilibrio & Propiocepción
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Puntos de Atención:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Levanta un pie del suelo solo unos centímetros (como subiendo un escalón bajo).</li>
                <li>Todo el peso debe ir a la pierna que se queda en el suelo.</li>
                <li><strong>Evita que la cadera se hunda</strong> del lado que levantas.</li>
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Marcha</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Nivelador Pélvico */}
                    <div className="absolute top-4 right-4 w-32 h-8 bg-black/30 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center relative overflow-hidden">
                        <div className={`absolute h-full w-full transition-opacity duration-300 ${metrics.isStable ? 'bg-green-500/20' : 'bg-red-500/20'}`}></div>
                        <div className={`w-20 h-1 bg-white rounded transition-transform duration-300 origin-center`}
                             style={{ transform: `rotate(${metrics.isRightLeg ? metrics.pelvicTilt * 2 : -metrics.pelvicTilt * 2}deg)` }}></div>
                        <span className="absolute text-[8px] text-white font-bold bottom-1">PELVIS</span>
                    </div>

                    {/* Indicador de Pie */}
                    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg border shadow-sm text-slate-600 text-xs font-bold">
                        Pie: {metrics.isRightLeg ? 'Derecho' : 'Izquierdo'}
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Pasos Controlados</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'balance' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'balance' ? 'EQUILIBRIO' : 'CAMBIANDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('⚖️') ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '📉' : feedback.includes('⚖️') ? '🦩' : '👣'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Análisis de Marcha</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Gráfico de Altura */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-center items-end gap-1 h-32">
                    <div className="w-8 bg-slate-100 rounded-t relative h-full">
                        {/* Nivel Suelo */}
                        <div className="absolute bottom-0 w-full h-1 bg-slate-300"></div>
                        
                        {/* Pierna Izquierda */}
                        <div className={`absolute bottom-0 w-full bg-blue-400 transition-all duration-200 rounded-t
                            ${!metrics.isRightLeg ? 'opacity-100' : 'opacity-30'}`}
                             style={{ height: !metrics.isRightLeg ? `${Math.min(100, (180 - metrics.activeHipAngle) * 2)}%` : '5%' }}>
                        </div>
                    </div>
                    <div className="w-8 bg-slate-100 rounded-t relative h-full">
                        {/* Nivel Suelo */}
                        <div className="absolute bottom-0 w-full h-1 bg-slate-300"></div>
                        
                        {/* Pierna Derecha */}
                        <div className={`absolute bottom-0 w-full bg-indigo-500 transition-all duration-200 rounded-t
                            ${metrics.isRightLeg ? 'opacity-100' : 'opacity-30'}`}
                             style={{ height: metrics.isRightLeg ? `${Math.min(100, (180 - metrics.activeHipAngle) * 2)}%` : '5%' }}>
                        </div>
                    </div>
                </div>
                <p className="text-center text-xs text-slate-400">Altura relativa de los pies</p>
            </div>
        </div>
      </div>
    </div>
  );
}