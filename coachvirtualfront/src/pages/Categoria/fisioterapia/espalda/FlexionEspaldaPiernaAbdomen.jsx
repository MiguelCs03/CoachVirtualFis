import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { useSpeech } from '../../../../utils/useSpeech';

export default function FlexionEspaldaPiernaAbdomen() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Plancha Alta (Flexión isométrica)';

  // --- ESTADOS ---
  const [timeLeft, setTimeLeft] = useState(30); // Meta: 30 segundos
  const [isFinished, setIsFinished] = useState(false);
  const [postureStatus, setPostureStatus] = useState('waiting'); // 'correct', 'too_high', 'too_low', 'waiting'
  const [deviation, setDeviation] = useState(0); // Para visualización gráfica

  // Refs para lógica de tiempo
  const lastTimeRef = useRef(Date.now());
  const isPostureCorrectRef = useRef(false);
  const { speak } = useSpeech({ lang: 'es-ES' });

  // --- CONSTANTES ---
  const TARGET_TIME = 30;
  const TOLERANCE_PIXELS = 40; // Tolerancia vertical en píxeles para la cadera

  // Algoritmo de Detección de Linealidad
  const checkAlignment = (landmarks) => {
    // Usamos el lado que sea más visible o promediamos
    // 11: Hombro Izq, 23: Cadera Izq, 27: Tobillo Izq
    // 12: Hombro Der, 24: Cadera Der, 28: Tobillo Der

    const shoulder = landmarks[11];
    const hip = landmarks[23];
    const ankle = landmarks[27];

    // Calcular la Y esperada de la cadera si fuera una línea perfecta
    // Interpolación lineal: Y = Y1 + (X - X1) * (Y2 - Y1) / (X2 - X1)
    // Simplificación vertical: Asumimos que la cadera está aprox a mitad de cuerpo
    // Para mayor precisión, proyectamos la línea Hombro -> Tobillo.

    // Y esperada en la posición X de la cadera, basada en la recta Hombro-Tobillo
    // Pendiente m
    const m = (ankle.y - shoulder.y) / (ankle.x - shoulder.x);
    // Ecuación punto-pendiente: y - y1 = m(x - x1) -> y = m(x - x1) + y1
    const expectedHipY = m * (hip.x - shoulder.x) + shoulder.y;

    // Diferencia: Real - Esperada
    // Nota: En visión computacional, Y crece hacia ABAJO.
    // Si HipY es MAYOR que Expected, la cadera está más ABAJO (Sagging/Banana).
    // Si HipY es MENOR que Expected, la cadera está más ARRIBA (Pike/Carpa).

    // Normalizamos la diferencia multiplicando por altura del canvas (aprox) para tener pixels
    const rawDiff = (hip.y - expectedHipY) * 1000;
    return rawDiff;
  };

  const handlePoseDetected = (landmarks) => {
    if (isFinished) return;

    const currentDeviation = checkAlignment(landmarks);
    setDeviation(currentDeviation);

    let status = 'correct';

    if (currentDeviation > TOLERANCE_PIXELS) {
      status = 'too_low'; // Cadera caída
    } else if (currentDeviation < -TOLERANCE_PIXELS) {
      status = 'too_high'; // Cadera levantada
    }

    setPostureStatus(status);
    isPostureCorrectRef.current = (status === 'correct');

    // Gestión del Feedback de Voz (Anti-Spam)
    if (status === 'too_low' && Math.random() > 0.95) speak('Sube la cadera');
    if (status === 'too_high' && Math.random() > 0.95) speak('Baja la cadera');
  };

  // Efecto del Cronómetro
  useEffect(() => {
    let interval;
    if (started && !isFinished) {
      interval = setInterval(() => {
        if (isPostureCorrectRef.current) {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              setIsFinished(true);
              speak('¡Excelente! Rutina completada.');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started, isFinished, speak]);

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
                <div className="text-5xl">📏</div>
              )}
            </div>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-2">Objetivo: Plancha Perfecta</h3>
              <p className="text-gray-600 mb-4">
                Mantén una línea recta desde tus hombros hasta tus talones.
                El cronómetro <strong>solo avanzará</strong> si mantienes la postura correcta.
              </p>
              <ul className="text-sm text-gray-500 mb-6 space-y-1 list-disc pl-5">
                <li>Evita que la cadera cuelgue (daña la lumbar).</li>
                <li>Evita subir los glúteos como una carpa (pierdes trabajo abdominal).</li>
                <li>Meta: {TARGET_TIME} segundos de postura perfecta.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition">
                Iniciar Reto
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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold">{passedNombre}</h2>
          <button onClick={() => setStarted(false)} className="text-sm text-blue-400 underline">Cancelar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 relative">
            <div className="bg-black rounded-lg shadow overflow-hidden border-2 border-slate-700 aspect-video relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Overlay de Línea Guía */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/20 border-dashed border-t pointer-events-none"></div>

              {/* Indicador Visual de Estado */}
              {postureStatus !== 'correct' && !isFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className={`px-6 py-3 rounded-full font-bold text-xl animate-bounce ${postureStatus === 'too_high' ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'
                    }`}>
                    {postureStatus === 'too_high' ? '⬇️ BAJA LA CADERA' : '⬆️ SUBE LA CADERA'}
                  </div>
                </div>
              )}

              {isFinished && (
                <div className="absolute inset-0 flex items-center justify-center bg-green-600/90 backdrop-blur-sm z-20">
                  <div className="text-center">
                    <div className="text-6xl mb-2">🏆</div>
                    <h2 className="text-3xl font-bold">¡Completado!</h2>
                    <p className="text-lg">Has dominado la plancha.</p>
                    <button onClick={() => window.location.reload()} className="mt-4 bg-white text-green-700 px-6 py-2 rounded-full font-bold">Repetir</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {/* Cronómetro Principal */}
            <div className={`rounded-2xl p-8 text-center border-4 transition-colors duration-300 ${postureStatus === 'correct' ? 'border-green-500 bg-green-900/30' : 'border-red-500 bg-red-900/30'
              }`}>
              <div className="text-sm uppercase tracking-widest text-gray-400 mb-2">Tiempo Restante</div>
              <div className="text-7xl font-mono font-bold">
                00:{timeLeft.toString().padStart(2, '0')}
              </div>
              <div className="mt-4 font-medium">
                {postureStatus === 'correct' ? (
                  <span className="text-green-400 flex items-center justify-center gap-2">
                    <span className="animate-pulse">●</span> Tiempo Corriendo
                  </span>
                ) : (
                  <span className="text-red-400">⏸️ Tiempo Pausado</span>
                )}
              </div>
            </div>

            {/* Gráfico de Nivel (Leveler) */}
            <div className="bg-slate-800 p-6 rounded-xl">
              <h3 className="text-gray-400 text-xs uppercase mb-6 text-center">Nivel de Cadera</h3>
              <div className="relative h-40 w-12 mx-auto bg-slate-700 rounded-full overflow-hidden border border-slate-600">
                {/* Zona Ideal */}
                <div className="absolute top-1/2 left-0 right-0 h-12 -mt-6 bg-green-500/20 border-y border-green-500/50"></div>

                {/* Burbuja Indicadora */}
                <div
                  className={`absolute left-1 right-1 h-10 rounded-full shadow-lg transition-all duration-300 ${postureStatus === 'correct' ? 'bg-green-500' : 'bg-yellow-500'
                    }`}
                  style={{
                    top: '50%',
                    marginTop: '-20px', // Centrar
                    transform: `translateY(${Math.min(60, Math.max(-60, deviation * 0.5))}px)` // Mover burbuja según desviación
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-black/50">
                    HIP
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500 px-8">
                <span>Alta</span>
                <span>Baja</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}