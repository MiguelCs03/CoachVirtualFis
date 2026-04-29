import { useState, useRef, useEffect, useMemo } from 'react';
import YogaPoseDetector from './YogaPoseDetector';
import { calculateAngle } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function Tadasana({ timer = 10 }) {
  const [secondsHeld, setSecondsHeld] = useState(0);
  const [isCorrectPose, setIsCorrectPose] = useState(false);
  const [feedback, setFeedback] = useState('Intenta imitar la postura');
  const [completed, setCompleted] = useState(false);
  
  const [angles, setAngles] = useState({
    leftWaist: 0,
    rightWaist: 0,
    leftShoulder: 0,
    rightShoulder: 0,
    leftHand: 0,
    rightHand: 0
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
    // Calcular todos los ángulos necesarios
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

    const leftShoulderAngle = calculateAngle(
      landmarks[13], // codo izquierdo
      landmarks[11], // hombro izquierdo
      landmarks[23]  // cadera izquierda
    );

    const rightShoulderAngle = calculateAngle(
      landmarks[14], // codo derecho
      landmarks[12], // hombro derecho
      landmarks[24]  // cadera derecha
    );

    const leftWaistAngle = calculateAngle(
      landmarks[12], // hombro derecho
      landmarks[24], // cadera derecha
      landmarks[28]  // tobillo derecho
    );

    const rightWaistAngle = calculateAngle(
      landmarks[11], // hombro izquierdo
      landmarks[23], // cadera izquierda
      landmarks[27]  // tobillo izquierdo
    );

    // Actualizar ángulos para visualización
    setAngles({
      leftHand: Math.round(leftHandAngle),
      rightHand: Math.round(rightHandAngle),
      leftShoulder: Math.round(leftShoulderAngle),
      rightShoulder: Math.round(rightShoulderAngle),
      leftWaist: Math.round(leftWaistAngle),
      rightWaist: Math.round(rightWaistAngle)
    });

    // Validar rangos
    const inRangeLeftWaist = leftWaistAngle >= 170 && leftWaistAngle <= 190;
    const inRangeRightWaist = rightWaistAngle >= 170 && rightWaistAngle <= 190;
    const inRangeLeftShoulder = leftShoulderAngle >= 170 && leftShoulderAngle <= 190;
    const inRangeRightShoulder = rightShoulderAngle >= 170 && rightShoulderAngle <= 190;
    const inRangeLeftHand = leftHandAngle >= 160 && leftHandAngle <= 200;
    const inRangeRightHand = rightHandAngle >= 160 && rightHandAngle <= 200;

    const allCorrect = inRangeLeftWaist && inRangeRightWaist && 
                       inRangeLeftShoulder && inRangeRightShoulder &&
                       inRangeLeftHand && inRangeRightHand;

    setIsCorrectPose(allCorrect);

    // Lógica del timer
    const now = Date.now();
    if (allCorrect) {
      if (!startTimeRef.current) {
        startTimeRef.current = now;
        setFeedback('¡Excelente! Mantén la postura');
      }
      
      const elapsed = Math.floor((now - startTimeRef.current) / 1000);
      setSecondsHeld(elapsed);

      // Completar cuando alcanza el tiempo objetivo
      if (elapsed >= timer && !completed) {
        setCompleted(true);
        setFeedback(`¡Felicidades! Completaste ${timer} segundos en Tadasana`);
        speak(`Has realizado Tadasana por ${timer} segundos`);
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-purple-900">
          🧘‍♀️ Tadasana (Postura de la Montaña)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detector de Pose */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <YogaPoseDetector 
                onPoseDetected={handlePoseDetected}
                highlightedAngles={useMemo(() => [
                  { indices: [11, 13, 15], angle: angles.leftHand, isValid: angles.leftHand >= 160 && angles.leftHand <= 200 },
                  { indices: [12, 14, 16], angle: angles.rightHand, isValid: angles.rightHand >= 160 && angles.rightHand <= 200 },
                  { indices: [13, 11, 23], angle: angles.leftShoulder, isValid: angles.leftShoulder >= 170 && angles.leftShoulder <= 190 },
                  { indices: [14, 12, 24], angle: angles.rightShoulder, isValid: angles.rightShoulder >= 170 && angles.rightShoulder <= 190 },
                  { indices: [12, 24, 28], angle: angles.leftWaist, isValid: angles.leftWaist >= 170 && angles.leftWaist <= 190 },
                  { indices: [11, 23, 27], angle: angles.rightWaist, isValid: angles.rightWaist >= 170 && angles.rightWaist <= 190 },
                ], [angles])}
              />
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className={`p-2 rounded ${getAngleColor(angles.leftHand, 160, 200)}`}>
                  <span className="font-medium">Brazo Izq:</span> {angles.leftHand}°
                </div>
                <div className={`p-2 rounded ${getAngleColor(angles.rightHand, 160, 200)}`}>
                  <span className="font-medium">Brazo Der:</span> {angles.rightHand}°
                </div>
                <div className={`p-2 rounded ${getAngleColor(angles.leftShoulder, 170, 190)}`}>
                  <span className="font-medium">Hombro Izq:</span> {angles.leftShoulder}°
                </div>
                <div className={`p-2 rounded ${getAngleColor(angles.rightShoulder, 170, 190)}`}>
                  <span className="font-medium">Hombro Der:</span> {angles.rightShoulder}°
                </div>
                <div className={`p-2 rounded ${getAngleColor(angles.leftWaist, 170, 190)}`}>
                  <span className="font-medium">Cintura Izq:</span> {angles.leftWaist}°
                </div>
                <div className={`p-2 rounded ${getAngleColor(angles.rightWaist, 170, 190)}`}>
                  <span className="font-medium">Cintura Der:</span> {angles.rightWaist}°
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
                    className={`h-3 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-purple-600'}`}
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
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Párate derecho con los pies juntos</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Brazos extendidos hacia arriba</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Mantén la columna recta (170-190°)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Hombros alineados con caderas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-purple-500 mr-2">•</span>
                  <span>Brazos completamente extendidos (160-200°)</span>
                </li>
              </ul>
            </div>

            {/* Imagen de referencia */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Postura de Referencia</h2>
              <div className="flex justify-center">
                <div className="text-6xl">🧘‍♀️</div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                Postura de la Montaña
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
