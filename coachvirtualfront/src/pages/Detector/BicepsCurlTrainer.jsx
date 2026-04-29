import { useState, useRef } from 'react';
import PoseDetector from './PoseDetector';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function BicepsCurlTrainer() {
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down');
  const [feedback, setFeedback] = useState('Comienza');
  
  const { speak } = useSpeech({ lang: 'es-ES' });
  const errorFlagRef = useRef(false);

  // Umbrales de ángulo
  const FLEXED_THRESHOLD = 60;
  const EXTENDED_THRESHOLD = 160;
  const SHOULDER_ERROR_THRESHOLD = 45;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, rightShoulder } = angles;

    // Regla de Error: Hombro
    if (rightShoulder > SHOULDER_ERROR_THRESHOLD && !errorFlagRef.current) {
      setFeedback('¡No muevas el hombro!');
      speak('¡No muevas el hombro, mantén el codo fijo!');
      errorFlagRef.current = true;
    }

    // Lógica de Estado 'down' (brazo bajado)
    if (stage === 'down') {
      if (rightElbow < FLEXED_THRESHOLD) {
        setStage('up');
        setFeedback('¡Excelente subida!');
        errorFlagRef.current = false;
      }
    }

    // Lógica de Estado 'up' (brazo flexionado)
    if (stage === 'up') {
      if (rightElbow > EXTENDED_THRESHOLD) {
        setStage('down');
        const newCount = repCount + 1;
        setRepCount(newCount);
        setFeedback('Repetición completa');
        speak(newCount.toString());
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">
          🏋️ Entrenador de Curl de Bíceps
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detector de Pose */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl p-4">
              <PoseDetector onPoseDetected={handlePoseDetected} />
            </div>
          </div>

          {/* Panel de Información */}
          <div className="space-y-6">
            {/* Contador de Repeticiones */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Repeticiones
              </h2>
              <div className="text-center">
                <div className="text-6xl font-bold text-indigo-600">
                  {repCount}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Etapa: <span className="font-semibold">{stage === 'up' ? 'Arriba' : 'Abajo'}</span>
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Feedback
              </h2>
              <div className={`text-center p-4 rounded-lg ${
                feedback.includes('No muevas') 
                  ? 'bg-red-100 text-red-700' 
                  : feedback.includes('Excelente') 
                  ? 'bg-green-100 text-green-700'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                <p className="text-lg font-medium">{feedback}</p>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                📋 Instrucciones
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Mantén el hombro fijo durante todo el ejercicio</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Flexiona el codo completamente hacia arriba</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Extiende el brazo completamente hacia abajo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span>Mantén un movimiento controlado y fluido</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
