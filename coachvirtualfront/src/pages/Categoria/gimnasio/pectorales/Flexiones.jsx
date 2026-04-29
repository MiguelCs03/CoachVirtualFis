import { useState, useRef, useMemo } from 'react';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

export default function Flexiones() {
  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('up');
  const [feedback, setFeedback] = useState('Comienza el ejercicio');
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    rightKnee: 180,
    leftKnee: 180,
    bodyAngle: 180
  });

  const { speak } = useSpeech({ lang: 'es-ES' });
  const errorFlagRef = useRef(false);
  const lastRepTimeRef = useRef(0);

  // Umbrales de ángulo
  const ELBOW_DOWN_THRESHOLD = 90;
  const ELBOW_UP_THRESHOLD = 160;
  const BODY_ALIGNMENT_MIN = 160;
  const KNEE_STRAIGHT_MIN = 165;

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);
    const { rightElbow, leftElbow, rightKnee, leftKnee } = angles;

    // Calcular alineación del cuerpo (hombro-cadera-tobillo)
    const rightShoulder = landmarks[12];
    const rightHip = landmarks[24];
    const rightAnkle = landmarks[28];

    const bodyAngle = calculateAngle(
      { x: rightShoulder.x, y: rightShoulder.y },
      { x: rightHip.x, y: rightHip.y },
      { x: rightAnkle.x, y: rightAnkle.y }
    );

    // Actualizar ángulos para visualización
    setCurrentAngles({
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      rightKnee: Math.round(rightKnee),
      leftKnee: Math.round(leftKnee),
      bodyAngle: Math.round(bodyAngle)
    });

    // Promedio de codos
    const avgElbow = (rightElbow + leftElbow) / 2;
    const avgKnee = (rightKnee + leftKnee) / 2;

    // Validar postura
    const kneesStraight = avgKnee > KNEE_STRAIGHT_MIN;
    const bodyAligned = bodyAngle > BODY_ALIGNMENT_MIN;

    // Regla de Error: Rodillas dobladas o cuerpo no alineado
    if ((!kneesStraight || !bodyAligned) && !errorFlagRef.current) {
      if (!kneesStraight) {
        setFeedback('⚠️ Mantén las piernas rectas');
        speak('Mantén las piernas rectas');
      } else {
        setFeedback('⚠️ Mantén el cuerpo recto');
        speak('Mantén el cuerpo recto');
      }
      errorFlagRef.current = true;
      setTimeout(() => { errorFlagRef.current = false; }, 3000);
    }

    // Lógica de Estado 'up' (brazos extendidos)
    if (stage === 'up') {
      if (avgElbow < ELBOW_DOWN_THRESHOLD && kneesStraight && bodyAligned) {
        setStage('down');
        setFeedback('✅ ¡Buena bajada!');
        errorFlagRef.current = false;
      }
    }

    // Lógica de Estado 'down' (brazos flexionados)
    if (stage === 'down') {
      if (avgElbow > ELBOW_UP_THRESHOLD) {
        const now = Date.now();
        if (now - lastRepTimeRef.current > 1000) {
          setStage('up');
          const newCount = repCount + 1;
          setRepCount(newCount);
          setFeedback(`💪 Repetición ${newCount} completa`);
          speak(newCount.toString());
          lastRepTimeRef.current = now;
        }
      }
    }
  };

  const calculateAngle = (a, b, c) => {
    const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
    let angle = Math.abs(radians * 180.0 / Math.PI);
    if (angle > 180.0) angle = 360 - angle;
    return angle;
  };

  const getAngleColor = (angle, type) => {
    if (type === 'elbow') {
      if (stage === 'up' && angle > ELBOW_UP_THRESHOLD) return 'text-green-500';
      if (stage === 'down' && angle < ELBOW_DOWN_THRESHOLD) return 'text-green-500';
      return 'text-yellow-500';
    }
    if (type === 'knee' || type === 'body') {
      return angle > (type === 'knee' ? KNEE_STRAIGHT_MIN : BODY_ALIGNMENT_MIN)
        ? 'text-green-500'
        : 'text-red-500';
    }
    return 'text-gray-500';
  };

  const highlightedAngles = useMemo(() => {
    const elbowValid = stage === 'down'
      ? (currentAngles.rightElbow + currentAngles.leftElbow) / 2 < ELBOW_DOWN_THRESHOLD
      : (currentAngles.rightElbow + currentAngles.leftElbow) / 2 > ELBOW_UP_THRESHOLD;

    const bodyValid = currentAngles.bodyAngle > BODY_ALIGNMENT_MIN;
    const kneesValid = (currentAngles.rightKnee + currentAngles.leftKnee) / 2 > KNEE_STRAIGHT_MIN;

    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: elbowValid },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: elbowValid },
      { indices: [12, 24, 28], angle: currentAngles.bodyAngle, isValid: bodyValid },
      { indices: [24, 26, 28], angle: currentAngles.rightKnee, isValid: kneesValid },
    ];
  }, [currentAngles, stage]);

  const resetCounter = () => {
    setRepCount(0);
    setStage('up');
    setFeedback('Contador reiniciado');
    errorFlagRef.current = false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-orange-900">
          💪 Flexiones de Pecho con IA
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
                <div className="pushup-animation">
                  <div className="pushup-body"></div>
                </div>
              </div>
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightElbow, 'elbow')}`}>
                  <span className="font-medium">Codo Der:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightElbow}°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftElbow, 'elbow')}`}>
                  <span className="font-medium">Codo Izq:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftElbow}°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightKnee, 'knee')}`}>
                  <span className="font-medium">Rodilla Der:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightKnee}°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftKnee, 'knee')}`}>
                  <span className="font-medium">Rodilla Izq:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftKnee}°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.bodyAngle, 'body')}`}>
                  <span className="font-medium">Cuerpo:</span>
                  <div className="text-2xl font-bold">{currentAngles.bodyAngle}°</div>
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
                <div className="text-7xl font-bold text-orange-600 mb-2">
                  {repCount}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Estado: <span className={`font-semibold ${stage === 'down' ? 'text-green-600' : 'text-blue-600'}`}>
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

            {/* Feedback */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                Feedback
              </h2>
              <div className={`text-center p-4 rounded-lg ${feedback.includes('⚠️')
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
                  <span className="text-orange-500 mr-2">📹</span>
                  <span><strong>Cámara:</strong> Colócate DE LADO (perfil)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">1.</span>
                  <span><strong>Posición inicial:</strong> Brazos extendidos (&gt;160°)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">2.</span>
                  <span><strong>Bajada:</strong> Flexiona codos hasta ~90°</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">3.</span>
                  <span><strong>Subida:</strong> Empuja hasta extender brazos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span><strong>Importante:</strong> Mantén cuerpo recto y piernas extendidas</span>
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
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Fortalece pecho, tríceps y hombros</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Mejora estabilidad del core</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Aumenta fuerza funcional</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pushup {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(20px); }
        }

        .pushup-animation {
          width: 200px;
          height: 100px;
          position: relative;
        }

        .pushup-body {
          width: 120px;
          height: 20px;
          background: linear-gradient(to right, #f97316, #ea580c);
          border-radius: 10px;
          position: absolute;
          top: 40px;
          left: 40px;
          animation: pushup 2s ease-in-out infinite;
        }

        .pushup-body::before {
          content: '';
          width: 25px;
          height: 25px;
          background: #f97316;
          border-radius: 50%;
          position: absolute;
          left: -15px;
          top: -3px;
        }

        .pushup-body::after {
          content: '';
          width: 60px;
          height: 3px;
          background: #9ca3af;
          position: absolute;
          bottom: -20px;
          left: 30px;
        }
      `}</style>
    </div>
  );
}
