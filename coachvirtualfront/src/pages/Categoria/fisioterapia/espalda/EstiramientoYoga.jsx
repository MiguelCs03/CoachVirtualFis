import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';

/**
 * Vista de rutina de Estiramiento Yoga (Urdhva Hastasana / Postura de la Montaña con brazos arriba)
 * Objetivo: Estirar la espalda y los brazos manteniendo una postura recta.
 */
export default function EstiramientoYoga() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Estiramiento Yoga';

  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('start'); // 'start', 'holding', 'relax'
  const [feedback, setFeedback] = useState('Levanta los brazos hacia el cielo');
  const [holdTimer, setHoldTimer] = useState(0);

  const [currentAngles, setCurrentAngles] = useState({
    rightShoulder: 0,
    leftShoulder: 0,
    rightElbow: 0,
    leftElbow: 0,
    rightHip: 0,
    leftHip: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs para lógica de control
  const holdStartTimeRef = useRef(null);
  const lastRepTimeRef = useRef(0);

  // Constantes de umbral
  const ARM_UP_ANGLE = 140;      // Ángulo de hombro (más permisivo)
  const ELBOW_STRAIGHT = 140;    // Brazo estirado (más permisivo)
  const BODY_STRAIGHT = 140;     // Cuerpo recto (más permisivo)
  const HOLD_DURATION_MS = 5000; // 5 segundos de estiramiento

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);

    // Extraer ángulos relevantes
    // Nota: calculateBodyAngles devuelve { rightShoulder, rightElbow, rightHip, rightKnee, ... }
    // Asumimos que calculateBodyAngles calcula:
    // Shoulder: Hip-Shoulder-Elbow
    // Elbow: Shoulder-Elbow-Wrist
    // Hip: Shoulder-Hip-Knee

    const {
      rightShoulder, leftShoulder,
      rightElbow, leftElbow,
      rightHip, leftHip
    } = angles;

    setCurrentAngles({
      rightShoulder: Math.round(rightShoulder),
      leftShoulder: Math.round(leftShoulder),
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      rightHip: Math.round(rightHip),
      leftHip: Math.round(leftHip)
    });

    // Validar postura correcta: Brazos arriba y estirados, cuerpo recto
    const isArmsUp = rightShoulder > ARM_UP_ANGLE && leftShoulder > ARM_UP_ANGLE;
    const isArmsStraight = rightElbow > ELBOW_STRAIGHT && leftElbow > ELBOW_STRAIGHT;
    const isBodyStraight = rightHip > BODY_STRAIGHT && leftHip > BODY_STRAIGHT;

    const isPoseCorrect = isArmsUp && isArmsStraight && isBodyStraight;

    const now = Date.now();

    if (stage === 'start' || stage === 'relax') {
      if (isPoseCorrect) {
        // Iniciar hold
        if (!holdStartTimeRef.current) {
          holdStartTimeRef.current = now;
          lastRepTimeRef.current = now; // Usamos esto como "última vez correcto" también
          setStage('holding');
          setFeedback('Mantén la postura...');
          speak('Mantén la postura');
        }
      } else {
        // Feedback guía
        if (!isBodyStraight) setFeedback('Ponte derecho');
        else if (!isArmsUp) setFeedback('Sube más los brazos');
        else if (!isArmsStraight) setFeedback('Estira los codos');
        else setFeedback('Levanta los brazos hacia el cielo');

        holdStartTimeRef.current = null;
      }
    }
    else if (stage === 'holding') {
      if (isPoseCorrect) {
        lastRepTimeRef.current = now; // Actualizar tiempo de última postura correcta

        const elapsed = now - holdStartTimeRef.current;
        const remaining = Math.ceil((HOLD_DURATION_MS - elapsed) / 1000);
        setHoldTimer(remaining);

        if (elapsed >= HOLD_DURATION_MS) {
          // Completado
          setStage('relax');
          setFeedback('¡Bien! Baja los brazos y relaja');
          speak('Descansa');
          setRepCount(c => c + 1);
          holdStartTimeRef.current = null;
          setHoldTimer(0);
        }
      } else {
        // Verificar periodo de gracia (1 segundo)
        const timeSinceLastCorrect = now - lastRepTimeRef.current;

        if (timeSinceLastCorrect > 1000) {
          // Perdió la postura después de la gracia
          setStage('start');
          setFeedback('Postura perdida, intenta de nuevo');
          holdStartTimeRef.current = null;
          setHoldTimer(0);
        } else {
          // En periodo de gracia, mantener feedback pero advertir visualmente si se desea
          // Por ahora mantenemos el estado 'holding'
        }
      }
    }
  };

  const getAngleColor = (angle, target, isMin = true) => {
    const isValid = isMin ? angle > target : angle < target;
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const highlightedAngles = useMemo(() => {
    // Visualizar líneas verdes si la postura es correcta
    const isCorrect =
      currentAngles.rightShoulder > ARM_UP_ANGLE &&
      currentAngles.rightElbow > ELBOW_STRAIGHT;

    return [
      // Brazo derecho
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: isCorrect },
      { indices: [24, 12, 14], angle: currentAngles.rightShoulder, isValid: isCorrect },
      // Brazo izquierdo
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: isCorrect },
      { indices: [23, 11, 13], angle: currentAngles.leftShoulder, isValid: isCorrect }
    ];
  }, [currentAngles]);

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 bg-blue-50 flex items-center justify-center">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-8xl">🧘</div>
              )}
            </div>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-3">Instrucciones</h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-6">
                <li>Ponte de pie con la espalda recta.</li>
                <li>Levanta ambos brazos hacia el techo.</li>
                <li>Mantén los codos estirados y las palmas enfrentadas.</li>
                <li>Sostén la posición durante 5 segundos.</li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md"
              >
                Iniciar Rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-blue-900">{passedNombre}</h2>
          <button onClick={() => setStarted(false)} className="text-blue-600 hover:text-blue-800 font-medium">
            &larr; Volver
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Cámara */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={highlightedAngles} />

              {/* Overlay de Timer */}
              {stage === 'holding' && (
                <div className="absolute top-4 right-4 bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg animate-pulse">
                  {holdTimer}
                </div>
              )}
            </div>

            {/* Panel de Datos en tiempo real */}
            <div className="mt-4 bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Métricas en tiempo real</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Hombros</div>
                  <div className={`text-xl font-bold ${getAngleColor(currentAngles.rightShoulder, ARM_UP_ANGLE)}`}>
                    {currentAngles.rightShoulder}°
                  </div>
                  <div className="text-xs text-gray-400">Meta: &gt;{ARM_UP_ANGLE}°</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Codos</div>
                  <div className={`text-xl font-bold ${getAngleColor(currentAngles.rightElbow, ELBOW_STRAIGHT)}`}>
                    {currentAngles.rightElbow}°
                  </div>
                  <div className="text-xs text-gray-400">Meta: &gt;{ELBOW_STRAIGHT}°</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Cadera</div>
                  <div className={`text-xl font-bold ${getAngleColor(currentAngles.rightHip, BODY_STRAIGHT)}`}>
                    {currentAngles.rightHip}°
                  </div>
                  <div className="text-xs text-gray-400">Meta: &gt;{BODY_STRAIGHT}°</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Estado</div>
                  <div className="text-xl font-bold text-blue-600 capitalize">
                    {stage === 'holding' ? 'Sosteniendo' : 'Preparando'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Info y Feedback */}
          <div className="space-y-4">
            {/* Tarjeta de Repeticiones */}
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-gray-500 font-medium mb-2">Repeticiones Completadas</h3>
              <div className="text-6xl font-extrabold text-blue-600">{repCount}</div>
            </div>

            {/* Tarjeta de Feedback */}
            <div className={`rounded-xl shadow-lg p-6 text-center transition-colors duration-300 ${stage === 'holding' ? 'bg-green-100 border-2 border-green-400' :
              stage === 'relax' ? 'bg-blue-100 border-2 border-blue-400' : 'bg-white'
              }`}>
              <h3 className="text-gray-500 font-medium mb-2">Instrucción IA</h3>
              <div className="text-2xl font-bold text-gray-800">
                {feedback}
              </div>
            </div>

            {/* Guía Visual Rápida */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold text-gray-700 mb-4">Guía de Postura</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${currentAngles.rightShoulder > ARM_UP_ANGLE ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-sm text-gray-600">Brazos arriba</span>
                </div>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${currentAngles.rightElbow > ELBOW_STRAIGHT ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-sm text-gray-600">Codos estirados</span>
                </div>
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-3 ${currentAngles.rightHip > BODY_STRAIGHT ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                  <span className="text-sm text-gray-600">Espalda recta</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
