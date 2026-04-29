import { useState, useRef, useEffect, useMemo } from 'react';
import YogaPoseDetector from './YogaPoseDetector';
import { calculateAngle } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function Virabhadrasana({ timer = 10 }) {
  const [secondsHeld, setSecondsHeld] = useState(0);
  const [isCorrectPose, setIsCorrectPose] = useState(false);
  const [feedback, setFeedback] = useState('Intenta imitar la postura');
  const [completed, setCompleted] = useState(false);
  
  const [angles, setAngles] = useState({
    leftHand: 0,
    rightHand: 0,
    leftLeg: 0,
    rightLeg: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });
  const startTimeRef = useRef(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    // Reset cuando cambia el timer
    setSecondsHeld(0);
    setCompleted(false);
    startTimeRef.current = null;
  }, [timer]);

  const handlePoseDetected = (landmarks) => {
    // Calcular ángulos de brazos
    const leftHandAngle = calculateAngle(
      landmarks[11], // hombro izquierdo
      landmarks[13], // codo izquierdo
      landmarks[15]  // muñeca izquierda
    );

    const rightHandAngle = calculateAngle(
      landmarks[12], // hombro derecho
      landmarks[14], // codo derecho
      landmarks[16]  // muñeca derecha
    );

    // Calcular ángulos de piernas
    const leftLegAngle = calculateAngle(
      landmarks[23], // cadera izquierda
      landmarks[25], // rodilla izquierda
      landmarks[27]  // tobillo izquierdo
    );

    const rightLegAngle = calculateAngle(
      landmarks[24], // cadera derecha
      landmarks[26], // rodilla derecha
      landmarks[28]  // tobillo derecho
    );

    // Actualizar ángulos para visualización
    setAngles({
      leftHand: Math.round(leftHandAngle),
      rightHand: Math.round(rightHandAngle),
      leftLeg: Math.round(leftLegAngle),
      rightLeg: Math.round(rightLegAngle)
    });

    // Validar rangos
    const inRangeLeftHand = leftHandAngle >= 170 && leftHandAngle <= 190;
    const inRangeRightHand = rightHandAngle >= 170 && rightHandAngle <= 190;
    const inRangeLeftLeg = leftLegAngle >= 110 && leftLegAngle <= 130;
    const inRangeRightLeg = rightLegAngle >= 170 && rightLegAngle <= 190;

    const allCorrect = inRangeLeftHand && inRangeRightHand && 
                       inRangeLeftLeg && inRangeRightLeg;

    setIsCorrectPose(allCorrect);

    // Lógica del timer
    const now = Date.now();
    if (allCorrect) {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
        setFeedback('¡Excelente! Mantén la postura del guerrero');
      }
      
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      setSecondsHeld(elapsed);

      // Completar cuando alcanza el tiempo objetivo
      if (elapsed >= timer && !completed) {
        setCompleted(true);
        setFeedback(`¡Felicidades! Completaste ${timer} segundos en Virabhadrasana`);
        speak(`Has realizado Virabhadrasana por ${timer} segundos`);
      }
    } else {
      // Reset si pierde la postura
      if (startTimeRef.current && now - lastUpdateRef.current > 100) {
        startTimeRef.current = null;
        setSecondsHeld(0);
        setFeedback('Ajusta tu postura');
        lastUpdateRef.current = now;
      }
    }
  };

  const getAngleColor = (angle, min, max) => {
    return angle >= min && angle <= max ? 'text-green-500' : 'text-red-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-orange-900">
          🗡️ Virabhadrasana (Postura del Guerrero)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detector de Pose */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <YogaPoseDetector 
                onPoseDetected={handlePoseDetected}
                highlightedAngles={useMemo(() => [
                  { indices: [11, 13, 15], angle: angles.leftHand, isValid: angles.leftHand >= 170 && angles.leftHand <= 190 },
                  { indices: [12, 14, 16], angle: angles.rightHand, isValid: angles.rightHand >= 170 && angles.rightHand <= 190 },
                  { indices: [23, 25, 27], angle: angles.leftLeg, isValid: angles.leftLeg >= 110 && angles.leftLeg <= 130 },
                  { indices: [24, 26, 28], angle: angles.rightLeg, isValid: angles.rightLeg >= 170 && angles.rightLeg <= 190 },
                ], [angles])}
              />
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(angles.leftHand, 170, 190)}`}>
                  <span className="font-medium">Brazo Izq:</span>
                  <div className="text-2xl font-bold">{angles.leftHand}°</div>
                  <div className="text-xs opacity-75">170-190°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(angles.rightHand, 170, 190)}`}>
                  <span className="font-medium">Brazo Der:</span>
                  <div className="text-2xl font-bold">{angles.rightHand}°</div>
                  <div className="text-xs opacity-75">170-190°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(angles.leftLeg, 110, 130)}`}>
                  <span className="font-medium">Pierna Izq:</span>
                  <div className="text-2xl font-bold">{angles.leftLeg}°</div>
                  <div className="text-xs opacity-75">110-130°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(angles.rightLeg, 170, 190)}`}>
                  <span className="font-medium">Pierna Der:</span>
                  <div className="text-2xl font-bold">{angles.rightLeg}°</div>
                  <div className="text-xs opacity-75">170-190°</div>
                </div>
              </div>
            </div>
          </div>

          {/* Panel de información */}
          <div className="space-y-6">
            {/* Timer */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Tiempo</h2>
              <div className="text-center">
                <div className={`text-6xl font-bold ${isCorrectPose ? 'text-green-600' : 'text-gray-400'}`}>
                  {secondsHeld}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  Objetivo: <span className="font-semibold">{timer}s</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div
                    className={`h-3 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-orange-600'}`}
                    style={{ width: `${Math.min((secondsHeld / timer) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Feedback */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Estado</h2>
              <div className={`text-center p-4 rounded-lg ${
                completed 
                  ? 'bg-green-100 text-green-700' 
                  : isCorrectPose 
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                <p className="text-lg font-medium">{feedback}</p>
              </div>
            </div>

            {/* Instrucciones */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">📋 Instrucciones</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Separa los pies ampliamente</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Dobla la pierna izquierda a 110-130°</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Mantén la pierna derecha recta (170-190°)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Extiende ambos brazos completamente</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">•</span>
                  <span>Brazos alineados (170-190°)</span>
                </li>
              </ul>
            </div>

            {/* Beneficios */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">💪 Beneficios</h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Fortalece piernas y tobillos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Mejora el equilibrio</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2">✓</span>
                  <span>Aumenta la resistencia</span>
                </li>
              </ul>
            </div>

            {/* Imagen de referencia */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Postura de Referencia</h2>
              <div className="flex justify-center">
                <div className="text-6xl">⚔️</div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                Postura del Guerrero
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
