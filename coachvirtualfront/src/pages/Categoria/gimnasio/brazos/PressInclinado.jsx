import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de rutina de Press Inclinado con Mancuernas
 * * Diferencias clave con Press Banca Plano:
 * 1. Validación de Inclinación: Se chequea el ángulo Cadera-Hombro-Rodilla.
 * - Si es > 160° está muy plano.
 * - Si es < 110° está muy sentado (hombro).
 * 2. Enfoque en pecho superior.
 */
export default function PressInclinado() {
  // --- ESTADO DE LA UI ---
  const [started, setStarted] = useState(false);
  const location = useLocation();
  
  // Datos pasados por navegación (Imagen y nombre)
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || null;

  // --- ESTADO DE LA LÓGICA IA ---
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up'); // 'up', 'down_moving', 'bottom_hold', 'up_moving'
  const [feedback, setFeedback] = useState('Acomódate en el banco inclinado');
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    hipAngle: 135, // Ángulo del torso (referencia inicial ideal)
    symmetryDiff: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs para lógica interna
  const lastRepTimeRef = useRef(0);
  const elbowHistoryRef = useRef([]);
  const hipHistoryRef = useRef([]);
  const holdStartRef = useRef(null);
  const symmetryErrorRef = useRef(false);

  // --- UMBRALES BIOMECÁNICOS (Incline Press) ---
  const DOWN_ENTER = 135;      
  const DOWN_CONFIRM = 85;     // Profundidad
  const UP_ENTER = 120;        
  const UP_CONFIRM = 160;      // Extensión

  // Validación de la inclinación del banco (detectada por la postura del cuerpo)
  // Ángulo Hombro-Cadera-Rodilla:
  // 180° = Acostado plano. 90° = Sentado recto.
  // Objetivo Inclinado: 120° - 155°
  const INCLINE_MIN_VALID = 115; 
  const INCLINE_MAX_VALID = 165;

  const MAX_SYMMETRY_DIFF = 25; 
  const HOLD_MS = 300;          
  const MIN_INTERVAL_MS = 1200; 
  const SMOOTH_WINDOW = 5;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow, rightHip, leftHip } = angles;

    // 1. Suavizado de datos
    const addToHistory = (ref, val) => {
        ref.current.push(val);
        if (ref.current.length > SMOOTH_WINDOW) ref.current.shift();
        return ref.current.reduce((a, b) => a + b, 0) / ref.current.length;
    };

    const smoothRightElbow = Math.round(addToHistory(elbowHistoryRef, rightElbow)); // Usamos un ref compartido para simplificar ejemplo
    const smoothLeftElbow = Math.round(leftElbow); 
    const smoothHip = Math.round(addToHistory(hipHistoryRef, (rightHip + leftHip) / 2)); // Promedio cadera

    const avgElbow = (smoothRightElbow + smoothLeftElbow) / 2;
    const symmetryDiff = Math.abs(smoothRightElbow - smoothLeftElbow);

    setCurrentAngles({
      rightElbow: smoothRightElbow,
      leftElbow: smoothLeftElbow,
      hipAngle: smoothHip,
      symmetryDiff: symmetryDiff
    });

    // 2. Validación de Inclinación (Form Check Específico)
    if (smoothHip > INCLINE_MAX_VALID) {
        setFeedback('⚠️ Estás muy plano, inclina el respaldo');
        return; // No contamos reps si la forma es incorrecta
    } else if (smoothHip < INCLINE_MIN_VALID) {
        setFeedback('⚠️ Estás muy sentado, recuéstate más');
        return;
    }

    // 3. Validación de Simetría
    if (symmetryDiff > MAX_SYMMETRY_DIFF) {
       if (!symmetryErrorRef.current) {
           setFeedback('⚖️ Iguala la altura de los brazos');
           symmetryErrorRef.current = true;
       }
    } else {
        symmetryErrorRef.current = false;
    }

    // 4. Máquina de Estados (Repeticiones)
    const now = Date.now();

    if (stage === 'up' || stage === 'top_hold') {
        if (avgElbow < DOWN_ENTER) {
            setStage('down_moving');
            setFeedback('Bajando al pecho superior...');
            holdStartRef.current = null;
        }
    }
    else if (stage === 'down_moving') {
        if (avgElbow < DOWN_CONFIRM) {
            if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                setStage('bottom_hold');
                setFeedback('🔥 ¡Sube explosivo!');
                holdStartRef.current = null;
            }
        }
    }
    else if (stage === 'bottom_hold') {
        if (avgElbow > UP_ENTER) {
            setStage('up_moving');
            setFeedback('Subiendo...');
        }
    }
    else if (stage === 'up_moving') {
        if (avgElbow > UP_CONFIRM) {
             if (!holdStartRef.current) {
                holdStartRef.current = now;
            } else if (now - holdStartRef.current >= HOLD_MS) {
                if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
                    const newCount = repCount + 1;
                    setRepCount(newCount);
                    setFeedback(`✅ Repetición ${newCount}`);
                    speak(newCount.toString());
                    lastRepTimeRef.current = now;
                }
                setStage('up');
                holdStartRef.current = null;
            }
        } else if (avgElbow < DOWN_ENTER) {
             setStage('down_moving'); // Falló la subida
             setFeedback('¡Termina el movimiento!');
        }
    }
  };

  // Colores dinámicos
  const getAngleColor = (val, min, max) => (val >= min && val <= max) ? 'text-green-600' : 'text-red-500';

  // Visualización en Canvas
  const highlightedAngles = useMemo(() => {
    const inclineOk = currentAngles.hipAngle >= INCLINE_MIN_VALID && currentAngles.hipAngle <= INCLINE_MAX_VALID;
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: true }, // Brazos
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: true },
      { indices: [12, 24, 26], angle: currentAngles.hipAngle, isValid: inclineOk } // Torso (Inclinación)
    ];
  }, [currentAngles]);

  // --- VISTA DE DESCRIPCIÓN ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Press inclinado con mancuernas</h1>
          <p className="text-gray-600 mb-8 text-lg">La IA verificará tu inclinación (25-40°) y el recorrido de los brazos.</p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 flex items-center justify-center overflow-hidden bg-gray-100 relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre || 'Press inclinado'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">🏋️‍♂️</span>
                </div>
              )}
              {/* Overlay Informativo */}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-center backdrop-blur-sm">
                  Ángulo Objetivo: 25° - 40°
              </div>
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Ajusta el banco a una inclinación media.</li>
                <li>La IA detectará si estás muy plano o muy sentado.</li>
                <li>Baja hasta estirar el pectoral superior.</li>
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

  // --- VISTA DE RUTINA ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">🏋️ Press Inclinado IA</h1>
          <button onClick={() => setStarted(false)} className="text-sm text-indigo-600 hover:text-indigo-800 underline">Finalizar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />
              
              {/* Indicador de Inclinación en Pantalla */}
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-bold backdrop-blur-sm text-white shadow-sm
                  ${(currentAngles.hipAngle >= INCLINE_MIN_VALID && currentAngles.hipAngle <= INCLINE_MAX_VALID) 
                    ? 'bg-green-500/80' : 'bg-orange-500/80'}`}>
                  📐 Inclinación: {currentAngles.hipAngle}° 
                  {(currentAngles.hipAngle > INCLINE_MAX_VALID) && ' (Muy Plano)'}
                  {(currentAngles.hipAngle < INCLINE_MIN_VALID) && ' (Muy Vertical)'}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
               <h3 className="text-lg font-semibold mb-3 text-gray-700">Métricas</h3>
               <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">Simetría</div>
                      <div className={`text-xl font-bold ${currentAngles.symmetryDiff < MAX_SYMMETRY_DIFF ? 'text-green-600' : 'text-red-500'}`}>
                          {currentAngles.symmetryDiff}°
                      </div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">Codos</div>
                      <div className="text-xl font-bold text-blue-600">
                          {currentAngles.rightElbow}°
                      </div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded">
                      <div className="text-xs text-gray-500">Estado</div>
                      <div className="text-sm font-bold text-indigo-600 uppercase mt-1">
                          {stage.replace('_', ' ')}
                      </div>
                  </div>
               </div>
            </div>
          </div>

          {/* PANEL LATERAL */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-6 text-center">
                <h2 className="text-gray-500 uppercase text-xs font-bold tracking-wider">Repeticiones</h2>
                <div className="text-7xl font-extrabold text-indigo-600 my-2">{repCount}</div>
                <button onClick={() => setRepCount(0)} className="text-sm text-indigo-400 hover:text-indigo-600 underline">Reiniciar</button>
            </div>

            <div className={`bg-white rounded-lg shadow-xl p-6 border-l-4 transition-colors
                ${feedback.includes('⚠️') ? 'border-orange-500 bg-orange-50' : 
                  feedback.includes('✅') ? 'border-green-500 bg-green-50' : 
                  'border-blue-500'}`}>
                <p className="text-lg font-medium text-gray-800">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
                <h3 className="font-bold text-gray-700 mb-3">Guía de Inclinación</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                        <span>Tu ángulo actual:</span>
                        <span className="font-bold">{currentAngles.hipAngle}°</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                             style={{ width: `${Math.min(Math.max(((currentAngles.hipAngle - 90) / 90) * 100, 0), 100)}%` }}>
                        </div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>90° (Sentado)</span>
                        <span>180° (Plano)</span>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">Mantén la barra azul en el centro para trabajar el pectoral superior.</p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}