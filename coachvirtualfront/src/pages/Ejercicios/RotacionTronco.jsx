import { useState, useRef, useMemo } from 'react';
import YogaPoseDetector from '../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function RotacionTronco() {
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('center');
  const [feedback, setFeedback] = useState('Comienza el ejercicio');
  const [currentAngles, setCurrentAngles] = useState({
    shoulderRotation: 0,
    hipRotation: 0,
    shoulderAngle: 180,
    hipAngle: 180
  });
  
  const { speak } = useSpeech({ lang: 'es-ES' });
  const errorFlagRef = useRef(false);
  const lastRepTimeRef = useRef(0);
  const lastSideRef = useRef('center');

  // Umbrales de rotación
  const ROTATION_THRESHOLD = 25; // Grados de rotación mínima
  const HIP_STABLE_MAX = 15; // Máxima rotación permitida de caderas

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    
    // Calcular rotación de hombros (diferencia entre hombros)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // Calcular ángulo de línea de hombros respecto a horizontal
    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * 180 / Math.PI;

    // Calcular ángulo de línea de caderas respecto a horizontal
    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    ) * 180 / Math.PI;

    // Normalizar ángulos
    const shoulderRotation = Math.abs(shoulderAngle);
    const hipRotation = Math.abs(hipAngle);

    // Actualizar ángulos para visualización
    setCurrentAngles({
      shoulderRotation: Math.round(shoulderRotation),
      hipRotation: Math.round(hipRotation),
      shoulderAngle: Math.round(shoulderAngle),
      hipAngle: Math.round(hipAngle)
    });

    // Validar estabilidad de caderas
    if (hipRotation > HIP_STABLE_MAX && !errorFlagRef.current) {
      setFeedback('⚠️ Mantén las caderas estables');
      speak('Mantén las caderas estables, no las muevas');
      errorFlagRef.current = true;
      setTimeout(() => { errorFlagRef.current = false; }, 3000);
    }

    // Detectar lado de rotación basado en la posición de los hombros
    let currentSide = 'center';
    if (shoulderRotation > ROTATION_THRESHOLD) {
      // Determinar si es izquierda o derecha basándose en el ángulo
      currentSide = shoulderAngle > 0 ? 'right' : 'left';
    }

    // Lógica de conteo de repeticiones
    if (stage === 'center' && currentSide !== 'center') {
      setStage(currentSide);
      lastSideRef.current = currentSide;
      setFeedback(`✅ Rotación hacia ${currentSide === 'right' ? 'derecha' : 'izquierda'}`);
    } else if (stage !== 'center' && currentSide !== 'center' && currentSide !== stage) {
      // Cambió de lado sin pasar por centro
      const now = Date.now();
      if (now - lastRepTimeRef.current > 1000 && hipRotation < HIP_STABLE_MAX) {
        const newCount = repCount + 1;
        setRepCount(newCount);
        setFeedback(`💪 Repetición ${newCount} completa`);
        speak(newCount.toString());
        lastRepTimeRef.current = now;
        setStage(currentSide);
        lastSideRef.current = currentSide;
      }
    } else if (currentSide === 'center' && stage !== 'center') {
      setStage('center');
      setFeedback('Volviendo al centro');
    }
  };

  const getAngleColor = (value, type) => {
    if (type === 'shoulder') {
      return value > ROTATION_THRESHOLD ? 'text-green-500' : 'text-yellow-500';
    }
    if (type === 'hip') {
      return value < HIP_STABLE_MAX ? 'text-green-500' : 'text-red-500';
    }
    return 'text-gray-500';
  };

  const highlightedAngles = useMemo(() => {
    const shoulderValid = currentAngles.shoulderRotation > ROTATION_THRESHOLD;
    const hipValid = currentAngles.hipRotation < HIP_STABLE_MAX;

    return [
      { indices: [11, 12], angle: currentAngles.shoulderAngle, isValid: shoulderValid },
      { indices: [23, 24], angle: currentAngles.hipAngle, isValid: hipValid },
    ];
  }, [currentAngles]);

  const resetCounter = () => {
    setRepCount(0);
    setStage('center');
    setFeedback('Contador reiniciado');
    errorFlagRef.current = false;
    lastSideRef.current = 'center';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-900">
          🔄 Rotación de Tronco con IA
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

            {/* Animación de referencia */}
            <div className="bg-white rounded-lg shadow-xl p-6 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 text-center">
                📹 Animación de Referencia
              </h3>
              <div className="flex justify-center">
                <div className="rotation-animation">
                  <div className="rotation-body">
                    <div className="rotation-shoulders"></div>
                    <div className="rotation-hips"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Métricas de Rotación</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className={`p-4 rounded ${getAngleColor(currentAngles.shoulderRotation, 'shoulder')}`}>
                  <span className="font-medium">Rotación Hombros:</span>
                  <div className="text-3xl font-bold">{currentAngles.shoulderRotation}°</div>
                  <div className="text-xs opacity-75 mt-1">
                    Meta: &gt;{ROTATION_THRESHOLD}°
                  </div>
                  <div className="text-xs font-semibold mt-1">
                    {currentAngles.shoulderAngle > 0 ? '→ Derecha' : currentAngles.shoulderAngle < 0 ? '← Izquierda' : '↔ Centro'}
                  </div>
                </div>
                <div className={`p-4 rounded ${getAngleColor(currentAngles.hipRotation, 'hip')}`}>
                  <span className="font-medium">Estabilidad Caderas:</span>
                  <div className="text-3xl font-bold">{currentAngles.hipRotation}°</div>
                  <div className="text-xs opacity-75 mt-1">
                    Máx: &lt;{HIP_STABLE_MAX}°
                  </div>
                  <div className="text-xs font-semibold mt-1">
                    {currentAngles.hipRotation < HIP_STABLE_MAX ? '✅ Estables' : '⚠️ Moviéndose'}
                  </div>
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
                <div className="text-7xl font-bold text-purple-600 mb-2">
                  {repCount}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Posición: <span className={`font-semibold ${
                    stage === 'left' ? 'text-blue-600' : 
                    stage === 'right' ? 'text-green-600' : 
                    'text-gray-600'
                  }`}>
                    {stage === 'left' ? '⬅️ Izquierda' : stage === 'right' ? '➡️ Derecha' : '↔️ Centro'}
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
                feedback.includes('⚠️') 
                  ? 'bg-red-100 text-red-700' 
                  : feedback.includes('✅') || feedback.includes('completa')
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
                  <span className="text-purple-500 mr-2">📹</span>
                  <span><strong>Cámara:</strong> Colócate DE FRENTE</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">1.</span>
                  <span><strong>Posición inicial:</strong> De pie, brazos relajados</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">2.</span>
                  <span><strong>Rotación:</strong> Gira los hombros &gt;{ROTATION_THRESHOLD}° a cada lado</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">3.</span>
                  <span><strong>Alternancia:</strong> Cambia de lado para completar repetición</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span><strong>Importante:</strong> Mantén caderas estables (&lt;{HIP_STABLE_MAX}°)</span>
                </li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                💪 Beneficios (Fisioterapia)
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Mejora movilidad de columna torácica</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Reduce tensión en espalda baja</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Fortalece oblicuos y core</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Previene lesiones de espalda</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes rotate-torso {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-30deg); }
          50% { transform: rotate(0deg); }
          75% { transform: rotate(30deg); }
        }

        .rotation-animation {
          width: 200px;
          height: 200px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rotation-body {
          width: 80px;
          height: 120px;
          position: relative;
        }

        .rotation-shoulders {
          width: 80px;
          height: 40px;
          background: linear-gradient(to right, #a855f7, #ec4899);
          border-radius: 20px;
          position: absolute;
          top: 20px;
          animation: rotate-torso 4s ease-in-out infinite;
          transform-origin: center center;
        }

        .rotation-shoulders::before {
          content: '';
          width: 30px;
          height: 30px;
          background: #a855f7;
          border-radius: 50%;
          position: absolute;
          left: 25px;
          top: -15px;
        }

        .rotation-hips {
          width: 60px;
          height: 60px;
          background: #9ca3af;
          border-radius: 10px;
          position: absolute;
          bottom: 0;
          left: 10px;
        }
      `}</style>
    </div>
  );
}
