import { useState, useRef, useMemo, useEffect } from 'react';
import YogaPoseDetector from '../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function Plancha() {
  const [timeHeld, setTimeHeld] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [feedback, setFeedback] = useState('Comienza el ejercicio');
  const [bestTime, setBestTime] = useState(0);
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    bodyAngle: 180,
    hipAngle: 180,
    rightKnee: 180,
    leftKnee: 180
  });
  
  const { speak } = useSpeech({ lang: 'es-ES' });
  const errorFlagRef = useRef(false);
  const timerRef = useRef(null);
  const lastAnnouncementRef = useRef(0);

  // Umbrales de ángulo
  const ELBOW_MIN = 70;
  const ELBOW_MAX = 110;
  const BODY_ALIGNMENT_MIN = 160;
  const HIP_ALIGNMENT_MIN = 160;
  const KNEE_STRAIGHT_MIN = 165;

  // Timer para mantener la posición
  useEffect(() => {
    if (isHolding) {
      timerRef.current = setInterval(() => {
        setTimeHeld(prev => {
          const newTime = prev + 0.1;
          
          // Anunciar cada 5 segundos
          if (Math.floor(newTime) % 5 === 0 && Math.floor(newTime) !== lastAnnouncementRef.current) {
            speak(`${Math.floor(newTime)} segundos`);
            lastAnnouncementRef.current = Math.floor(newTime);
          }
          
          return newTime;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isHolding, speak]);

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

    // Calcular ángulo de cadera (no debe estar muy arriba o abajo)
    const leftShoulder = landmarks[11];
    const leftHip = landmarks[23];
    const leftAnkle = landmarks[27];
    
    const hipAngle = calculateAngle(
      { x: leftShoulder.x, y: leftShoulder.y },
      { x: leftHip.x, y: leftHip.y },
      { x: leftAnkle.x, y: leftAnkle.y }
    );

    // Actualizar ángulos para visualización
    setCurrentAngles({
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      bodyAngle: Math.round(bodyAngle),
      hipAngle: Math.round(hipAngle),
      rightKnee: Math.round(rightKnee),
      leftKnee: Math.round(leftKnee)
    });

    // Promedio de codos y rodillas
    const avgElbow = (rightElbow + leftElbow) / 2;
    const avgKnee = (rightKnee + leftKnee) / 2;
    const avgBodyAlignment = (bodyAngle + hipAngle) / 2;

    // Validar postura de plancha
    const elbowsCorrect = avgElbow >= ELBOW_MIN && avgElbow <= ELBOW_MAX;
    const bodyAligned = avgBodyAlignment > BODY_ALIGNMENT_MIN;
    const kneesExtended = avgKnee > KNEE_STRAIGHT_MIN;

    const isCorrectPlank = elbowsCorrect && bodyAligned && kneesExtended;

    // Gestión del estado de holding
    if (isCorrectPlank && !isHolding) {
      setIsHolding(true);
      setFeedback('✅ ¡Excelente! Mantén la posición');
      speak('Muy bien, mantén la posición');
      errorFlagRef.current = false;
    } else if (!isCorrectPlank && isHolding) {
      setIsHolding(false);
      if (timeHeld > bestTime) {
        setBestTime(timeHeld);
        speak(`Nuevo récord: ${Math.floor(timeHeld)} segundos`);
      }
    }

    // Feedback de errores
    if (!isCorrectPlank && !errorFlagRef.current) {
      if (!elbowsCorrect) {
        setFeedback('⚠️ Codos a 90° (apoyados en antebrazos)');
        speak('Apoya los codos a 90 grados');
      } else if (!bodyAligned) {
        setFeedback('⚠️ Mantén el cuerpo recto, no subas o bajes la cadera');
        speak('Mantén el cuerpo recto');
      } else if (!kneesExtended) {
        setFeedback('⚠️ Extiende las piernas completamente');
        speak('Extiende las piernas');
      }
      errorFlagRef.current = true;
      setTimeout(() => { errorFlagRef.current = false; }, 2000);
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
      return (angle >= ELBOW_MIN && angle <= ELBOW_MAX) ? 'text-green-500' : 'text-red-500';
    }
    if (type === 'body' || type === 'hip') {
      return angle > BODY_ALIGNMENT_MIN ? 'text-green-500' : 'text-red-500';
    }
    if (type === 'knee') {
      return angle > KNEE_STRAIGHT_MIN ? 'text-green-500' : 'text-red-500';
    }
    return 'text-gray-500';
  };

  const highlightedAngles = useMemo(() => {
    const elbowValid = (currentAngles.rightElbow >= ELBOW_MIN && currentAngles.rightElbow <= ELBOW_MAX) &&
                       (currentAngles.leftElbow >= ELBOW_MIN && currentAngles.leftElbow <= ELBOW_MAX);
    const bodyValid = currentAngles.bodyAngle > BODY_ALIGNMENT_MIN && currentAngles.hipAngle > HIP_ALIGNMENT_MIN;
    const kneesValid = currentAngles.rightKnee > KNEE_STRAIGHT_MIN && currentAngles.leftKnee > KNEE_STRAIGHT_MIN;

    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: elbowValid },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: elbowValid },
      { indices: [12, 24, 28], angle: currentAngles.bodyAngle, isValid: bodyValid },
      { indices: [11, 23, 27], angle: currentAngles.hipAngle, isValid: bodyValid },
      { indices: [24, 26, 28], angle: currentAngles.rightKnee, isValid: kneesValid },
    ];
  }, [currentAngles]);

  const resetTimer = () => {
    if (timeHeld > bestTime) {
      setBestTime(timeHeld);
    }
    setTimeHeld(0);
    setIsHolding(false);
    setFeedback('Timer reiniciado');
    lastAnnouncementRef.current = 0;
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-teal-900">
          🏋️ Plancha con IA
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
                <div className="plank-animation">
                  <div className="plank-body"></div>
                </div>
              </div>
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightElbow, 'elbow')}`}>
                  <span className="font-medium">Codo Der:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightElbow}°</div>
                  <div className="text-xs opacity-75">Meta: 70-110°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftElbow, 'elbow')}`}>
                  <span className="font-medium">Codo Izq:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftElbow}°</div>
                  <div className="text-xs opacity-75">Meta: 70-110°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.bodyAngle, 'body')}`}>
                  <span className="font-medium">Cuerpo:</span>
                  <div className="text-2xl font-bold">{currentAngles.bodyAngle}°</div>
                  <div className="text-xs opacity-75">Meta: &gt;160°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.hipAngle, 'hip')}`}>
                  <span className="font-medium">Cadera:</span>
                  <div className="text-2xl font-bold">{currentAngles.hipAngle}°</div>
                  <div className="text-xs opacity-75">Meta: &gt;160°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.rightKnee, 'knee')}`}>
                  <span className="font-medium">Rodilla Der:</span>
                  <div className="text-2xl font-bold">{currentAngles.rightKnee}°</div>
                  <div className="text-xs opacity-75">Meta: &gt;165°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(currentAngles.leftKnee, 'knee')}`}>
                  <span className="font-medium">Rodilla Izq:</span>
                  <div className="text-2xl font-bold">{currentAngles.leftKnee}°</div>
                  <div className="text-xs opacity-75">Meta: &gt;165°</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de Información */}
          <div className="space-y-6">
            {/* Cronómetro */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                ⏱️ Tiempo
              </h2>
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 font-mono ${isHolding ? 'text-green-600' : 'text-gray-400'}`}>
                  {formatTime(timeHeld)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Estado: <span className={`font-semibold ${isHolding ? 'text-green-600' : 'text-red-600'}`}>
                    {isHolding ? '✅ Manteniendo' : '⏸️ Pausado'}
                  </span>
                </div>
                <button 
                  onClick={resetTimer}
                  className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  🔄 Reiniciar
                </button>
              </div>
            </div>

            {/* Mejor Tiempo */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">
                🏆 Mejor Tiempo
              </h2>
              <div className="text-center">
                <div className="text-5xl font-bold text-teal-600 font-mono">
                  {formatTime(bestTime)}
                </div>
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
                  : feedback.includes('✅')
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
                  <span className="text-teal-500 mr-2">📹</span>
                  <span><strong>Cámara:</strong> Colócate DE LADO (perfil)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">1.</span>
                  <span><strong>Posición:</strong> Apoya los antebrazos, codos a 90°</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">2.</span>
                  <span><strong>Cuerpo:</strong> Mantén línea recta (hombro-cadera-tobillo)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">3.</span>
                  <span><strong>Piernas:</strong> Completamente extendidas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">⚠️</span>
                  <span><strong>Importante:</strong> No subas ni bajes la cadera</span>
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
                  <span className="text-teal-500 mr-2">✓</span>
                  <span>Fortalece el core completo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">✓</span>
                  <span>Mejora postura y estabilidad</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">✓</span>
                  <span>Previene dolor de espalda</span>
                </li>
                <li className="flex items-start">
                  <span className="text-teal-500 mr-2">✓</span>
                  <span>Aumenta resistencia muscular</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .plank-animation {
          width: 200px;
          height: 100px;
          position: relative;
        }

        .plank-body {
          width: 140px;
          height: 18px;
          background: linear-gradient(to right, #14b8a6, #06b6d4);
          border-radius: 10px;
          position: absolute;
          top: 50px;
          left: 30px;
        }

        .plank-body::before {
          content: '';
          width: 25px;
          height: 25px;
          background: #14b8a6;
          border-radius: 50%;
          position: absolute;
          left: -15px;
          top: -4px;
        }

        .plank-body::after {
          content: '';
          width: 30px;
          height: 4px;
          background: #14b8a6;
          position: absolute;
          bottom: -8px;
          left: 0;
          border-radius: 2px;
        }

        @keyframes hold {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        .plank-body {
          animation: hold 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
