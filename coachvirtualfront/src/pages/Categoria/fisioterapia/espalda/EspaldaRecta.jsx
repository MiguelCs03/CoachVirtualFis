import { useState, useRef, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { calculateBodyAngles } from '../../../../utils/poseUtils';
import { useSpeech } from '../../../../utils/useSpeech';
import VoiceFeedbackOverlay from '../../../../components/ui/VoiceFeedbackOverlay';
import { speak as voiceSpeak, speakCorrection, speakEncouragement, initVoiceService } from '../../../../services/IA/voiceFeedbackService';

/**
 * Vista de rutina de Espalda Recta (Sentado)
 * Objetivo: Mantener la espalda recta mientras se está sentado (ángulo de cadera ~90°).
 */
export default function EspaldaRecta() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Espalda recta';

  const [repCount, setRepCount] = useState(0);
  const [stage, setStage] = useState('start'); // 'start', 'holding', 'relax'
  const [feedback, setFeedback] = useState('Siéntate derecho');
  const [holdTimer, setHoldTimer] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [corrections, setCorrections] = useState([]);
  const [isCorrect, setIsCorrect] = useState(false);

  const [currentAngles, setCurrentAngles] = useState({
    rightHip: 0,
    leftHip: 0,
    rightKnee: 0,
    leftKnee: 0
  });

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Inicializar servicio de voz
  useEffect(() => {
    if (started) {
      initVoiceService();
      if (voiceEnabled) {
        voiceSpeak('Siéntate con la espalda recta. Mantén la postura por 5 segundos.', 'info', true);
      }
    }
  }, [started, voiceEnabled]);

  // Refs para lógica de control
  const holdStartTimeRef = useRef(null);
  const lastRepTimeRef = useRef(0);

  // Constantes de umbral (Sentado recto)
  // El ángulo de la cadera (Hombro-Cadera-Rodilla) debe estar cerca de 90 grados.
  // Si se encorva hacia adelante, el ángulo baja (<80).
  // Si se recuesta hacia atrás, el ángulo sube (>110).
  const HIP_ANGLE_MIN = 80;
  const HIP_ANGLE_MAX = 110;
  const HOLD_DURATION_MS = 5000; // 5 segundos de mantenimiento

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks);

    const { rightHip, leftHip, rightKnee, leftKnee } = angles;

    setCurrentAngles({
      rightHip: Math.round(rightHip),
      leftHip: Math.round(leftHip),
      rightKnee: Math.round(rightKnee),
      leftKnee: Math.round(leftKnee)
    });

    // Validar postura: Cadera en ángulo recto (aprox)
    const hipAngle = (rightHip + leftHip) / 2;
    const isBackStraight = hipAngle >= HIP_ANGLE_MIN && hipAngle <= HIP_ANGLE_MAX;
    const isPoseCorrect = isBackStraight;

    // Actualizar estado de corrección visual
    setIsCorrect(isPoseCorrect);

    // Generar correcciones específicas
    const newCorrections = [];
    if (hipAngle < HIP_ANGLE_MIN) {
      newCorrections.push({ type: 'backBent', message: 'Enderézate, no te encorves' });
    } else if (hipAngle > HIP_ANGLE_MAX) {
      newCorrections.push({ type: 'backArched', message: 'No te recuestes demasiado' });
    }
    setCorrections(newCorrections);

    const now = Date.now();

    if (stage === 'start' || stage === 'relax') {
      if (isPoseCorrect) {
        if (!holdStartTimeRef.current) {
          holdStartTimeRef.current = now;
          lastRepTimeRef.current = now;
          setStage('holding');
          setFeedback('Mantén la espalda recta...');
          if (voiceEnabled) voiceSpeak('¡Bien! Mantén la postura', 'encouragement', true);
        }
      } else {
        // Feedback específico con voz
        if (hipAngle < HIP_ANGLE_MIN) {
          setFeedback('Enderézate, no te encorves');
          if (voiceEnabled) voiceSpeak('Enderézate, estás encorvado', 'correction');
        } else if (hipAngle > HIP_ANGLE_MAX) {
          setFeedback('No te recuestes tanto');
          if (voiceEnabled) voiceSpeak('No te recuestes, mantén la espalda vertical', 'correction');
        } else {
          setFeedback('Siéntate con la espalda recta');
        }
        holdStartTimeRef.current = null;
      }
    }
    else if (stage === 'holding') {
      if (isPoseCorrect) {
        lastRepTimeRef.current = now;

        const elapsed = now - holdStartTimeRef.current;
        const remaining = Math.ceil((HOLD_DURATION_MS - elapsed) / 1000);
        setHoldTimer(remaining);

        if (elapsed >= HOLD_DURATION_MS) {
          setStage('relax');
          setFeedback('¡Excelente! Relaja un momento');
          if (voiceEnabled) speakEncouragement('completed');
          setRepCount(c => c + 1);
          holdStartTimeRef.current = null;
          setHoldTimer(0);
        }
      } else {
        // Gracia de 1 segundo
        if (now - lastRepTimeRef.current > 1000) {
          setStage('start');
          setFeedback('Postura perdida, inténtalo de nuevo');
          if (voiceEnabled) voiceSpeak('Postura perdida, vuelve a intentarlo', 'correction');
          holdStartTimeRef.current = null;
          setHoldTimer(0);
        }
      }
    }
  };

  const getAngleColor = (angle, min, max) => {
    const isValid = angle >= min && angle <= max;
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const highlightedAngles = useMemo(() => {
    const hipAngle = (currentAngles.rightHip + currentAngles.leftHip) / 2;
    const isCorrect = hipAngle >= HIP_ANGLE_MIN && hipAngle <= HIP_ANGLE_MAX;

    return [
      // Cadera derecha (Hombro-Cadera-Rodilla)
      { indices: [12, 24, 26], angle: currentAngles.rightHip, isValid: isCorrect },
      // Cadera izquierda
      { indices: [11, 23, 25], angle: currentAngles.leftHip, isValid: isCorrect }
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
                <div className="text-8xl">🪑</div>
              )}
            </div>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-3">Instrucciones</h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-6">
                <li>Siéntate en una silla con los pies apoyados en el suelo.</li>
                <li>Mantén la espalda recta y el pecho abierto.</li>
                <li>Evita encorvarte hacia adelante o recostarte demasiado.</li>
                <li>Mantén la postura por 5 segundos.</li>
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

              {/* Overlay de feedback de voz */}
              <VoiceFeedbackOverlay
                corrections={corrections}
                currentInstruction={feedback}
                isCorrect={isCorrect}
                repCount={repCount}
                exerciseName={passedNombre}
                voiceEnabled={voiceEnabled}
                onVoiceToggle={setVoiceEnabled}
              />

              {stage === 'holding' && (
                <div className="absolute top-20 right-4 bg-blue-600 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg animate-pulse z-30">
                  {holdTimer}
                </div>
              )}
            </div>

            <div className="mt-4 bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Métricas en tiempo real</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Ángulo Cadera (Der)</div>
                  <div className={`text-xl font-bold ${getAngleColor(currentAngles.rightHip, HIP_ANGLE_MIN, HIP_ANGLE_MAX)}`}>
                    {currentAngles.rightHip}°
                  </div>
                  <div className="text-xs text-gray-400">Meta: 80° - 110°</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Ángulo Cadera (Izq)</div>
                  <div className={`text-xl font-bold ${getAngleColor(currentAngles.leftHip, HIP_ANGLE_MIN, HIP_ANGLE_MAX)}`}>
                    {currentAngles.leftHip}°
                  </div>
                  <div className="text-xs text-gray-400">Meta: 80° - 110°</div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Feedback */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-gray-500 font-medium mb-2">Repeticiones</h3>
              <div className="text-6xl font-extrabold text-blue-600">{repCount}</div>
            </div>

            <div className={`rounded-xl shadow-lg p-6 text-center transition-colors duration-300 ${stage === 'holding' ? 'bg-green-100 border-2 border-green-400' :
              stage === 'relax' ? 'bg-blue-100 border-2 border-blue-400' : 'bg-white'
              }`}>
              <h3 className="text-gray-500 font-medium mb-2">Instrucción IA</h3>
              <div className="text-2xl font-bold text-gray-800">
                {feedback}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
