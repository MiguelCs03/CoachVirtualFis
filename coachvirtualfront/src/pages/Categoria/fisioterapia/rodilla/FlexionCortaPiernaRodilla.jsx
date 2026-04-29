import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Flexión Corta de Pierna (Heel Slides) - Enfoque Fisioterapia
 * Objetivos:
 * 1. Ganar Rango de Movimiento (ROM) en flexión de rodilla.
 * 2. Control motor: Deslizamiento suave del talón.
 * 3. Detectar la pierna que trabaja automáticamente (la que se flexiona).
 */
export default function FlexionCortaPiernaRodilla() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Flexión corta de pierna';

  // --- PHYISIO STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('extended'); // 'extended', 'flexing', 'hold_max', 'extending'
  const [feedback, setFeedback] = useState('Acuéstate y relaja las piernas');
  const [metrics, setMetrics] = useState({
    activeKneeAngle: 180, // Ángulo actual
    maxFlexion: 180,      // Mejor flexión lograda en la rep actual
    isRightActive: true   // Lado detectado
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const kneeHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  
  // --- UMBRALES CLÍNICOS ---
  const EXTENSION_TARGET = 165; // Pierna estirada (casi 180)
  const FLEXION_START = 150;    // Umbral para detectar inicio de movimiento
  const TARGET_FLEXION = 90;    // Meta inicial estándar (ajustable según paciente)
  
  const HOLD_TIME_MS = 1500;    // Tiempo de retención para estirar (1.5s)
  const SMOOTH_WINDOW = 8;      // Suavizado alto para movimientos lentos de rehab

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightKnee, leftKnee } = angles;

    // 1. Detección Automática de Lado Activo
    // La pierna que se flexiona más (ángulo menor) es la activa
    const isRight = rightKnee < leftKnee;
    const activeAngleRaw = isRight ? rightKnee : leftKnee;

    // 2. Suavizado de Datos (Crucial en rehab para no saltar números)
    const updateHistory = (val) => {
        kneeHistoryRef.current.push(val);
        if (kneeHistoryRef.current.length > SMOOTH_WINDOW) kneeHistoryRef.current.shift();
        return kneeHistoryRef.current.reduce((a, b) => a + b, 0) / kneeHistoryRef.current.length;
    };

    const smoothKnee = Math.round(updateHistory(activeAngleRaw));

    // Actualizar métricas visuales
    setMetrics(prev => ({
        activeKneeAngle: smoothKnee,
        isRightActive: isRight,
        // Si estamos flexionando, guardamos el pico máximo (mínimo ángulo)
        maxFlexion: (stage === 'flexing' || stage === 'hold_max') ? Math.min(prev.maxFlexion, smoothKnee) : 180
    }));

    // 3. Máquina de Estados Terapéutica
    const now = Date.now();

    if (stage === 'extended' || stage === 'extending') {
        // Detectar inicio de flexión (deslizar talón)
        if (smoothKnee < FLEXION_START) {
            setStage('flexing');
            setFeedback('Desliza el talón suavemente hacia ti...');
            speak('Dobla suave');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'flexing') {
        // Monitorear progreso
        if (smoothKnee < TARGET_FLEXION + 5) {
             // Ha llegado a un buen rango, verificar si sostiene
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
                 setFeedback('🛑 Mantén ahí... Siente la rodilla.');
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold_max');
                 setFeedback('✨ ¡Buen rango! Extiende despacio.');
                 speak('Extiende despacio');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold_max') {
        // Usuario comienza a estirar
        if (smoothKnee > TARGET_FLEXION + 15) {
            setStage('extending');
            setFeedback('Controla el regreso, sin dejar caer la pierna.');
        }
    }
    else if (stage === 'extending') {
        // Vuelta a extensión completa
        if (smoothKnee > EXTENSION_TARGET) {
             // Pequeño debounce para no contar doble
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición completada. Relaja.');
                 speak((repCount + 1).toString());
                 setStage('extended');
                 holdStartRef.current = null;
             }
        }
    }
  };

  // Colores clínicos (Azul calma, Verde éxito, Naranja precaución)
  const getProgressColor = () => {
      if (metrics.activeKneeAngle < TARGET_FLEXION) return 'bg-green-500'; // Meta alcanzada
      if (stage === 'flexing') return 'bg-blue-500';
      return 'bg-gray-300';
  };

  // --- VISTA PREVIA ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
            <div className="h-64 bg-blue-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-6xl">🦵</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-white/80 backdrop-blur px-3 py-1 rounded-full text-sm text-blue-800 font-semibold shadow-sm">
                      Fisioterapia & Movilidad
                  </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Objetivos Clínicos:</h3>
              <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-2">
                <li>Mejorar el rango de flexión de la rodilla.</li>
                <li>Activar isquiotibiales de forma controlada.</li>
                <li>Evitar compensaciones con la cadera.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-lg transition-all shadow-md hover:shadow-lg">
                Iniciar Terapia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE TERAPIA ---
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
              <h2 className="text-2xl font-bold text-slate-800">{passedNombre}</h2>
              <p className="text-sm text-slate-500">Modo: Rehabilitación Asistida</p>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-blue-600 hover:text-blue-800 font-medium px-4 py-2 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors">
              Finalizar Sesión
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CÁMARA Y VISUALIZACIÓN */}
            <div className="lg:col-span-2">
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative border border-slate-200">
                    <YogaPoseDetector onPoseDetected={handlePoseDetected} />
                    
                    {/* Overlay de Datos Clínicos */}
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-sm border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Pierna Activa</div>
                        <div className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            {metrics.isRightActive ? 'Derecha 👉' : '👈 Izquierda'}
                        </div>
                    </div>

                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-xl shadow-sm border border-slate-100">
                        <div className="text-xs text-slate-500 uppercase font-bold mb-1">Ángulo Rodilla</div>
                        <div className="text-3xl font-mono font-bold text-blue-600">{metrics.activeKneeAngle}°</div>
                    </div>
                </div>

                {/* Gráfica de Progreso en Tiempo Real */}
                <div className="mt-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-medium text-slate-600">Rango de Movimiento (ROM)</span>
                        <span className="text-xs text-slate-400">Meta: {TARGET_FLEXION}°</span>
                    </div>
                    <div className="relative h-8 bg-slate-100 rounded-full overflow-hidden">
                        {/* Marcadores de referencia */}
                        <div className="absolute left-0 h-full border-r border-slate-300 w-full flex justify-between px-2 text-[10px] text-slate-400 items-center">
                            <span>180° (Ext)</span>
                            <span>90° (Flex)</span>
                            <span>45°</span>
                        </div>
                        
                        {/* Barra de Progreso Inversa (180 es 0%, 45 es 100%) */}
                        <div className={`absolute right-0 h-full transition-all duration-500 ease-out ${getProgressColor()}`}
                             style={{ 
                                 width: `${Math.min(100, Math.max(0, (180 - metrics.activeKneeAngle) / 1.35))}%` 
                             }}>
                        </div>
                    </div>
                    <p className="text-xs text-center mt-2 text-slate-500">
                        Desliza la barra azul hacia la izquierda flexionando la rodilla.
                    </p>
                </div>
            </div>

            {/* PANEL DE CONTROL Y FEEDBACK */}
            <div className="space-y-6">
                {/* Contador Terapéutico */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-100 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones Válidas</h3>
                    <div className="text-7xl font-light text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium
                            ${stage === 'hold_max' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                            {stage === 'hold_max' ? '⏱️ SOSTENIENDO' : stage === 'flexing' ? '📉 FLEXIONANDO' : '📈 EXTENDIENDO'}
                        </span>
                    </div>
                </div>

                {/* Feedback Inteligente */}
                <div className={`p-6 rounded-2xl border-l-4 shadow-md transition-all duration-300
                    ${feedback.includes('🛑') ? 'bg-amber-50 border-amber-400 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 
                      'bg-white border-blue-400 text-slate-700'}`}>
                    <div className="flex gap-3">
                        <span className="text-2xl">
                            {feedback.includes('🛑') ? '✋' : feedback.includes('✅') ? '🎉' : 'ℹ️'}
                        </span>
                        <p className="font-medium leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Mejora Continua */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Registro de Sesión</h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
                            <span className="text-slate-600">Mejor Flexión (Rep actual)</span>
                            <span className="font-mono font-bold text-blue-600">
                                {metrics.maxFlexion < 180 ? `${metrics.maxFlexion}°` : '--'}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 italic mt-2">
                        </div>
                            * Recuerda: No fuerces si sientes dolor agudo  ( 4/10).
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}