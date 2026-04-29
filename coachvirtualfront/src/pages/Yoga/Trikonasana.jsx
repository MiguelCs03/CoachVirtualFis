import { useState, useRef, useEffect, useMemo } from 'react';
import YogaPoseDetector from './YogaPoseDetector';
import { calculateAngle } from '../../utils/poseUtils';
import { useSpeech } from '../../utils/useSpeech';

export default function Trikonasana({ timer = 10 }) {
  const [secondsHeld, setSecondsHeld] = useState(0);
  const [isCorrectPose, setIsCorrectPose] = useState(false);
  const [feedback, setFeedback] = useState('Intenta imitar la postura');
  const [completed, setCompleted] = useState(false);
  
  const [angles, setAngles] = useState({
    leftHand: 0,
    rightHand: 0,
    back: 0
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
    // Calcular ángulos
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

    const backAngle = calculateAngle(
      landmarks[12], // hombro derecho
      landmarks[24], // cadera derecha
      landmarks[26]  // rodilla derecha
    );

    // Actualizar ángulos para visualización
    setAngles({
      leftHand: Math.round(leftHandAngle),
      rightHand: Math.round(rightHandAngle),
      back: Math.round(backAngle)
    });

    // Validar rangos
    const inRangeBack = backAngle >= 110 && backAngle <= 150;
    const inRangeLeftHand = leftHandAngle >= 165 && leftHandAngle <= 195;
    const inRangeRightHand = rightHandAngle >= 165 && rightHandAngle <= 195;

    const allCorrect = inRangeBack && inRangeLeftHand && inRangeRightHand;

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
        setFeedback(`¡Felicidades! Completaste ${timer} segundos en Trikonasana`);
        speak(`Has realizado Trikonasana por ${timer} segundos`);
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-blue-900">
          🧘‍♂️ Trikonasana (Postura del Triángulo)
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detector de Pose */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <YogaPoseDetector 
                onPoseDetected={handlePoseDetected}
                highlightedAngles={useMemo(() => [
                  { indices: [11, 13, 15], angle: angles.leftHand, isValid: angles.leftHand >= 165 && angles.leftHand <= 195 },
                  { indices: [12, 14, 16], angle: angles.rightHand, isValid: angles.rightHand >= 165 && angles.rightHand <= 195 },
                  { indices: [12, 24, 26], angle: angles.back, isValid: angles.back >= 110 && angles.back <= 150 },
                ], [angles])}
              />
            </div>

            {/* Indicadores de ángulos */}
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className={`p-3 rounded ${getAngleColor(angles.leftHand, 165, 195)}`}>
                  <span className="font-medium">Brazo Izquierdo:</span>
                  <div className="text-2xl font-bold">{angles.leftHand}°</div>
                  <div className="text-xs opacity-75">Rango: 165-195°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(angles.rightHand, 165, 195)}`}>
                  <span className="font-medium">Brazo Derecho:</span>
                  <div className="text-2xl font-bold">{angles.rightHand}°</div>
                  <div className="text-xs opacity-75">Rango: 165-195°</div>
                </div>
                <div className={`p-3 rounded ${getAngleColor(angles.back, 110, 150)}`}>
                  <span className="font-medium">Espalda:</span>
                  <div className="text-2xl font-bold">{angles.back}°</div>
                  <div className="text-xs opacity-75">Rango: 110-150°</div>
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
                    className={`h-3 rounded-full transition-all ${completed ? 'bg-green-500' : 'bg-blue-600'}`}
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
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Separa los pies a lo ancho de las piernas</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Extiende los brazos paralelos al suelo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Inclínate hacia un lado formando un triángulo</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Mantén ambos brazos extendidos (165-195°)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">•</span>
                  <span>Espalda inclinada entre 110-150°</span>
                </li>
              </ul>
            </div>

            {/* Imagen de referencia */}
            <div className="bg-white rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Postura de Referencia</h2>
              <div className="flex justify-center">
                <div className="text-6xl">🔺</div>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                Postura del Triángulo
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
