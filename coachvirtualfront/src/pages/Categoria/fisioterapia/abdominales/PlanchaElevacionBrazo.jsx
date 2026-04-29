import { useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { useSpeech } from '../../../../utils/useSpeech';

export default function PlanchaElevacionBrazo() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Plancha con elevación de brazo';

  // --- ESTADOS ---
  const [reps, setReps] = useState(0);
  const [currentArm, setCurrentArm] = useState(null); // 'left', 'right', null
  const [feedback, setFeedback] = useState('Adopta posición de plancha');
  const [hipTilt, setHipTilt] = useState(0); // Grados de inclinación pélvica
  const [isStable, setIsStable] = useState(true);

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs para lógica de estado
  const stateRef = useRef('grounded'); // 'grounded', 'lifting', 'holding'
  const holdTimeRef = useRef(0);

  // --- CONSTANTES ---
  const LIFT_THRESHOLD = 0.1; // Diferencia de altura Y entre muñecas para detectar levantamiento
  const STABILITY_TOLERANCE = 15; // Grados máximos de inclinación de cadera permitidos
  const HOLD_DURATION = 800; // ms que debe aguantar el brazo arriba

  // Calcular ángulo de inclinación entre dos puntos (Caderas)
  const calculateTilt = (p1, p2) => {
    // En una plancha frontal, la diferencia en Y nos dice si una cadera está más baja
    const dy = p1.y - p2.y;
    const dx = p1.x - p2.x;
    const theta = Math.atan2(dy, dx);
    return theta * (180 / Math.PI); // Grados
  };

  const handlePoseDetected = (landmarks) => {
    // 11/12: Hombros, 23/24: Caderas, 15/16: Muñecas
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];

    // 1. Calcular Estabilidad (Anti-Rotación)
    // Si el valor es alto, el usuario está girando la cadera (TRAMPA)
    const tilt = calculateTilt(leftHip, rightHip);
    setHipTilt(tilt);

    const absTilt = Math.abs(tilt);
    const stable = absTilt < STABILITY_TOLERANCE;
    setIsStable(stable);

    // 2. Detectar Elevación de Brazo
    // MediaPipe Y: 0 es arriba, 1 es abajo. Menor valor = Más alto.
    // Si Wrist.y es significativamente menor que el otro, está levantado.
    let liftedSide = null;
    if (leftWrist.y < rightWrist.y - LIFT_THRESHOLD) liftedSide = 'left';
    else if (rightWrist.y < leftWrist.y - LIFT_THRESHOLD) liftedSide = 'right';

    // --- MÁQUINA DE ESTADOS ---

    // FASE 1: EN EL SUELO
    if (stateRef.current === 'grounded') {
      if (liftedSide) {
        stateRef.current = 'lifting';
        setCurrentArm(liftedSide);
        holdTimeRef.current = Date.now();
        setFeedback('¡Aguanta! No gires la cadera');
      } else {
        setFeedback('Plancha estable. Levanta un brazo.');
        setCurrentArm(null);
      }
    }

    // FASE 2: LEVANTANDO (HOLD)
    else if (stateRef.current === 'lifting') {
      // Si bajó el brazo antes de tiempo
      if (!liftedSide) {
        stateRef.current = 'grounded';
        setFeedback('Bajaste muy rápido. Controla.');
        return;
      }

      // Chequeo de Estabilidad continua
      if (!stable) {
        setFeedback('⚠️ ¡CADERA GIRADA! Corrígela.');
        // Opcional: Reiniciar timer si la forma es mala
        holdTimeRef.current = Date.now();
        return;
      }

      // Verificar tiempo
      const elapsed = Date.now() - holdTimeRef.current;
      if (elapsed > HOLD_DURATION) {
        // Éxito
        setReps(r => r + 1);
        speak(liftedSide === 'left' ? 'Izquierda' : 'Derecha');
        setFeedback('✅ ¡Excelente! Baja suave.');
        stateRef.current = 'holding'; // Esperar a que baje para reiniciar
      }
    }

    // FASE 3: ESPERANDO RETORNO
    else if (stateRef.current === 'holding') {
      if (!liftedSide) {
        stateRef.current = 'grounded';
        setFeedback('Listo para el siguiente.');
      } else {
        setFeedback('Baja el brazo...');
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
                <span className="text-6xl">✋⚖️</span>
              )}
            </div>
            <div className="p-6 space-y-3">
              <h3 className="font-bold text-lg">Instrucciones de Fisioterapia:</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-1">
                <li>Ponte en posición de plancha alta.</li>
                <li>Levanta un brazo hacia el frente ("Supermán").</li>
                <li><strong>El reto:</strong> No dejes que la cadera del lado que levantas se caiga.</li>
                <li>Imagina que tienes un vaso de agua en la espalda baja.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition-colors">
                Iniciar Reto de Estabilidad
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
            <p className="text-slate-400 text-sm">Enfoque: Anti-Rotación / Core</p>
          </div>
          <button onClick={() => setStarted(false)} className="text-sm text-blue-400 hover:text-blue-300 underline">Terminar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Visión */}
          <div className="lg:col-span-2 relative">
            <div className={`rounded-2xl overflow-hidden shadow-2xl border-4 aspect-video transition-colors duration-300 ${isStable ? 'border-slate-700' : 'border-red-500'}`}>
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Overlay de Estabilidad */}
              {!isStable && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 backdrop-blur-sm">
                  <div className="bg-red-600 text-white px-6 py-3 rounded-full font-bold animate-bounce">
                    🛑 ¡NIVELA LA CADERA!
                  </div>
                </div>
              )}

              {/* Indicador de Brazo Activo */}
              {currentArm && (
                <div className={`absolute top-10 px-4 py-2 bg-blue-600 text-white font-bold rounded shadow-lg ${currentArm === 'left' ? 'left-10' : 'right-10'}`}>
                  Brazo {currentArm === 'left' ? 'Izquierdo' : 'Derecho'} Arriba
                </div>
              )}
            </div>
          </div>

          {/* Dashboard */}
          <div className="space-y-6">

            {/* Contador */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 text-center">
              <span className="block text-6xl font-black text-white mb-2">{reps}</span>
              <span className="text-sm text-slate-400 uppercase tracking-wider">Repeticiones Estables</span>
            </div>

            {/* Visualizador de Nivel (Giroscopio Visual) */}
            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-slate-400 text-xs uppercase mb-4 text-center">Estabilidad Pélvica</h3>

              {/* Simulación de Cadera */}
              <div className="relative h-32 w-full bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                {/* Línea de Referencia */}
                <div className="absolute w-full h-0.5 bg-slate-600 border-dashed border-t border-slate-400"></div>

                {/* Barra de Cadera Basculante */}
                <div
                  className={`w-3/4 h-4 rounded-full transition-transform duration-300 ${isStable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`}
                  style={{ transform: `rotate(${hipTilt}deg)` }}
                >
                  {/* Puntos de cadera */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-slate-800"></div>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-full border-2 border-slate-800"></div>
                </div>

                <div className="absolute bottom-2 text-xs font-mono text-slate-500">
                  Inclinación: {Math.round(hipTilt)}°
                </div>
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-2 px-2">
                <span>Izq</span>
                <span>Der</span>
              </div>
            </div>

            {/* Feedback */}
            <div className={`p-4 rounded-xl text-center font-medium border transition-colors ${isStable ? 'bg-blue-500/20 text-blue-200 border-blue-500/50' : 'bg-red-500/20 text-red-200 border-red-500/50'}`}>
              {feedback}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}