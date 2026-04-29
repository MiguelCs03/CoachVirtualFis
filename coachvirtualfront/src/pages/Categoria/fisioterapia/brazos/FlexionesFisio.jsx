import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Flexiones Terapéuticas (Push-ups Rehab)
 * Enfoque Clínico:
 * 1. Estabilidad Lumbopélvica: Evitar hiperextensión lumbar (colapso de cadera).
 * 2. Alineación Cervical: Evitar adelantamiento excesivo de la cabeza.
 * 3. Rango Controlado: Bajar hasta 90° de codo sin perder la postura.
 */
export default function FlexionesFisio() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Flexiones (Fisioterapia)';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'lowering', 'bottom', 'pushing'
  const [feedback, setFeedback] = useState('Adopta posición de plancha alta');
  const [metrics, setMetrics] = useState({
    elbowFlexion: 0,    // Profundidad
    hipStability: 180,  // Ángulo del cuerpo (debe ser 180)
    isCoreStable: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const historyRef = useRef([]);
  const holdStartRef = useRef(null);
  const coreWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const ELBOW_EXTENDED = 160; // Brazos rectos
  const ELBOW_FLEXED_TARGET = 90; // Meta de profundidad
  
  // Estabilidad de Core (Hombro-Cadera-Rodilla)
  // 180 es recto. < 165 es pico (culo arriba). > 190 es banana (culo abajo).
  const CORE_MIN = 165; 
  const CORE_MAX = 190;

  const HOLD_TIME_MS = 500; // Pausa breve abajo
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // Datos crudos
    // Usamos promedio de ambos lados para robustez o el lado visible
    const rawElbow = (angles.leftElbow + angles.rightElbow) / 2;
    
    // Ángulo de cuerpo (Hombro-Cadera-Rodilla)
    // Si poseUtils no lo da directo, lo calculamos o usamos el que tenga (ej: rightHipAngle)
    // Asumiremos que angles.rightHip es el ángulo del tronco.
    const rawHip = (angles.leftHip + angles.rightHip) / 2;

    // 1. Suavizado
    const updateHistory = (elb, hip) => {
        historyRef.current.push({ elb, hip });
        if (historyRef.current.length > SMOOTH_WINDOW) historyRef.current.shift();
        const avgElb = historyRef.current.reduce((a, b) => a + b.elb, 0) / historyRef.current.length;
        const avgHip = historyRef.current.reduce((a, b) => a + b.hip, 0) / historyRef.current.length;
        return { avgElb, avgHip };
    };
    
    const { avgElb, avgHip } = updateHistory(rawElbow, rawHip);
    const smoothElbow = Math.round(avgElb);
    const smoothHip = Math.round(avgHip);

    // 2. Chequeo de Estabilidad Central (Core)
    let isCoreStable = true;
    if (smoothHip < CORE_MIN) {
        isCoreStable = false;
        if (!coreWarnRef.current) {
            setFeedback('⚠️ Baja la cadera (No hagas pico)');
            speak('Baja la cadera');
            coreWarnRef.current = true;
        }
    } else if (smoothHip > CORE_MAX) {
        isCoreStable = false;
        if (!coreWarnRef.current) {
            setFeedback('⚠️ ¡Sube la cadera! No arquees la espalda');
            speak('Aprieta abdomen');
            coreWarnRef.current = true;
        }
    } else {
        if (coreWarnRef.current) {
            coreWarnRef.current = false;
            setFeedback('✅ Buena plancha. Continúa.');
        }
    }

    setMetrics({
        elbowFlexion: smoothElbow,
        hipStability: smoothHip,
        isCoreStable
    });

    if (!isCoreStable) return; // No contamos reps con mala técnica

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'up' || stage === 'pushing') {
        // Iniciar bajada
        if (smoothElbow < ELBOW_EXTENDED - 15) {
            setStage('lowering');
            setFeedback('Baja lento, codos a 45 grados...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'lowering') {
        // Llegar al fondo (90 grados es suficiente en rehab)
        if (smoothElbow <= ELBOW_FLEXED_TARGET + 10) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('bottom');
                 setFeedback('🛑 Pausa. Empuja el suelo.');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'bottom') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 200) {
            setStage('pushing');
            setFeedback('Sube manteniendo la plancha.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'pushing') {
        // Vuelta arriba
        if (smoothElbow > ELBOW_EXTENDED) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición válida.');
                 speak((repCount + 1).toString());
                 setStage('up');
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
                <div className="text-7xl">🤸</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Estabilización de Core y Hombro
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Comienza en posición de plancha alta (manos bajo hombros).</li>
                <li><strong>Prioridad:</strong> Mantener el cuerpo como una tabla rígida.</li>
                <li>Baja el pecho hacia el suelo doblando los codos.</li>
                <li>Si no puedes mantener la espalda recta, apoya las rodillas.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Iniciar Sesión
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Cadena Cinética Cerrada</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Indicador de Alineación Corporal */}
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl backdrop-blur-md border shadow-sm transition-all
                        ${metrics.isCoreStable ? 'bg-white/90 border-green-400 text-green-700' : 'bg-red-50/90 border-red-400 text-red-800'}`}>
                        <div className="text-[10px] uppercase font-bold mb-1">Alineación Espalda</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{metrics.hipStability}°</span>
                            <span className="text-xs">{metrics.isCoreStable ? '✅ TABLA' : '⚠️ ARQUEADO'}</span>
                        </div>
                    </div>
                </div>

                {/* Panel de Profundidad */}
                <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
                    <div className="flex-1">
                        <div className="flex justify-between text-sm text-slate-500 mb-2">
                            <span>Flexión Codos</span>
                            <span className="font-bold text-slate-800">{metrics.elbowFlexion}°</span>
                        </div>
                        {/* Barra inversa (180 es extendido, 90 es meta) */}
                        <div className="h-4 bg-slate-100 rounded-full overflow-hidden relative">
                            <div className="absolute left-0 w-[50%] h-full bg-green-100 border-r border-green-300"></div>
                            <div className={`absolute right-0 h-full transition-all duration-200 rounded-l-full bg-indigo-500`}
                                style={{ 
                                    width: `${Math.min(100, Math.max(0, (metrics.elbowFlexion - 90) / 90 * 100))}%` 
                                }}>
                            </div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>90° (Meta)</span>
                            <span>180° (Inicio)</span>
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
                            ${stage === 'bottom' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'bottom' ? 'PAUSA' : 'MOVIENDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '🧱' : feedback.includes('✅') ? '🎯' : '📢'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Corrección IA</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Visualizador de Plancha */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Postura de Plancha</h4>
                    <div className="relative w-full h-16 flex items-center justify-center">
                        {/* Línea Ideal */}
                        <div className="absolute w-full h-0.5 bg-slate-200 border-t border-dashed border-slate-400 top-1/2"></div>
                        
                        {/* Cuerpo Simulado */}
                        <div className={`w-24 h-1 transition-all duration-300 origin-center rounded-full
                            ${metrics.isCoreStable ? 'bg-green-500 h-2' : 'bg-red-500 h-2 rotate-12'}`}
                             style={{ 
                                 transform: `rotate(${metrics.hipStability - 180}deg)` // Rotación basada en error
                             }}>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-400">Mantén la línea verde horizontal</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}