import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Crunch Inverso:
 * Objetivo: Enrollar la pelvis hacia el pecho.
 * Métrica Clave: Ángulo Hombro-Cadera-Rodilla.
 */
export default function CrunchInverso() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Crunch Inverso';

  // --- ESTADOS ---
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('extension'); // 'extension' (piernas lejos) | 'flexion' (rodillas pecho)
  const [feedback, setFeedback] = useState('Acuéstate y estira las piernas');
  const [currentAngle, setCurrentAngle] = useState(180);
  const [qualityScore, setQualityScore] = useState(0); // 0 a 100% de compresión

  const { speak } = useSpeech({ lang: 'es-ES' });
  const angleHistoryRef = useRef([]); // Para detectar movimientos bruscos (inercia)

  // --- UMBRALES BIOMECÁNICOS ---
  const ANGLE_EXTENDED = 135; // Grados para considerar que bajó las piernas
  const ANGLE_CRUNCH = 75;    // Grados para considerar compresión máxima (rodillas al pecho)

  // Función auxiliar para calcular ángulo entre 3 puntos (Hombro, Cadera, Rodilla)
  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const handlePoseDetected = (landmarks) => {
    // Usamos el lado derecho como referencia principal (índices pares)
    // 12: Hombro Der, 24: Cadera Der, 26: Rodilla Der
    const shoulder = landmarks[12];
    const hip = landmarks[24];
    const knee = landmarks[26];

    // Calcular ángulo de cierre (La "bisagra" es la cadera)
    const angle = calculateAngle(shoulder, hip, knee);

    // Suavizado simple
    const smoothAngle = Math.round(angle);
    setCurrentAngle(smoothAngle);

    // Calcular score de calidad visual (0% = Extendido, 100% = Crunch Máximo)
    // Mapear rango [140, 60] a [0, 100]
    const rawScore = ((140 - smoothAngle) / (140 - 60)) * 100;
    const visualScore = Math.min(100, Math.max(0, rawScore));
    setQualityScore(visualScore);

    // --- MÁQUINA DE ESTADOS ---

    if (phase === 'extension') {
      // El usuario está con las piernas estiradas o bajando
      if (smoothAngle < ANGLE_CRUNCH) {
        // Ha llegado al punto de máxima contracción
        setPhase('flexion');
        setFeedback('🔒 ¡Mantén y aprieta abdomen!');
        speak('Aprieta');
      } else if (smoothAngle < 100) {
        setFeedback('Sube más las rodillas...');
      } else {
        setFeedback('Baja controlando, no toques el suelo');
      }
    }
    else if (phase === 'flexion') {
      // El usuario está comprimido, debe bajar
      if (smoothAngle > ANGLE_EXTENDED) {
        // Completó el ciclo
        setCount(c => c + 1);
        setPhase('extension');
        setFeedback('✅ ¡Bien! Repetición completa');
        speak((count + 1).toString());
      } else {
        setFeedback('Extiende las piernas suavemente');
      }
    }
  };

  // Color dinámico según la compresión
  const getProgressColor = () => {
    if (phase === 'flexion') return 'text-green-500';
    if (currentAngle < 90) return 'text-blue-500';
    return 'text-gray-400';
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="h-56 bg-gray-100 flex items-center justify-center">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-contain" />
              ) : (
                <span className="text-6xl">🤸‍♂️</span>
              )}
            </div>
            <div className="p-6 space-y-3">
              <h3 className="font-bold text-lg">Técnica Correcta:</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>Acuéstate boca arriba.</li>
                <li>Lleva las rodillas hacia el pecho <strong>enrollando la pelvis</strong>.</li>
                <li>No uses impulso. El movimiento debe ser lento.</li>
                <li>Al bajar, no arcamies la espalda.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors">
                Iniciar Entrenamiento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{passedNombre}</h2>
            <p className="text-slate-400 text-sm">Enfoque: Abdominales Inferiores</p>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-blue-400 hover:text-blue-300 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Visión */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-700 aspect-video">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Overlay de Datos */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-4 py-2 rounded-lg text-white">
                <span className="text-xs uppercase text-gray-400 block">Ángulo de Cadera</span>
                <span className="text-2xl font-mono font-bold">{currentAngle}°</span>
              </div>

              {/* Guía Visual de Meta */}
              {phase === 'extension' && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-white/80 font-bold">
                  ⬆️ ¡Rodillas al pecho! ⬆️
                </div>
              )}
            </div>
          </div>

          {/* Dashboard */}
          <div className="space-y-6">

            {/* Visualizador Circular de Compresión */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex flex-col items-center justify-center relative">
              <h3 className="text-slate-400 text-xs uppercase mb-4">Nivel de Crunch</h3>
              {/* Círculo SVG simple */}
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-700" />
                  <circle
                    cx="64" cy="64" r="60"
                    stroke="currentColor" strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={377}
                    strokeDashoffset={377 - (377 * qualityScore) / 100}
                    className={`transition-all duration-300 ${getProgressColor()}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
                  {Math.round(qualityScore)}%
                </div>
              </div>
            </div>

            {/* Contador Grande */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
              <span className="block text-6xl font-black text-white mb-2">{count}</span>
              <span className="text-sm text-slate-400 uppercase tracking-wider">Repeticiones</span>
            </div>

            {/* Feedback Textual */}
            <div className={`p-4 rounded-xl text-center font-medium transition-colors duration-300 ${phase === 'flexion' ? 'bg-green-500/20 text-green-300 border border-green-500/50' : 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
              }`}>
              {feedback}
            </div>

            <div className="text-xs text-center text-slate-500 mt-4">
              💡 Exhala todo el aire cuando las rodillas toquen el pecho para mayor activación.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}