import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { useSpeech } from '../../../../utils/useSpeech';

export default function ElevacionPiernasAbd() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Elevación de piernas';

  // --- ESTADOS ---
  const [count, setCount] = useState(0);
  const [phase, setPhase] = useState('down'); // 'down' (suelo) | 'up' (vertical)
  const [feedback, setFeedback] = useState('Túmbate y estira las piernas');
  const [legHeight, setLegHeight] = useState(0); // 0% a 100% visual
  const [isKneeBent, setIsKneeBent] = useState(false);

  const { speak } = useSpeech({ lang: 'es-ES' });

  // --- UMBRALES ---
  const HIP_ANGLE_UP = 100;    // Grados en cadera (aprox 90 es vertical perfecta)
  const HIP_ANGLE_DOWN = 160;  // Grados en cadera (casi plano)
  const KNEE_TOLERANCE = 155;  // Grados mínimos para considerar pierna recta

  // Cálculo de ángulo entre 3 puntos (A, B, C)
  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const handlePoseDetected = (landmarks) => {
    // Usamos lado derecho (índices pares)
    // 12: Hombro, 24: Cadera, 26: Rodilla, 28: Tobillo
    const shoulder = landmarks[12];
    const hip = landmarks[24];
    const knee = landmarks[26];
    const ankle = landmarks[28];

    // 1. Validar Rodilla (Debe estar recta)
    const kneeAngle = calculateAngle(hip, knee, ankle);
    const kneeError = kneeAngle < KNEE_TOLERANCE;
    setIsKneeBent(kneeError);

    if (kneeError) {
      setFeedback('⚠️ ¡ESTIRA LAS RODILLAS!');
      return; // No procesamos repetición si la forma es mala
    }

    // 2. Calcular altura de pierna (Ángulo de cadera)
    const hipAngle = calculateAngle(shoulder, hip, knee);

    // Normalizar altura para visualización (0% = 180deg, 100% = 90deg)
    const rawHeight = ((180 - hipAngle) / (180 - 90)) * 100;
    setLegHeight(Math.min(100, Math.max(0, rawHeight)));

    // 3. Máquina de Estados
    if (phase === 'down') {
      if (hipAngle < HIP_ANGLE_UP) {
        setPhase('up');
        setFeedback('Baja controlando... resiste la gravedad');
        speak('Baja lento');
      } else {
        setFeedback('Sube las piernas rectas');
      }
    }
    else if (phase === 'up') {
      // Al bajar, no hace falta tocar el suelo (180), basta con pasar el umbral
      if (hipAngle > HIP_ANGLE_DOWN) {
        setPhase('down');
        setCount(c => c + 1);
        speak((count + 1).toString());
        setFeedback('✅ ¡Arriba otra vez!');
      }
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="h-56 bg-gray-100 flex items-center justify-center">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🦵</span>
              )}
            </div>
            <div className="p-6 space-y-3">
              <h3 className="font-bold text-lg">Instrucciones Técnicas:</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>Mantén las piernas <strong>completamente rectas</strong>.</li>
                <li>Manos debajo de los glúteos si te molesta la lumbar.</li>
                <li>Sube hasta la vertical (90°) y baja sin tocar el suelo.</li>
                <li>La IA detectará si doblas las rodillas.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors">
                Comenzar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 p-6 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{passedNombre}</h2>
            <p className="text-slate-400 text-sm">Objetivo: Abdomen Inferior</p>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-blue-400 hover:text-blue-300 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cámara */}
          <div className="lg:col-span-2 relative">
            <div className={`rounded-2xl overflow-hidden shadow-2xl border-4 aspect-video transition-colors duration-300 ${isKneeBent ? 'border-red-500' : 'border-slate-700'}`}>
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Overlay de Error */}
              {isKneeBent && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/60 backdrop-blur-sm">
                  <div className="bg-red-600 text-white px-6 py-4 rounded-xl font-bold text-2xl animate-pulse border-2 border-white">
                    🚫 ¡RODILLAS RECTAS!
                  </div>
                </div>
              )}

              {/* Indicador de Altura en video */}
              <div className="absolute right-4 bottom-4 top-4 w-6 bg-black/50 rounded-full overflow-hidden border border-white/30">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-200"
                  style={{ height: `${legHeight}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Panel de Control */}
          <div className="space-y-6">

            {/* Contador */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
              <div className="text-7xl font-black text-white mb-2">{count}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">Repeticiones Estrictas</div>
            </div>

            {/* Estado Visual */}
            <div className={`p-6 rounded-2xl border transition-colors ${phase === 'up' ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-800 border-slate-700'}`}>
              <h3 className="text-slate-400 text-xs uppercase mb-4 text-center">Fase del Movimiento</h3>
              <div className="flex justify-center items-end h-24 gap-4">
                {/* Ilustración simple con CSS */}
                <div className="relative w-20 h-12 bg-slate-600 rounded-lg">
                  {/* Piernas */}
                  <div
                    className={`absolute left-0 bottom-0 w-20 h-3 bg-cyan-400 rounded-full origin-bottom-left transition-transform duration-300 ${isKneeBent ? 'bg-red-500' : ''}`}
                    style={{ transform: `rotate(-${legHeight * 0.9}deg)` }}
                  ></div>
                </div>
              </div>
              <div className="text-center mt-2 font-mono text-xl font-bold text-cyan-400">
                {Math.round(legHeight)}% Altura
              </div>
            </div>

            {/* Feedback */}
            <div className={`p-4 rounded-xl text-center font-medium border ${isKneeBent ? 'bg-red-500/20 text-red-200 border-red-500/50' : 'bg-blue-500/20 text-blue-200 border-blue-500/50'}`}>
              {feedback}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
