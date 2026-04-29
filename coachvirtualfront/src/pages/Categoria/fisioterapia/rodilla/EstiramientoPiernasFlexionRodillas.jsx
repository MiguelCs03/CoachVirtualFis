import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Estiramiento 90-90 (Isquiotibiales/Ciático)
 * Enfoque Clínico:
 * 1. Posición Inicial: Cadera a 90° (Muslos verticales) y Rodillas a 90° (Mesa).
 * 2. Estabilidad: El ángulo de la cadera NO debe cambiar mientras la rodilla se extiende.
 * 3. Objetivo: Extender la rodilla hasta sentir tensión suave (no dolor).
 */
export default function EstiramientoPiernasFlexionRodillas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Estiramiento 90-90';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('setup'); // 'setup', 'tabletop', 'extending', 'hold', 'flexing'
  const [feedback, setFeedback] = useState('Acuéstate y levanta las piernas a 90°');
  const [metrics, setMetrics] = useState({
    hipAngle: 90,       // Estabilidad del muslo (Debe ser ~90)
    kneeAngle: 90,      // Rango de movimiento
    isHipStable: false
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const hipHistoryRef = useRef([]);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const stabilityWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  // Cadera (Estabilidad)
  const HIP_TARGET = 90;
  const HIP_TOLERANCE = 15; // 75° a 105° es aceptable
  
  // Rodilla (Movimiento)
  const KNEE_FLEXION_START = 100; // Posición de mesa (~90 grados)
  const KNEE_EXTENSION_TARGET = 150; // Meta inicial de estiramiento (variable según flexibilidad)

  const HOLD_TIME_MS = 2000; // 2 segundos de estiramiento activo
  const SMOOTH_WINDOW = 8;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    // Promedio de ambas piernas para evaluar simetría global o usar la más visible
    // En vista lateral (perfil), usamos el lado visible.
    // Asumiremos promedio para simplificar la detección bilateral.
    
    const rawHip = (angles.rightHip + angles.leftHip) / 2;
    const rawKnee = (angles.rightKnee + angles.leftKnee) / 2;

    // 1. Suavizado
    const updateHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothHip = Math.round(updateHistory(hipHistoryRef, rawHip));
    const smoothKnee = Math.round(updateHistory(kneeHistoryRef, rawKnee));

    // 2. Chequeo de Estabilidad de Cadera (El fémur debe estar vertical)
    // En posición supina, un ángulo de cadera de 90 significa piernas perpendiculares al tronco.
    const isHipStable = Math.abs(smoothHip - HIP_TARGET) < HIP_TOLERANCE;

    setMetrics({
        hipAngle: smoothHip,
        kneeAngle: smoothKnee,
        isHipStable
    });

    // Feedback de Estabilidad
    if (!isHipStable && stage !== 'setup') {
        if (!stabilityWarnRef.current) {
            if (smoothHip > HIP_TARGET + HIP_TOLERANCE) setFeedback('⚠️ Sube más los muslos (90°)');
            else setFeedback('⚠️ No acerques tanto las rodillas al pecho');
            stabilityWarnRef.current = true;
        }
        return; // Pausar lógica de repetición si no hay estabilidad
    } else {
        stabilityWarnRef.current = false;
    }

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'setup') {
        if (isHipStable && smoothKnee < 110) {
            setStage('tabletop');
            setFeedback('✅ Posición correcta. Extiende las piernas hacia el techo.');
            speak('Ahora extiende hacia arriba');
        }
    }
    else if (stage === 'tabletop' || stage === 'flexing') {
        // Iniciar extensión
        if (smoothKnee > 120) {
            setStage('extending');
            setFeedback('Siente el estiramiento detrás del muslo...');
        }
    }
    else if (stage === 'extending') {
        // Llegar al máximo rango posible del paciente
        if (smoothKnee > KNEE_EXTENSION_TARGET) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('🧘 Mantén el estiramiento...');
                 speak('Mantén');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        
        if (now - holdStartRef.current >= 1000) {
            setStage('flexing');
            setFeedback('Flexiona suavemente a la posición inicial.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'flexing') {
        // Volver a 90 grados
        if (smoothKnee < KNEE_FLEXION_START) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Relaja. Repite.');
                 speak((repCount + 1).toString());
                 setStage('tabletop');
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
                <div className="text-7xl">🤸‍♂️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Neurodinamia / Estiramiento Activo
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Puntos Clave:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Acuéstate boca arriba. Eleva las piernas como si estuvieran sobre una silla (90-90).</li>
                <li><strong>Mantén los muslos verticales</strong> inmóviles.</li>
                <li>Estira las rodillas hacia el techo hasta sentir una tensión suave (no dolor).</li>
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Movilidad Cadena Posterior</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Indicador de Estabilidad de Cadera */}
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl backdrop-blur-md border shadow-sm transition-all
                        ${metrics.isHipStable ? 'bg-white/90 border-green-400 text-green-700' : 'bg-amber-50/90 border-amber-400 text-amber-800'}`}>
                        <div className="text-[10px] uppercase font-bold mb-1">Estabilidad Muslo</div>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{metrics.hipAngle}°</span>
                            <span className="text-xs">{metrics.isHipStable ? '✅ ESTABLE' : '⚠️ CORRIGE'}</span>
                        </div>
                    </div>
                </div>

                {/* Visualizador de Extensión */}
                <div className="mt-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-bold text-slate-600">Extensión de Rodilla</span>
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500">Meta: 150°+</span>
                    </div>
                    
                    {/* Gráfico de arco simplificado */}
                    <div className="relative h-32 flex justify-center items-end overflow-hidden">
                        {/* Fondo arco */}
                        <div className="w-64 h-64 border-t-[20px] border-slate-100 rounded-full absolute top-10"></div>
                        
                        {/* Aguja */}
                        <div className="w-1 h-32 bg-slate-300 origin-bottom absolute bottom-0 transition-transform duration-300"
                             style={{ transform: `rotate(${metrics.kneeAngle - 90 - 90}deg)` }}> {/* Ajuste visual: 90deg es horizontal */}
                             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full shadow-lg"></div>
                        </div>
                        
                        {/* Texto central */}
                        <div className="z-10 mb-2 text-center">
                            <div className="text-3xl font-mono font-light text-indigo-600">{metrics.kneeAngle}°</div>
                            <div className="text-[10px] text-slate-400">90° = Flexión</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Ciclos Completados</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'hold' ? 'bg-green-500' : 'bg-slate-400'}`}>
                            {stage === 'hold' ? 'ESTIRANDO' : 'MOVILIZANDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '☝️' : feedback.includes('✅') ? '👏' : '👂'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Guía Vocal</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Chequeo de Postura</h4>
                    <ul className="space-y-3 text-xs text-slate-500">
                        <li className="flex items-center justify-between">
                            <span>Muslos Verticales</span>
                            <span className={metrics.isHipStable ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                {metrics.isHipStable ? "OK" : "DESVIADO"}
                            </span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Rodillas</span>
                            <span>Busca extender sin dolor</span>
                        </li>
                        <li className="flex items-center justify-between">
                            <span>Cabeza/Cuello</span>
                            <span>Relajados en el suelo</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}