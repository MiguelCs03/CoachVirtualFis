import { useState, useRef, useMemo } from 'react';
import YogaPoseDetector from '../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function Squats() {
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up');
  const [feedback, setFeedback] = useState('Comienza el ejercicio');
  const [currentAngles, setCurrentAngles] = useState({
    rightKnee: 180,
    leftKnee: 180,
    rightHip: 180,
    leftHip: 180
  });
  
  const { speak } = useSpeech({ lang: 'es-ES' });
  const lastRepTimeRef = useRef(0);

  // Umbrales de ángulo para sentadillas
  const SQUAT_THRESHOLD = 90;  // Rodilla doblada en sentadilla
  const STANDING_THRESHOLD = 160; // Rodilla extendida de pie

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightKnee, leftKnee } = angles;

    // Calcular ángulo de cadera (hombro-cadera-rodilla)
    const rightHipAngle = Math.round(calculateAngle(
      landmarks[12], landmarks[24], landmarks[26]
    ));
    const leftHipAngle = Math.round(calculateAngle(
      landmarks[11], landmarks[23], landmarks[25]
    ));

    // Actualizar ángulos para visualización
    setCurrentAngles({
      rightKnee: Math.round(rightKnee),
      leftKnee: Math.round(leftKnee),
      rightHip: rightHipAngle,
      leftHip: leftHipAngle
    });

    // Usar promedio de ambas rodillas para más estabilidad
    const avgKnee = (rightKnee + leftKnee) / 2;

    // Lógica de Estado 'up' (de pie)
    if (stage === 'up') {
      if (avgKnee < SQUAT_THRESHOLD) {
        setStage('down');
        setFeedback('✅ ¡Buena bajada!');
      }
    }

    // Lógica de Estado 'down' (en sentadilla)
    if (stage === 'down') {
      if (avgKnee > STANDING_THRESHOLD) {
        const now = Date.now();
        if (now - lastRepTimeRef.current > 1000) {
          setStage('up');
          const newCount = repCount + 1;
          setRepCount(newCount);
          setFeedback(`💪 Sentadilla ${newCount} completa`);
          speak(newCount.toString());
          lastRepTimeRef.current = now;
        }
      }
    }
  };

  const calculateAngle = (pointA, pointB, pointC) => {
    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) -
                    Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const getAngleColor = (angle) => {
    if (stage === 'up' && angle > STANDING_THRESHOLD) return 'text-green-500';
    if (stage === 'down' && angle < SQUAT_THRESHOLD) return 'text-green-500';
    return 'text-yellow-500';
  };

  const highlightedAngles = useMemo(() => {
    const rightKneeValid = 
      (stage === 'up' && currentAngles.rightKnee > STANDING_THRESHOLD) ||
      (stage === 'down' && currentAngles.rightKnee < SQUAT_THRESHOLD);
    
    const leftKneeValid = 
      (stage === 'up' && currentAngles.leftKnee > STANDING_THRESHOLD) ||
      (stage === 'down' && currentAngles.leftKnee < SQUAT_THRESHOLD);

    return [
      { indices: [24, 26, 28], angle: currentAngles.rightKnee, isValid: rightKneeValid },
      { indices: [23, 25, 27], angle: currentAngles.leftKnee, isValid: leftKneeValid }
    ];
  }, [currentAngles, stage]);

  const resetCounter = () => {
    setRepCount(0);
    setStage('up');
    setFeedback('Contador reiniciado');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-emerald-900">
          🦵 Sentadillas con IA
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <YogaPoseDetector 
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />
            </div>

            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightKnee)}`}>
                  <span className="font-medium">Rodilla Derecha:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightKnee}°</div>
                  <div className="text-xs opacity-75">
                    {stage === 'up' ? `Meta: >${STANDING_THRESHOLD}°` : `Meta: <${SQUAT_THRESHOLD}°`}
                  </div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftKnee)}`}>
                  <span className="font-medium">Rodilla Izquierda:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftKnee}°</div>
                  <div className="text-xs opacity-75">
                    {stage === 'up' ? `Meta: >${STANDING_THRESHOLD}°` : `Meta: <${SQUAT_THRESHOLD}°`}
                  </div>
                </div>
                <div className="p-3 rounded text-blue-500">
                  <span className="font-medium">Cadera Derecha:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightHip}°</div>
                  <div className="text-xs opacity-75">Referencia</div>
                </div>
                <div className="p-3 rounded text-blue-500">
                  <span className="font-medium">Cadera Izquierda:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftHip}°</div>
                  <div className="text-xs opacity-75">Referencia</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Repeticiones</h2>
              <div className="text-center">
                <div className="text-7xl font-bold text-emerald-600 mb-2">{repCount}</div>
                <div className="text-sm text-gray-500 mt-2">
                  Estado: <span className={`font-semibold ${stage === 'down' ? 'text-orange-600' : 'text-green-600'}`}>
                    {stage === 'down' ? '⬇️ Abajo' : '⬆️ Arriba'}
                  </span>
                </div>
                <button 
                  onClick={resetCounter}
                  className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  🔄 Reiniciar
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Feedback</h2>
              <div className={`text-center p-4 rounded-lg ${
                feedback.includes('completa') 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <p className="text-lg font-medium">{feedback}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">📋 Instrucciones</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">1.</span>
                  <span><strong>Posición inicial:</strong> De pie, rodillas extendidas (&gt;160°)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">2.</span>
                  <span><strong>Bajada:</strong> Dobla rodillas hasta ~90°</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">3.</span>
                  <span><strong>Subida:</strong> Extiende rodillas completamente</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">4.</span>
                  <span><strong>Mantén:</strong> Espalda recta y peso en talones</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">💪 Beneficios</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>Fortalece cuádriceps y glúteos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>Mejora movilidad de cadera</span>
                </li>
                <li className="flex items-start">
                  <span className="text-emerald-500 mr-2">✓</span>
                  <span>Aumenta fuerza funcional</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
