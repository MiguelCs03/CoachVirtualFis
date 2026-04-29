import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Sentadillas Terapéuticas (Squat Therapy)
 * Enfoque Clínico:
 * 1. Alineación Valgo/Varo: Las rodillas no deben colapsar hacia adentro.
 * 2. Profundidad Funcional: Buscar 90° de flexión de rodilla (Paralelo).
 * 3. Control de Tronco: Evitar flexión excesiva del tronco hacia adelante.
 */
export default function SentadillasRodilla() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Sentadillas';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('stand'); // 'stand', 'descending', 'parallel_hold', 'ascending'
  const [feedback, setFeedback] = useState('Pies al ancho de hombros, vista al frente');
  const [metrics, setMetrics] = useState({
    kneeFlexion: 180,   // Profundidad (Promedio)
    kneeDistance: 0,    // Para detectar valgo
    isValgus: false,    // Alerta de rodillas juntas
    depthReached: false // Check visual de meta
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const kneeHistoryRef = useRef([]);
  const hipWidthRef = useRef(null); // Calibración ancho de cadera
  const holdStartRef = useRef(null);
  const valgusWarnRef = useRef(false);

  // --- UMBRALES CLÍNICOS ---
  const STANDING_ANGLE = 165;
  const PARALLEL_TARGET = 90;   // Meta terapéutica estándar
  const MIN_SAFE_ANGLE = 70;    // No bajar más de esto sin supervisión
  
  // Tolerancia de Valgo (Relación Ancho Rodillas / Ancho Caderas)
  // Si rodillas < 0.8 * Caderas, es colapso.
  const VALGUS_RATIO_LIMIT = 0.85; 

  const HOLD_TIME_MS = 1000; // Pausa breve abajo para control
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // Datos crudos para análisis espacial
    const lHip = landmarks[23];
    const rHip = landmarks[24];
    const lKnee = landmarks[25];
    const rKnee = landmarks[26];

    // 1. Suavizado de Ángulo (Profundidad)
    const rawKneeFlex = (angles.rightKnee + angles.leftKnee) / 2;
    
    const updateHistory = (val) => {
        kneeHistoryRef.current.push(val);
        if (kneeHistoryRef.current.length > SMOOTH_WINDOW) kneeHistoryRef.current.shift();
        return kneeHistoryRef.current.reduce((a, b) => a + b, 0) / kneeHistoryRef.current.length;
    };
    const smoothFlexion = Math.round(updateHistory(rawKneeFlex));

    // 2. Detección de Valgo (Rodillas hacia adentro)
    let isValgus = false;
    let currentKneeDist = 0;
    
    if (lHip && rHip && lKnee && rKnee) {
        const hipWidth = Math.abs(lHip.x - rHip.x);
        currentKneeDist = Math.abs(lKnee.x - rKnee.x);
        
        // Calibrar ancho de cadera al estar de pie
        if (stage === 'stand' && smoothFlexion > 170) {
            hipWidthRef.current = hipWidth;
        }

        // Chequeo dinámico: Si bajamos y las rodillas se juntan mucho más que las caderas
        if (smoothFlexion < 140) { // Solo chequeamos durante la flexión
            const ratio = currentKneeDist / (hipWidthRef.current || hipWidth);
            if (ratio < VALGUS_RATIO_LIMIT) {
                isValgus = true;
            }
        }
    }

    // Feedback de Valgo (Prioridad Alta)
    if (isValgus) {
        if (!valgusWarnRef.current) {
            setFeedback('⚠️ ¡Separa las rodillas! No dejes que se junten.');
            speak('Rodillas afuera');
            valgusWarnRef.current = true;
        }
    } else {
        if (valgusWarnRef.current) {
            valgusWarnRef.current = false;
            setFeedback('✅ Buena alineación.');
        }
    }

    setMetrics({
        kneeFlexion: smoothFlexion,
        kneeDistance: currentKneeDist,
        isValgus,
        depthReached: smoothFlexion <= PARALLEL_TARGET + 5
    });

    // 3. Máquina de Estados
    const now = Date.now();

    if (stage === 'stand' || stage === 'ascending') {
        if (smoothFlexion < STANDING_ANGLE - 10) {
            setStage('descending');
            setFeedback('Baja la cadera hacia atrás y abajo...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'descending') {
        // Chequear profundidad
        if (smoothFlexion <= PARALLEL_TARGET + 5) {
             // Validar si baja demasiado (riesgo)
             if (smoothFlexion < MIN_SAFE_ANGLE) {
                 setFeedback('🛑 ¡Muy profundo! Sube un poco.');
             } else {
                 // Zona correcta
                 if (!holdStartRef.current) {
                     holdStartRef.current = now;
                 } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                     setStage('parallel_hold');
                     setFeedback('⏱️ Sostén... Pecho arriba.');
                     speak('Sostén');
                     holdStartRef.current = null;
                 }
             }
        }
    }
    else if (stage === 'parallel_hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        
        if (now - holdStartRef.current >= 500) {
            setStage('ascending');
            setFeedback('Empuja el suelo con los talones para subir.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'ascending') {
        if (smoothFlexion > STANDING_ANGLE) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Excelente control.');
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
                <div className="text-7xl">🏋️‍♀️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                      Reeducación de Patrón de Sentadilla
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Puntos de Control:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li><strong>Rodillas:</strong> Deben seguir la línea de los dedos del pie (¡No juntarlas!).</li>
                <li><strong>Profundidad:</strong> Baja hasta que los muslos estén paralelos al suelo (90°).</li>
                <li><strong>Espalda:</strong> Mantén la curva natural, no te encorves.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200">
                Comenzar Sesión
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded font-medium">Fortalecimiento Funcional</span>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-slate-500 hover:text-slate-800 underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Alerta de Valgo (Rodillas Juntas) */}
                    {metrics.isValgus && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 pointer-events-none animate-pulse">
                            <div className="bg-red-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                                ↔️ SEPARA LAS RODILLAS
                            </div>
                        </div>
                    )}

                    {/* Indicador de Meta (Paralelo) */}
                    <div className={`absolute bottom-4 right-4 px-4 py-2 rounded-xl backdrop-blur-md border shadow-sm transition-all
                        ${metrics.depthReached ? 'bg-green-500 text-white' : 'bg-white/90 text-slate-600'}`}>
                        <div className="text-xs font-bold uppercase mb-1">Profundidad</div>
                        <div className="text-2xl font-mono font-bold">{Math.abs(180 - metrics.kneeFlexion)}°</div>
                        <div className="text-[10px]">{metrics.depthReached ? '¡OBJETIVO!' : 'Baja más (90°)'}</div>
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
                            ${stage === 'parallel_hold' ? 'bg-green-500' : 'bg-slate-300 text-slate-600'}`}>
                            {stage === 'parallel_hold' ? 'MANTÉN ABJ' : stage === 'descending' ? 'BAJANDO' : 'SUBIENDO'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') || feedback.includes('🛑') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '👁️' : feedback.includes('✅') ? '🌟' : '💬'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Coach IA</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Semáforo de Profundidad */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-4 text-sm">Zona de Trabajo</h4>
                    <div className="relative w-16 h-32 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        {/* Zonas */}
                        <div className="absolute bottom-0 w-full h-[20%] bg-red-200 opacity-50"></div> {/* Muy profundo */}
                        <div className="absolute bottom-[20%] w-full h-[30%] bg-green-200 opacity-50 border-t border-b border-green-300"></div> {/* Zona Meta */}
                        
                        {/* Bola Indicadora */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 bg-indigo-600 rounded-full shadow-lg transition-all duration-300 ease-out flex items-center justify-center text-white text-[10px] font-bold"
                             style={{ 
                                 top: `${Math.min(90, Math.max(0, (metrics.kneeFlexion - 60) / 120 * 100))}%` 
                             }}>
                             YO
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">Lleva la bola a la zona verde.</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}