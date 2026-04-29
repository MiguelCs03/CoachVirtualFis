import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Estiramiento con Manos Juntas (Overhead Stretch)
 * Enfoque Clínico:
 * 1. Elongación Axial: Extender los brazos al máximo hacia arriba.
 * 2. Codos Rectos: Evitar flexión de codos para garantizar estiramiento de dorsales.
 * 3. Tiempo de Estiramiento: Mantener la posición (Hold) sin dolor.
 */
export default function EstiramientoManosJuntas() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Estiramiento con manos juntas';

  // --- THERAPY STATE ---
  const [timeLeft, setTimeLeft] = useState(30); // Meta: 30 segundos de estiramiento acumulado
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState('Entrelaza las manos y sube');
  const [metrics, setMetrics] = useState({
    armExtension: 0,    // Ángulo promedio de hombro (Flexión)
    elbowStraightness: 0, // Ángulo de codo (180 es recto)
    isEffective: false
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const armHistoryRef = useRef([]);
  const effectiveTimeStartRef = useRef(null);
  const lastSpeechTime = useRef(0);

  // --- UMBRALES CLÍNICOS ---
  const MIN_SHOULDER_FLEXION = 160; // Brazos casi verticales
  const MIN_ELBOW_EXTENSION = 165;  // Codos rectos
  
  const SMOOTH_WINDOW = 10;

  // Cronómetro Terapéutico (Solo cuenta si es efectivo)
  useEffect(() => {
    let interval;
    if (started && !isFinished) {
      interval = setInterval(() => {
        if (metrics.isEffective) {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsFinished(true);
              speak('Estiramiento completado. Relaja.');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started, isFinished, metrics.isEffective, speak]);

  const handlePoseDetected = (landmarks) => {
    if (isFinished) return;

    const angles = calculateBodyAngles(landmarks);
    
    // 1. Calcular Flexión de Hombro (Verticalidad)
    // Ángulo entre tronco y brazo. 180 es brazo arriba alineado con tronco.
    // poseUtils suele dar ángulo axilar. 
    // Asumimos que angles.rightShoulder es el ángulo axilar (0 brazo abajo, 180 brazo arriba).
    const rawShoulder = (angles.rightShoulder + angles.leftShoulder) / 2;
    
    // 2. Calcular Extensión de Codo
    const rawElbow = (angles.rightElbow + angles.leftElbow) / 2;

    // 3. Suavizado
    const updateHistory = (sho, elb) => {
        armHistoryRef.current.push({ sho, elb });
        if (armHistoryRef.current.length > SMOOTH_WINDOW) armHistoryRef.current.shift();
        const avgSho = armHistoryRef.current.reduce((a, b) => a + b.sho, 0) / armHistoryRef.current.length;
        const avgElb = armHistoryRef.current.reduce((a, b) => a + b.elb, 0) / armHistoryRef.current.length;
        return { avgSho, avgElb };
    };
    
    const { avgSho, avgElb } = updateHistory(rawShoulder, rawElbow);
    const smoothShoulder = Math.round(avgSho);
    const smoothElbow = Math.round(avgElb);

    // 4. Validación de Calidad
    let isEffective = false;
    let statusMsg = '';

    // Check Codos
    if (smoothElbow < MIN_ELBOW_EXTENSION) {
        statusMsg = '⚠️ Estira los codos completamente';
        isEffective = false;
    } 
    // Check Hombros
    else if (smoothShoulder < MIN_SHOULDER_FLEXION) {
        statusMsg = '⚠️ Sube más los brazos (hacia el techo)';
        isEffective = false;
    } 
    else {
        statusMsg = '✨ Mantén el estiramiento...';
        isEffective = true;
    }

    // Control de voz
    const now = Date.now();
    if (!isEffective && now - lastSpeechTime.current > 4000) {
        if (statusMsg.includes('codos')) speak('Estira los codos');
        if (statusMsg.includes('Sube')) speak('Arriba, más arriba');
        lastSpeechTime.current = now;
    }

    setFeedback(statusMsg);
    setMetrics({
        armExtension: smoothShoulder,
        elbowStraightness: smoothElbow,
        isEffective
    });
  };

  // --- VISTA DE FINALIZACIÓN ---
  if (isFinished) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full border border-green-100">
              <div className="text-6xl mb-4">🧘‍♂️</div>
              <h2 className="text-3xl font-bold text-slate-800 mb-2">Sesión Finalizada</h2>
              <p className="text-slate-600 mb-6">Has completado 30 segundos de estiramiento efectivo.</p>
              <button onClick={() => {setStarted(false); setIsFinished(false); setTimeLeft(30);}} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-lg shadow-green-200">
                  Volver al Menú
              </button>
          </div>
      </div>
    );
  }

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
                <div className="text-7xl">👐</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Movilidad de Columna y Hombros
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Objetivo Terapéutico:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Entrelaza los dedos y gira las palmas hacia el techo.</li>
                <li>Extiende los brazos completamente hasta que los codos estén rectos.</li>
                <li>Mantén la posición durante <strong>30 segundos</strong> efectivos.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Iniciar Estiramiento
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">Flexibilidad Activa</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Cancelar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Indicador de Eficacia */}
                    <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl backdrop-blur-md border shadow-sm transition-all
                        ${metrics.isEffective ? 'bg-green-100/90 border-green-400 text-green-800' : 'bg-slate-100/90 border-slate-300 text-slate-500'}`}>
                        <div className="text-[10px] uppercase font-bold mb-1">Calidad</div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-bold">{metrics.isEffective ? 'EFECTIVO' : 'AJUSTANDO'}</span>
                            <span className="text-xl">{metrics.isEffective ? '✨' : '🔧'}</span>
                        </div>
                    </div>
                </div>

                {/* Panel de Control Articular */}
                <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex justify-around">
                    <div className="text-center">
                        <span className="text-xs text-slate-400 uppercase font-bold">Verticalidad</span>
                        <div className={`text-2xl font-mono font-bold ${metrics.armExtension >= MIN_SHOULDER_FLEXION ? 'text-green-600' : 'text-amber-500'}`}>
                            {metrics.armExtension}°
                        </div>
                        <div className="text-[10px] text-slate-400">Meta: 160°+</div>
                    </div>
                    <div className="w-px bg-slate-100 h-10"></div>
                    <div className="text-center">
                        <span className="text-xs text-slate-400 uppercase font-bold">Extensión Codos</span>
                        <div className={`text-2xl font-mono font-bold ${metrics.elbowStraightness >= MIN_ELBOW_EXTENSION ? 'text-green-600' : 'text-amber-500'}`}>
                            {metrics.elbowStraightness}°
                        </div>
                        <div className="text-[10px] text-slate-400">Meta: 165°+</div>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                {/* Cronómetro de Tiempo Efectivo */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-green-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Tiempo Efectivo</h3>
                    
                    <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                            <circle cx="50" cy="50" r="45" fill="none" stroke={metrics.isEffective ? "#22c55e" : "#cbd5e1"} strokeWidth="8" 
                                    strokeDasharray="283" 
                                    strokeDashoffset={283 - (283 * timeLeft) / 30}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-linear transform -rotate-90 origin-center" />
                        </svg>
                        <div className="text-4xl font-bold text-slate-800 z-10">
                            {timeLeft}<span className="text-sm text-slate-400 font-normal">s</span>
                        </div>
                    </div>
                    
                    <p className={`mt-4 text-sm font-medium transition-colors
                        ${metrics.isEffective ? 'text-green-600 animate-pulse' : 'text-slate-400'}`}>
                        {metrics.isEffective ? '⏳ Contando...' : '⏸️ Pausado (Mejora postura)'}
                    </p>
                </div>

                {/* Feedback Box */}
                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✨') ? 'bg-indigo-50 border-indigo-200 text-indigo-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '📏' : feedback.includes('✨') ? '🧘' : 'ℹ️'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Corrección Postural</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}