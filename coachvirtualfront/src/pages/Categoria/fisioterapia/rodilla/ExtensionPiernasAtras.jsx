import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de Extensión de Piernas Hacia Atrás (Hip Extension Standing)
 * Enfoque Clínico:
 * 1. Aislamiento de Glúteo: Extender la cadera sin arquear lumbares.
 * 2. Estabilidad de Tronco: El torso no debe inclinarse hacia adelante > 10°.
 * 3. Rodilla Extendida: La pierna que se mueve debe estar recta.
 */
export default function ExtensionPiernasAtras() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Extensión de piernas hacia atrás';

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('neutral'); // 'neutral', 'extending', 'hold', 'returning'
  const [feedback, setFeedback] = useState('Ponte de perfil, espalda recta');
  const [metrics, setMetrics] = useState({
    hipExtension: 0,    // Ángulo de extensión (relativo a la vertical)
    torsoLean: 0,       // Inclinación del torso
    isStable: true
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs
  const lastRepTimeRef = useRef(0);
  const hipHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const cheatWarnRef = useRef(false); // Para el torso

  // --- UMBRALES CLÍNICOS ---
  const EXTENSION_START = 5;   // Grados para considerar inicio
  const TARGET_EXTENSION = 15; // Meta realista (15-20 grados es lo normal sin compensar)
  
  const MAX_TORSO_LEAN = 15;   // Si se inclina más de esto, está compensando
  const HOLD_TIME_MS = 1000;   // Squeeze de glúteo
  const SMOOTH_WINDOW = 6;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // 1. Detectar Lado Activo (Vista Lateral)
    // Asumimos que el usuario está de perfil. Usamos la pierna visible o la que se mueve atrás.
    // La pierna que va hacia atrás tendrá la rodilla/tobillo con mayor coordenada X (o menor dependiendo de la orientación)
    // Simplificación: Usamos la pierna cuya rodilla está más "atrás" respecto a la cadera.
    
    // Calculamos ángulo vertical de la pierna (Cadera-Rodilla)
    // 180 es recto abajo. < 180 es hacia adelante. > 180 es hacia atrás (extensión).
    // Ajustamos según la lógica de calculateBodyAngles o cálculo manual.
    
    // Cálculo manual para precisión de "atrás":
    // Ángulo entre vector (Cadera->Rodilla) y vector Vertical (Cadera->Suelo)
    const calcLegAngle = (hip, knee) => {
        const dy = knee.y - hip.y;
        const dx = knee.x - hip.x;
        let theta = Math.atan2(dy, dx) * 180 / Math.PI; // 90 es abajo
        return theta; 
    };

    // Lado derecho
    const rAngle = calcLegAngle(landmarks[24], landmarks[26]);
    // Lado izquierdo
    const lAngle = calcLegAngle(landmarks[23], landmarks[25]);

    // Determinar cual se aleja más de 90 (vertical abajo)
    // Si ángulo < 90 (o > 90 dependiendo del sistema de coords), buscamos el que va hacia "atrás".
    // Asumiremos que "atrás" es desviarse de la vertical.
    const rDev = Math.abs(rAngle - 90);
    const lDev = Math.abs(lAngle - 90);
    
    const isRightActive = rDev > lDev;
    const activeDeviation = isRightActive ? rDev : lDev; // Grados de extensión aprox
    
    // 2. Torso Lean Check
    // Ángulo Hombro-Cadera respecto a la vertical
    const hip = isRightActive ? landmarks[24] : landmarks[23];
    const shoulder = isRightActive ? landmarks[12] : landmarks[11];
    
    const torsoAngle = Math.abs(Math.atan2(hip.y - shoulder.y, hip.x - shoulder.x) * 180 / Math.PI - 90);

    // 3. Suavizado
    const updateHistory = (val) => {
        hipHistoryRef.current.push(val);
        if (hipHistoryRef.current.length > SMOOTH_WINDOW) hipHistoryRef.current.shift();
        return hipHistoryRef.current.reduce((a, b) => a + b, 0) / hipHistoryRef.current.length;
    };

    const smoothExtension = Math.round(updateHistory(activeDeviation));
    const smoothTorso = Math.round(torsoAngle);

    // Chequeo de compensación
    let isStable = true;
    if (smoothTorso > MAX_TORSO_LEAN) {
        isStable = false;
        if (!cheatWarnRef.current) {
            setFeedback('⚠️ ¡No inclines el tronco! Solo mueve la pierna.');
            speak('Espalda recta');
            cheatWarnRef.current = true;
        }
    } else {
        if (cheatWarnRef.current) {
            cheatWarnRef.current = false;
            setFeedback('✅ Buena postura.');
        }
    }

    setMetrics({
        hipExtension: smoothExtension,
        torsoLean: smoothTorso,
        isStable
    });

    if (!isStable) return; // No contamos si hay trampa

    // 4. Máquina de Estados
    const now = Date.now();

    if (stage === 'neutral' || stage === 'returning') {
        if (smoothExtension > EXTENSION_START) {
            setStage('extending');
            setFeedback('Lleva la pierna atrás apretando glúteo...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'extending') {
        if (smoothExtension >= TARGET_EXTENSION) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
                 setStage('hold');
                 setFeedback('🍑 Sostén la contracción...');
                 holdStartRef.current = null;
             }
        }
    }
    else if (stage === 'hold') {
        if (!holdStartRef.current) holdStartRef.current = now;
        if (now - holdStartRef.current >= 500) {
            setStage('returning');
            setFeedback('Regresa lento sin balancearte.');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'returning') {
        if (smoothExtension < EXTENSION_START) {
             if (!holdStartRef.current) {
                 holdStartRef.current = now;
             } else if (now - holdStartRef.current >= 500) {
                 setRepCount(c => c + 1);
                 setFeedback('✅ Repetición correcta.');
                 speak((repCount + 1).toString());
                 setStage('neutral');
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
                <div className="text-7xl">🦵➡️</div>
              )}
              <div className="absolute top-4 right-4 bg-white/90 px-3 py-1 rounded-full text-xs font-bold text-blue-600 shadow-sm">
                  Control Glúteo
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Ponte de <strong>PERFIL</strong> a la cámara.</li>
                <li>Mantén el torso totalmente vertical (como una estatua).</li>
                <li>Lleva la pierna hacia atrás <strong>sin doblar la rodilla</strong>.</li>
                <li>El movimiento es corto: siente el "tope" del glúteo.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-blue-200">
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
              <span className="inline-block mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">Estabilidad Lumbo-Pélvica</span>
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
                        ${metrics.isStable ? 'bg-white/90 border-blue-400 text-blue-700' : 'bg-red-50/90 border-red-400 text-red-700 animate-pulse'}`}>
                        <span className="text-sm font-bold flex items-center gap-2">
                            {metrics.isStable ? '🧘 TRONCO ESTABLE' : '⚠️ NO TE INCLINES'}
                        </span>
                    </div>
                </div>

                {/* Panel de Rango */}
                <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex justify-between text-sm text-slate-500 mb-2">
                        <span>Extensión Cadera</span>
                        <span className="font-bold text-slate-800">{metrics.hipExtension}°</span>
                    </div>
                    <div className="h-6 bg-slate-100 rounded-full overflow-hidden relative">
                        {/* Zona Objetivo (15-30 grados) */}
                        <div className="absolute left-[15%] width-[30%] h-full bg-green-100 border-l border-r border-green-300"></div>
                        
                        {/* Indicador */}
                        <div className={`absolute h-full width-2 bg-blue-500 transition-all duration-200 rounded-full`}
                             style={{ 
                                 width: `${Math.min(100, metrics.hipExtension * 2.5)}%` // Escala visual (40 grados = 100%)
                             }}>
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                        <span>0° (Neutro)</span>
                        <span>20° (Meta)</span>
                        <span>40° (Excesivo)</span>
                    </div>
                </div>
            </div>

            {/* CONTROL Y FEEDBACK */}
            <div className="space-y-6">
                <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
                    <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">Repeticiones</h3>
                    <div className="text-6xl font-medium text-slate-800">{repCount}</div>
                    <div className="mt-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'hold' ? 'bg-green-500' : 'bg-slate-300 text-slate-600'}`}>
                            {stage === 'hold' ? 'SQUEEZE 🍑' : 'Moviendo...'}
                        </span>
                    </div>
                </div>

                <div className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${feedback.includes('⚠️') ? 'bg-amber-50 border-amber-200 text-amber-800' : 
                      feedback.includes('✅') ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
                      'bg-white border-slate-200 text-slate-600'}`}>
                    <div className="text-2xl mt-1">
                        {feedback.includes('⚠️') ? '👁️' : feedback.includes('✅') ? '🌟' : '💬'}
                    </div>
                    <div>
                        <h4 className="font-bold text-sm mb-1">Instructor IA</h4>
                        <p className="text-sm leading-relaxed">{feedback}</p>
                    </div>
                </div>

                {/* Inclinometro Digital */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Inclinómetro de Torso</h4>
                    <div className="relative w-32 h-16 overflow-hidden">
                        {/* Arco */}
                        <div className="absolute bottom-0 w-32 h-32 border-8 border-slate-100 rounded-full box-border"></div>
                        {/* Aguja */}
                        <div className={`absolute bottom-0 left-1/2 w-1 h-14 bg-slate-800 origin-bottom transition-transform duration-300`}
                             style={{ transform: `translateX(-50%) rotate(${metrics.torsoLean}deg)` }}>
                        </div>
                        {/* Zona segura */}
                        <div className="absolute bottom-0 left-1/2 w-0.5 h-16 bg-green-500 -translate-x-1/2 opacity-50"></div>
                    </div>
                    <p className={`text-xs mt-2 font-mono ${metrics.isStable ? 'text-green-600' : 'text-red-500 font-bold'}`}>
                        Desviación: {metrics.torsoLean}°
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}