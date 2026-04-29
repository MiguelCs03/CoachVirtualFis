import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Rotación de Antebrazo con Bastón (Pronosupinación)
 * Enfoque Clínico:
 * 1. Estabilización del Húmero: El codo debe estar pegado al torso (Aducción).
 * 2. Ángulo Funcional: El codo debe mantenerse a 90° de flexión.
 * 3. Control: Dado que la cámara no detecta la rotación de muñeca perfectamente sin ver el bastón,
 * la IA se centra en garantizar que la "base" (el codo y el hombro) esté inmóvil para que el movimiento sea puro.
 */
export default function RotacionAntebrazoBaston() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Rotación de antebrazo con bastón';

  // --- THERAPY STATE ---
  const [cycleCount, setCycleCount] = useState(0);
  const [stage, setStage] = useState('neutral'); // 'neutral', 'supinating', 'pronating'
  const [feedback, setFeedback] = useState('Pega el codo al cuerpo y dobla a 90°');
  const [metrics, setMetrics] = useState({
    elbowAngle: 180,    // Debe ser ~90
    elbowSeparation: 0, // Distancia codo-cuerpo
    isStable: false
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const elbowHistoryRef = useRef([]);
  const stageTimerRef = useRef(null); // Para guiar el tiempo de rotación
  const stabilityWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const TARGET_ELBOW_FLEXION = 90; 
  const FLEXION_TOLERANCE = 15; // 75° a 105° permitido
  
  // Tolerancia de separación del codo (Abducción compensatoria)
  // Usamos coordenadas relativas.
  const MAX_SEPARATION = 0.12; 

  const HOLD_TIME_MS = 3000; // 3 segundos para rotar lento
  const SMOOTH_WINDOW = 8;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Detectar lado activo (el que tiene el codo flexionado cerca de 90)
    const rFlex = Math.abs(angles.rightElbow - 90);
    const lFlex = Math.abs(angles.leftElbow - 90);
    const isRightActive = rFlex < lFlex;

    // Datos del lado activo
    const activeElbowAngle = isRightActive ? angles.rightElbow : angles.leftElbow;
    const shoulder = isRightActive ? landmarks[12] : landmarks[11];
    const elbow = isRightActive ? landmarks[14] : landmarks[13];
    const hip = isRightActive ? landmarks[24] : landmarks[23];

    // 2. Suavizado
    const updateHistory = (val) => {
        elbowHistoryRef.current.push(val);
        if (elbowHistoryRef.current.length > SMOOTH_WINDOW) elbowHistoryRef.current.shift();
        return elbowHistoryRef.current.reduce((a, b) => a + b, 0) / elbowHistoryRef.current.length;
    };
    const smoothAngle = Math.round(updateHistory(activeElbowAngle));

    // 3. Validar Estabilidad (El "Cepo")
    // A: Ángulo de 90 grados
    const isAngleCorrect = Math.abs(smoothAngle - TARGET_ELBOW_FLEXION) < FLEXION_TOLERANCE;
    
    // B: Codo pegado al cuerpo (Comparar X del codo con línea Hombro-Cadera)
    let separation = 0;
    if (shoulder && elbow && hip) {
        // Promedio X de hombro y cadera para estimar linea lateral del torso
        const torsoX = (shoulder.x + hip.x) / 2;
        separation = Math.abs(elbow.x - torsoX);
    }
    const isElbowGlued = separation < MAX_SEPARATION;

    const isStable = isAngleCorrect && isElbowGlued;

    setMetrics({
        elbowAngle: smoothAngle,
        elbowSeparation: separation,
        isStable
    });

    // Feedback de Estabilidad
    if (!isStable) {
        if (!stabilityWarnRef.current) {
            if (!isAngleCorrect) setFeedback(`⚠️ Dobla el codo a 90° (Estás en ${smoothAngle}°)`);
            else setFeedback('⚠️ ¡Pega el codo a las costillas!');
            
            speak('Corrige la postura');
            stabilityWarnRef.current = true;
        }
        // Si la postura es mala, el ciclo no avanza
        return; 
    } else {
        if (stabilityWarnRef.current) {
            stabilityWarnRef.current = false;
            setFeedback('✅ Postura perfecta. Rota el bastón.');
        }
    }

    // 4. Máquina de Estados Temporizada (Pacer)
    // Como no detectamos la rotación del bastón con precisión, la IA actúa como metrónomo
    // que solo avanza si la estabilidad es correcta.
    const now = Date.now();

    if (!stageTimerRef.current) stageTimerRef.current = now;
    const elapsed = now - stageTimerRef.current;

    if (stage === 'neutral') {
        setFeedback('Gira la palma hacia ARRIBA (Supinación)...');
        if (elapsed > 1000) {
            setStage('supinating');
            stageTimerRef.current = now;
        }
    }
    else if (stage === 'supinating') {
        // Tiempo para realizar el giro
        if (elapsed > HOLD_TIME_MS) {
            setStage('pronating');
            setFeedback('Gira la palma hacia ABAJO (Pronación)...');
            speak('Abajo');
            stageTimerRef.current = now;
        }
    }
    else if (stage === 'pronating') {
        // Tiempo para realizar el giro
        if (elapsed > HOLD_TIME_MS) {
            setCycleCount(c => c + 1);
            speak((cycleCount + 1).toString());
            setStage('neutral');
            setFeedback('Vuelve al centro');
            stageTimerRef.current = now;
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
                <div className="text-7xl">🥢</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Movilidad de Muñeca/Codo
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Sostén el bastón por el centro o un extremo.</li>
                <li><strong>Regla de Oro:</strong> El codo no debe separarse de tu cuerpo.</li>
                <li>Gira la muñeca lento: Palma arriba (lleva el bastón afuera) - Palma abajo (lleva el bastón adentro).</li>
                <li>La IA verificará que tu brazo esté estable.</li>
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Pronosupinación</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Estabilidad */}
                    <div className={`absolute top-4 left-1/2 transform -translate-x-1/2 px-6 py-2 rounded-full shadow-lg backdrop-blur-md border-2 transition-all
                        ${metrics.isStable ? 'bg-white/90 border-green-400 text-green-700' : 'bg-red-50/90 border-red-400 text-red-700 animate-pulse'}`}>
                        <span className="text-sm font-bold flex items-center gap-2">
                            {metrics.isStable ? '🛡️ BRAZO ESTABILIZADO' : '⚠️ CODO DESPEGADO'}
                        </span>
                    </div>

                    {/* Indicador de Ángulo */}
                    <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm">
                        <div className="text-[10px] uppercase font-bold text-slate-500">Ángulo Codo</div>
                        <div className={`text-xl font-mono font-bold ${Math.abs(metrics.elbowAngle - 90) < 15 ? 'text-green-600' : 'text-red-500'}`}>
                            {metrics.elbowAngle}°
                        </div>
                        <div className="text-[10px] text-slate-400">Meta: 90°</div>
                    </div>
                </div>
            </div>

            {/* PANEL LATERAL */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Ciclos Completos</h3>
                    <div className="text-6xl font-medium text-slate-800">{cycleCount}</div>
                    
                    {/* Indicador de Fase Activa */}
                    <div className="mt-6 flex justify-center gap-2">
                        <div className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex flex-col items-center
                            ${stage === 'supinating' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50 text-slate-400'}`}>
                            <span>🤲</span>
                            <span>ARRIBA</span>
                        </div>
                        <div className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-300 flex flex-col items-center
                            ${stage === 'pronating' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 scale-110' : 'bg-slate-50 text-slate-400'}`}>
                            <span>🙌</span>
                            <span>ABAJO</span>
                        </div>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '⚓' : feedback.includes('✅') ? '✨' : '⏳'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Guía de Movimiento</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Visualizador de Estabilidad "Cepo" */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Monitor de Codo</h4>
                    <div className="relative w-full h-12 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                        {/* Zona Segura (Centro) */}
                        <div className="absolute left-0 h-full bg-green-100 border-r border-green-300 w-[30%] flex items-center justify-center text-[9px] text-green-800 font-bold">
                            PEGADO
                        </div>
                        {/* Zona Peligro */}
                        <div className="absolute right-0 h-full bg-red-50 w-[70%] flex items-center justify-end pr-2 text-[9px] text-red-300 font-bold">
                            SEPARADO
                        </div>
                        
                        {/* Indicador */}
                        <div className="absolute top-0 h-full w-1 bg-slate-800 transition-all duration-300 shadow-sm z-10"
                             style={{ left: `${Math.min(100, (metrics.elbowSeparation / 0.2) * 100)}%` }}>
                        </div>
                    </div>
                    <p className="text-xs mt-2 text-slate-400 text-center">Mantén el indicador en la zona verde</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}