import { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';
// import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid'; // Asegúrate de tener iconos o usa texto

/**
 * Vista de Plancha (Plank) - Ejercicio Isométrico
 * Lógica:
 * 1. Validar que el cuerpo forme una línea recta (Hombro-Cadera-Rodilla ~180°).
 * 2. Cronómetro: Solo corre si la postura es válida.
 * 3. Meta: Acumular 10 segundos de tiempo válido.
 */
export default function Plancha() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- AI STATE ---
  const [timeLeft, setTimeLeft] = useState(10); // Meta: 10 segundos
  const [isFinished, setIsFinished] = useState(false);
  const [feedback, setFeedback] = useState('Adopta la posición de plancha');
  const [currentMetrics, setCurrentMetrics] = useState({
    hipAngle: 180,  // Ángulo del cuerpo
    isValid: false  // Si la postura actual cuenta o no
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs para lógica sin re-renders
  const isValidRef = useRef(false);
  const hipHistoryRef = useRef([]);
  const lastSpeechTime = useRef(0); // Para no saturar con voz

  // --- UMBRALES ---
  const HIP_IDEAL = 180;
  const HIP_TOLERANCE = 15; // Rango aceptable: 165° a 195°
  const SMOOTH_WINDOW = 10; // Mayor suavizado para ejercicios estáticos

  // --- CRONÓMETRO INTELIGENTE ---
  useEffect(() => {
    let interval;
    if (started && !isFinished) {
      interval = setInterval(() => {
        // Solo restamos tiempo si la postura es válida
        if (isValidRef.current) {
          setTimeLeft((prev) => {
            if (prev <= 1) { // Terminado
              setIsFinished(true);
              speak('¡Excelente! Serie completada.');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started, isFinished, speak]);


  const handlePoseDetected = (landmarks) => {
    if (isFinished) return;

    const angles = calculateBodyAngles(landmarks);
    const { rightHip, leftHip } = angles; // Asumiendo que devuelve el ángulo Hombro-Cadera-Rodilla

    // 1. Suavizado
    const avgHipRaw = (rightHip + leftHip) / 2;
    hipHistoryRef.current.push(avgHipRaw);
    if (hipHistoryRef.current.length > SMOOTH_WINDOW) hipHistoryRef.current.shift();
    const smoothHip = Math.round(hipHistoryRef.current.reduce((a, b) => a + b, 0) / hipHistoryRef.current.length);

    // 2. Validación de Postura
    let valid = false;
    let msg = '';
    
    // Verificamos la línea recta
    if (smoothHip < HIP_IDEAL - HIP_TOLERANCE) {
        // Ángulo < 165 -> Cadera muy alta (Pico)
        msg = '⚠️ Baja la cadera (Estás haciendo pico)';
        valid = false;
    } else if (smoothHip > HIP_IDEAL + HIP_TOLERANCE) {
        // Ángulo > 195 -> Cadera hundida (Banana)
        msg = '⚠️ ¡Sube la cadera! No arquees la espalda.';
        valid = false;
    } else {
        // Rango 165 - 195
        msg = '✅ ¡Perfecto! Aguanta...';
        valid = true;
    }

    // Actualizar Refs y Estado
    isValidRef.current = valid;
    setFeedback(msg);
    setCurrentMetrics({ hipAngle: smoothHip, isValid: valid });

    // Control de voz (cada 3 segs máx para no saturar)
    const now = Date.now();
    if (!valid && now - lastSpeechTime.current > 3000) {
        if (msg.includes('Baja')) speak('Baja un poco la cola');
        if (msg.includes('Sube')) speak('Sube la cadera, aprieta abdomen');
        lastSpeechTime.current = now;
    }
  };

  // Visualización Esqueleto
  const highlightedAngles = useMemo(() => {
    return [
      { indices: [12, 24, 26], angle: currentMetrics.hipAngle, isValid: currentMetrics.isValid }, // Torso Der
      { indices: [11, 23, 25], angle: currentMetrics.hipAngle, isValid: currentMetrics.isValid }, // Torso Izq
    ];
  }, [currentMetrics]);

  // --- VISTA DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Plancha (Plank)</h1>
          <p className="text-gray-600 mb-6 text-lg">Objetivo: Mantener la postura perfecta durante <strong>10 segundos</strong>. El tiempo se detiene si pierdes la forma.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Plancha'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🧘‍♂️</span>
                </div>
              )}
              <div className="absolute bottom-4 bg-black/60 text-white px-4 py-1 rounded-full text-sm backdrop-blur-sm">
                 Meta: Línea Recta (180°)
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Apoya los antebrazos y puntas de pies.</li>
                <li>Cuerpo recto como una tabla.</li>
                <li>Aprieta glúteos y abdomen.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
                Iniciar Reto (10s)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE FINALIZACIÓN ---
  if (isFinished) {
      return (
        <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl text-center max-w-md w-full">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">¡Reto Completado!</h2>
                <p className="text-gray-600 mb-6">Has mantenido una plancha perfecta durante 10 segundos.</p>
                <button onClick={() => {setStarted(false); setIsFinished(false); setTimeLeft(10);}} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">
                    Volver al Menú
                </button>
            </div>
        </div>
      );
  }

  // --- VISTA RUTINA ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">🧘‍♂️ Plancha IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Cancelar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Medidor de Ángulo Flotante */}
              <div className={`absolute top-4 right-4 px-4 py-2 rounded-xl border-2 backdrop-blur-md shadow-lg transition-all
                  ${currentMetrics.isValid ? 'bg-green-100/90 border-green-500 text-green-800' : 'bg-red-100/90 border-red-500 text-red-800'}`}>
                  <div className="text-xs font-bold uppercase mb-1">Alineación</div>
                  <div className="text-3xl font-black">{currentMetrics.hipAngle}°</div>
                  <div className="text-xs font-bold">{currentMetrics.isValid ? 'PERFECTO' : 'CORRIGE'}</div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">Estado del Core:</div>
                    <div className={`text-lg font-bold ${currentMetrics.isValid ? 'text-green-600' : 'text-red-500'}`}>
                        {currentMetrics.isValid ? '🔥 ACTIVO' : '⚠️ INESTABLE'}
                    </div>
                </div>
            </div>
          </div>

          {/* FEEDBACK & CRONÓMETRO */}
          <div className="space-y-6">
            
            {/* Cronómetro Principal */}
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
                <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-4">Tiempo Restante</h2>
                
                <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                    {/* Círculo de fondo */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                        {/* Círculo de progreso */}
                        <circle cx="50" cy="50" r="45" fill="none" stroke={currentMetrics.isValid ? "#4f46e5" : "#ef4444"} strokeWidth="8" 
                                strokeDasharray="283" 
                                strokeDashoffset={283 - (283 * timeLeft) / 10}
                                className="transition-all duration-1000 ease-linear transform -rotate-90 origin-center" />
                    </svg>
                    <div className="text-5xl font-black text-gray-800 z-10">
                        {timeLeft}<span className="text-sm text-gray-400 font-normal">s</span>
                    </div>
                </div>
                
                <p className={`mt-4 text-sm font-medium transition-colors
                    ${currentMetrics.isValid ? 'text-green-600' : 'text-red-500 animate-pulse'}`}>
                    {currentMetrics.isValid ? '⏳ Tiempo corriendo...' : '⏸️ Tiempo pausado'}
                </p>
            </div>

            {/* Feedback Box */}
            <div className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${feedback.includes('⚠️') ? 'bg-red-50 border-red-500 text-red-800' : 
                  feedback.includes('✅') ? 'bg-green-50 border-green-500 text-green-800' : 
                  'bg-blue-50 border-blue-500 text-blue-800'}`}>
                <p className="text-lg font-medium text-center">{feedback}</p>
            </div>

            {/* Guía Visual de Postura */}
            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-4 text-sm">Guía de Alineación</h3>
                <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex items-center justify-between">
                        <span>Cadera Alta (Pico)</span>
                        <span className="text-red-500">&lt; 165°</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-100">
                        <span className="font-bold text-green-700">Zona Correcta</span>
                        <span className="font-bold text-green-700">165° - 195°</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span>Cadera Hundida</span>
                        <span className="text-red-500">&gt; 195°</span>
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}