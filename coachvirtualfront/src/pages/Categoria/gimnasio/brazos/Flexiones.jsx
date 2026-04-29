import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de rutina de Flexiones (Push-ups)
 * Lógica:
 * 1. Detectar ángulo de codos para contar repeticiones (Rango completo).
 * 2. Detectar ángulo de cadera (Hombro-Cadera-Rodilla) para validar "Espalda Recta".
 */
export default function Flexiones() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'down_moving', 'bottom_hold', 'up_moving'
  const [feedback, setFeedback] = useState('Ponte en posición de plancha');
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    rightHip: 180, // Nuevo: Para verificar espalda recta
    leftHip: 180
  });

  const { speak } = useSpeech({ lang: 'es-ES' });
  
  // Refs para lógica de control
  const errorFlagRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]);
  const hipHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const holdTypeRef = useRef(null);

  // --- UMBRALES BIOMECÁNICOS (Configurados para Flexiones) ---
  // Ángulos de Codo
  const DOWN_ENTER = 100;      // Comienza a bajar
  const DOWN_CONFIRM = 85;     // Punto bajo ideal (pecho al suelo)
  const UP_ENTER = 140;        // Comienza a subir
  const UP_CONFIRM = 165;      // Brazos extendidos (fin de rep)
  
  // Ángulos de Cadera (Form Check: Espalda Recta)
  // El ángulo ideal es 180. Si baja mucho (150) la cadera cae. Si sube (210) hace "pico".
  const HIP_MIN_VALID = 160;
  const HIP_MAX_VALID = 200;

  const HOLD_MS = 200;         // Tiempo breve de pausa abajo/arriba
  const MIN_INTERVAL_MS = 1000;
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    // Asumimos que calculateBodyAngles devuelve hips. Si no, se calcula (Hombro-Cadera-Rodilla)
    const { rightElbow, leftElbow, rightHip, leftHip } = angles;

    // 1. Suavizado de datos (Moving Average)
    const updateHistory = (ref, val) => {
      ref.current.push(val);
      if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
      return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothElbow = Math.round(updateHistory(elbowHistoryRef, (rightElbow + leftElbow) / 2)); // Promedio ambos brazos
    const smoothHip = Math.round(updateHistory(hipHistoryRef, (rightHip + leftHip) / 2));         // Promedio ambas caderas

    setCurrentAngles({
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      rightHip: Math.round(rightHip),
      leftHip: Math.round(leftHip)
    });

    // 2. Validación de postura (Cadera/Espalda)
    // Si la cadera se cae o se levanta demasiado, pausamos el conteo
    if (smoothHip < HIP_MIN_VALID || smoothHip > HIP_MAX_VALID) {
        if (!errorFlagRef.current) {
            const msg = smoothHip < HIP_MIN_VALID ? '⚠️ ¡Sube la cadera!' : '⚠️ ¡Baja la cadera!';
            setFeedback(msg);
            speak(msg === '⚠️ ¡Sube la cadera!' ? 'Sube la cadera, cuerpo recto' : 'Baja la cola, cuerpo recto');
        }
        errorFlagRef.current = true;
        holdStartRef.current = null; // Reset holds
        return; 
    }

    // Si corrige la postura
    if (errorFlagRef.current && smoothHip >= HIP_MIN_VALID && smoothHip <= HIP_MAX_VALID) {
        errorFlagRef.current = false;
        setFeedback('✅ Postura corregida, continúa');
    }

    // 3. Máquina de Estados del Movimiento
    const now = Date.now();

    if (stage === 'up' || stage === 'up_hold') {
        // Detectar inicio de bajada
        if (smoothElbow < DOWN_ENTER) {
            setStage('down_moving');
            setFeedback('Bajando... pecho al suelo');
            holdStartRef.current = null;
        }
    } 
    else if (stage === 'down_moving') {
        // Validar profundidad (abajo)
        if (smoothElbow < DOWN_CONFIRM) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
                holdTypeRef.current = 'bottom';
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('bottom_hold');
                setFeedback('⚡ ¡Empuja hacia arriba!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'bottom_hold') {
        // Detectar inicio de subida
        if (smoothElbow > UP_ENTER) {
            setStage('up_moving');
            setFeedback('Subiendo con fuerza...');
        }
    }
    else if (stage === 'up_moving') {
        // Validar extensión completa (arriba)
        if (smoothElbow > UP_CONFIRM) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
                holdTypeRef.current = 'top';
            } else if (now - holdStartRef.current >= HOLD_MS) {
                // REPETICIÓN COMPLETADA
                if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
                    const newCount = repCount + 1;
                    setRepCount(newCount);
                    setFeedback(`✅ ¡Repetición ${newCount} buena!`);
                    speak(newCount.toString());
                    lastRepTimeRef.current = now;
                }
                setStage('up');
                holdStartRef.current = null;
            }
        }
        // Si vuelve a bajar antes de terminar
        else if (smoothElbow < DOWN_ENTER) {
            setStage('down_moving');
            setFeedback('No completaste la subida');
            holdStartRef.current = null;
        }
    }
  };

  const getAngleColor = (angle, type) => {
    if (type === 'elbow') {
        // Verde si está extendido arriba o flexionado abajo (dependiendo del stage)
        if (stage === 'bottom_hold' && angle < DOWN_CONFIRM) return 'text-green-600';
        if (stage === 'up' && angle > UP_CONFIRM) return 'text-green-600';
        return 'text-blue-500';
    }
    if (type === 'hip') {
        // Verde si está entre 160 y 200 (recto)
        return (angle >= HIP_MIN_VALID && angle <= HIP_MAX_VALID) ? 'text-green-500' : 'text-red-600';
    }
    return 'text-gray-500';
  };

  // Highlight joints visualmente en el canvas
  const highlightedAngles = useMemo(() => {
    const hipValid = currentAngles.rightHip >= HIP_MIN_VALID && currentAngles.rightHip <= HIP_MAX_VALID;
    return [
      // Codos (Primary movers)
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: true }, // Derecho
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: true },  // Izquierdo
      // Cadera (Form check) - Usamos indices 12(hombro)-24(cadera)-26(rodilla) aprox
      { indices: [12, 24, 26], angle: currentAngles.rightHip, isValid: hipValid } 
    ];
  }, [currentAngles]);

  const resetCounter = () => {
    setRepCount(0);
    setStage('up');
    setFeedback('Contador reiniciado');
    errorFlagRef.current = false;
  };

  // --- VISTA DE INICIO (DESCRIPCIÓN) ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Flexiones (Push-ups)</h1>
          <p className="text-gray-600 mb-8 text-lg">Entrenamiento de fuerza clásico. La IA verificará que bajes lo suficiente y mantengas la espalda recta.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56 flex items-center justify-center overflow-hidden bg-gray-100">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Flexiones'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🤸‍♂️</span>
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li><strong>Espalda:</strong> Mantenla recta (Cadera alineada).</li>
                <li><strong>Bajada:</strong> Codos a 90° o menos.</li>
                <li><strong>Subida:</strong> Extiende brazos completamente.</li>
                <li>Coloca la cámara lateralmente para mejor detección.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2">
                Iniciar rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- VISTA DE RUTINA ACTIVA ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">🏋️ Flexiones (Rutina)</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Volver a descripción</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* COLUMNA IZQUIERDA: CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Overlay de estado en video */}
              <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                Estado: {stage === 'bottom_hold' ? '🛑 Abajo (Hold)' : stage.includes('moving') ? '🔄 Moviendo' : '⬆️ Arriba'}
              </div>
            </div>

            {/* Panel de Métricas */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Métricas en Tiempo Real</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightElbow, 'elbow')}`}>
                  <span className="font-medium">Codos (Flexión):</span>
                  <div className="text-2xl font-bold">{currentAngles.rightElbow}°</div>
                  <div className="text-xs opacity-75">Meta Abajo: &lt;{DOWN_CONFIRM}°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightHip, 'hip')}`}>
                  <span className="font-medium">Cadera (Postura):</span>
                  <div className="text-2xl font-bold">{currentAngles.rightHip}°</div>
                  <div className="text-xs opacity-75">Ideal: 160° - 200°</div>
                </div>
                <div className="p-3 rounded bg-gray-50 text-gray-700">
                  <span className="font-medium">Fase Actual:</span>
                  <div className="text-lg font-bold capitalize">{stage.replace('_', ' ')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: FEEDBACK E INFO */}
          <div className="space-y-6">
            {/* Contador */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Repeticiones</h2>
              <div className="text-center">
                <div className="text-7xl font-bold text-indigo-600 mb-2">{repCount}</div>
                <button onClick={resetCounter} className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors">
                    🔄 Reiniciar
                </button>
              </div>
            </div>

            {/* Feedback Box */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Instructor IA</h2>
              <div className={`text-center p-4 rounded-lg transition-colors duration-300 
                ${feedback.includes('⚠️') ? 'bg-red-100 text-red-700 border-red-200 border' : 
                  feedback.includes('✅') ? 'bg-green-100 text-green-700 border-green-200 border' : 
                  'bg-blue-50 text-blue-800 border-blue-100 border'}`}>
                <p className="text-lg font-medium animate-pulse-once">{feedback}</p>
              </div>
            </div>

            {/* Guía rápida */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Técnica Correcta</h2>
              <ul className="space-y-3 text-sm text-gray-600">
                <li className="flex items-start">
                    <span className="text-indigo-500 mr-2 text-lg">1.</span>
                    <span>Comienza en plancha alta, brazos extendidos.</span>
                </li>
                <li className="flex items-start">
                    <span className="text-indigo-500 mr-2 text-lg">2.</span>
                    <span>Baja hasta que el pecho casi toque el suelo (codos &lt; 90°).</span>
                </li>
                <li className="flex items-start">
                    <span className="text-red-500 mr-2 text-lg">⚠️</span>
                    <span><strong>No dejes caer la cadera.</strong> El cuerpo debe moverse como un bloque.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}