import { useState, useRef, useMemo } from 'react';
import YogaPoseDetector from '../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function BicepsCurl() {
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('down');
  const [feedback, setFeedback] = useState('Comienza el ejercicio');
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    rightShoulder: 180,
    leftShoulder: 180
  });
  
  const { speak } = useSpeech({ lang: 'es-ES' });
  const errorFlagRef = useRef(false);
  const lastRepTimeRef = useRef(0);

  // Umbrales de ángulo
  const FLEXED_THRESHOLD = 60;
  const EXTENDED_THRESHOLD = 160;
  const SHOULDER_ERROR_THRESHOLD = 45;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, rightShoulder, leftElbow, leftShoulder } = angles;

    // Actualizar ángulos para visualización
    setCurrentAngles({
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      rightShoulder: Math.round(rightShoulder),
      leftShoulder: Math.round(leftShoulder)
    });

    // Usar el brazo derecho por defecto (puedes cambiar a leftElbow si prefieres)
    const elbowAngle = rightElbow;
    const shoulderAngle = rightShoulder;

    // Regla de Error: Hombro
    if (shoulderAngle > SHOULDER_ERROR_THRESHOLD && !errorFlagRef.current) {
      setFeedback('⚠️ ¡No muevas el hombro!');
      speak('¡No muevas el hombro, mantén el codo fijo!');
      errorFlagRef.current = true;
    }

    // Lógica de Estado 'down' (brazo bajado)
    if (stage === 'down') {
      if (elbowAngle < FLEXED_THRESHOLD) {
        setStage('up');
        setFeedback('✅ ¡Excelente subida!');
        errorFlagRef.current = false;
      }
    }

    // Lógica de Estado 'up' (brazo flexionado)
    if (stage === 'up') {
      if (elbowAngle > EXTENDED_THRESHOLD) {
        const now = Date.now();
        // Evitar contar repeticiones muy rápidas (debounce de 1 segundo)
        if (now - lastRepTimeRef.current > 1000) {
          setStage('down');
          const newCount = repCount + 1;
          setRepCount(newCount);
          setFeedback(`💪 Repetición ${newCount} completa`);
          speak(newCount.toString());
          lastRepTimeRef.current = now;
        }
      }
    }
  };

  const getAngleColor = (angle, isElbow = false) => {
    if (isElbow) {
      // Para codos: flexionado (<60) o extendido (>160)
      if (angle < FLEXED_THRESHOLD) return 'text-green-500';
      if (angle > EXTENDED_THRESHOLD) return 'text-green-500';
      return 'text-yellow-500';
    } else {
      // Para hombros: debe estar quieto (<45)
      return angle < SHOULDER_ERROR_THRESHOLD ? 'text-green-500' : 'text-red-500';
    }
  };

  const highlightedAngles = useMemo(() => {
    const rightElbowValid = 
      (stage === 'down' && currentAngles.rightElbow > EXTENDED_THRESHOLD) ||
      (stage === 'up' && currentAngles.rightElbow < FLEXED_THRESHOLD);
    
    const rightShoulderValid = currentAngles.rightShoulder < SHOULDER_ERROR_THRESHOLD;

    return [
      { 
        indices: [12, 14, 16], 
        angle: currentAngles.rightElbow, 
        isValid: rightElbowValid 
      },
      { 
        indices: [24, 12, 14], 
        angle: currentAngles.rightShoulder, 
        isValid: rightShoulderValid 
      }
    ];
  }, [currentAngles, stage]);

  const resetCounter = () => {
    setRepCount(0);
    setStage('down');
    setFeedback('Contador reiniciado');
    errorFlagRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-indigo-900">
          🏋️ Curl de Bíceps con IA
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detector de Pose */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <YogaPoseDetector 
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightElbow, true)}`}>
                  <span className="font-medium">Codo Derecho:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightElbow}°</div>
                  <div className="text-xs opacity-75">
                    {stage === 'down' ? `Meta: >${EXTENDED_THRESHOLD}°` : `Meta: <${FLEXED_THRESHOLD}°`}
                  </div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftElbow, true)}`}>
                  <span className="font-medium">Codo Izquierdo:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftElbow}°</div>
                  <div className="text-xs opacity-75">Referencia</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightShoulder, false)}`}>
                  <span className="font-medium">Hombro Derecho:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightShoulder}°</div>
                  <div className="text-xs opacity-75">Debe estar fijo</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftShoulder, false)}`}>
                  <span className="font-medium">Hombro Izquierdo:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftShoulder}°</div>
                  <div className="text-xs opacity-75">Referencia</div>
                </div>
              </div>
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
                <div className="text-7xl font-bold text-indigo-600 mb-2">
                  {repCount}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Estado: <span className={`font-semibold ${stage === 'up' ? 'text-green-600' : 'text-blue-600'}`}>
                    {stage === 'up' ? '⬆️ Arriba' : '⬇️ Abajo'}
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

            {/* Feedback */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Feedback
              </h2>
              <div className={`text-center p-4 rounded-lg ${
                feedback.includes('No muevas') 
                  ? 'bg-red-100 text-red-700' 
                  : feedback.includes('Excelente') || feedback.includes('completa')
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
                  <span className="text-indigo-500 mr-2">1.</span>
                  <span><strong>Posición inicial:</strong> Brazo completamente extendido (&gt;160°)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">2.</span>
                  <span><strong>Subida:</strong> Flexiona el codo hasta &lt;60°</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">3.</span>
                  <span><strong>Bajada:</strong> Extiende completamente el brazo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span><strong>Importante:</strong> Mantén el hombro quieto (&lt;45°)</span>
                </li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                💪 Beneficios
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  <span>Fortalece bíceps braquial</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  <span>Mejora definición muscular</span>
                </li>
                <li className="flex items-start">
                  <span className="text-indigo-500 mr-2">✓</span>
                  <span>Aumenta fuerza de tracción</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
