import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { useSpeech } from '../../../../utils/useSpeech';

export default function InclinacionLateralTronco() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Inclinación lateral de tronco';

  // --- ESTADOS DEL EJERCICIO ---
  const [repsLeft, setRepsLeft] = useState(0);
  const [repsRight, setRepsRight] = useState(0);
  const [currentSide, setCurrentSide] = useState('center'); // 'center', 'left', 'right'
  const [feedback, setFeedback] = useState('Levanta los brazos y mantente recto');
  const [angle, setAngle] = useState(0);
  const [armsUp, setArmsUp] = useState(false);

  // Refs para lógica de repeticiones (evitar rebotes)
  const stateRef = useRef('neutral'); // 'neutral', 'flexed', 'returning'
  const peakAngleRef = useRef(0);
  const { speak } = useSpeech({ lang: 'es-ES' });

  // --- CONSTANTES BIOMECÁNICAS ---
  const REP_THRESHOLD = 25; // Grados mínimos para contar rep
  const RESET_THRESHOLD = 10; // Grados para considerar que volvió al centro
  const ARM_CHECK_Y_OFFSET = 0.1; // Tolerancia para altura de muñecas vs hombros

  // 1. Calcular ángulo de la columna (Vector Hombros -> Caderas)
  const calculateSpineAngle = (landmarks) => {
    const midShoulderX = (landmarks[11].x + landmarks[12].x) / 2;
    const midShoulderY = (landmarks[11].y + landmarks[12].y) / 2;
    const midHipX = (landmarks[23].x + landmarks[24].x) / 2;
    const midHipY = (landmarks[23].y + landmarks[24].y) / 2;

    const deltaX = midShoulderX - midHipX;
    const deltaY = midHipY - midShoulderY;

    // Math.atan2(deltaX, deltaY) nos da el ángulo respecto a la vertical
    // Invertimos Y porque en canvas crece hacia abajo
    const radians = Math.atan2(deltaX, -deltaY);
    let degrees = radians * (180 / Math.PI);

    // Ajuste para que 0 sea vertical, -X izquierda, +X derecha
    // Nota: Dependiendo de la cámara (espejo), signos pueden variar.
    // Asumimos: Negativo = Izquierda usuario (Derecha pantalla), Positivo = Derecha usuario.
    return Math.round(degrees);
  };

  // 2. Verificar si los brazos están arriba (Muñecas por encima de hombros)
  const checkArmsUp = (landmarks) => {
    // En MediaPipe Y es menor cuanto más arriba está
    const shouldersY = (landmarks[11].y + landmarks[12].y) / 2;
    const wristsY = (landmarks[15].y + landmarks[16].y) / 2;
    return wristsY < shouldersY; // True si muñecas están más altas que hombros
  };

  const handlePoseDetected = (landmarks) => {
    const currentAngle = calculateSpineAngle(landmarks);
    const areArmsUp = checkArmsUp(landmarks);

    setAngle(currentAngle);
    setArmsUp(areArmsUp);

    // Validación estricta: Si baja los brazos, pausar lógica o avisar
    if (!areArmsUp) {
      setFeedback('⚠️ ¡Levanta los brazos para activar el core!');
      stateRef.current = 'neutral'; // Resetear ciclo si rompe postura
      return;
    }

    const absAngle = Math.abs(currentAngle);

    // --- MÁQUINA DE ESTADOS PARA CONTEO ---

    // FASE 1: NEUTRAL -> INICIANDO MOVIMIENTO
    if (stateRef.current === 'neutral') {
      if (absAngle > 15) {
        const side = currentAngle < 0 ? 'left' : 'right';
        setCurrentSide(side);
        stateRef.current = 'flexed';
        setFeedback(side === 'left' ? 'Inclinando a Izquierda...' : 'Inclinando a Derecha...');
      } else {
        setFeedback('Listo. Inclínate lateralmente.');
        setCurrentSide('center');
      }
    }

    // FASE 2: EN FLEXIÓN (Buscando el pico)
    if (stateRef.current === 'flexed') {
      // Actualizar pico máximo alcanzado en esta rep
      if (absAngle > Math.abs(peakAngleRef.current)) {
        peakAngleRef.current = currentAngle;
      }

      // Si empieza a regresar (el ángulo disminuye significativamente desde el pico)
      // O simplemente si pasa el umbral de retorno
      if (absAngle < RESET_THRESHOLD) {
        // Chequear si la repetición fue válida (llegó al threshold)
        if (Math.abs(peakAngleRef.current) > REP_THRESHOLD) {
          completeRep();
        } else {
          setFeedback('Inclinación insuficiente. Baja más la próxima.');
          stateRef.current = 'neutral';
        }
        peakAngleRef.current = 0;
      }
    }
  };

  const completeRep = () => {
    if (currentSide === 'left') {
      setRepsLeft(prev => prev + 1);
      speak('Izquierda, bien');
    } else {
      setRepsRight(prev => prev + 1);
      speak('Derecha, bien');
    }
    setFeedback('✅ ¡Repetición correcta! Vuelve al centro.');
    stateRef.current = 'neutral';
  };

  // Visualización del ángulo (Gauge)
  const needleRotation = useMemo(() => {
    // Limitar visualmente a -90 / 90
    return Math.max(-90, Math.min(90, angle));
  }, [angle]);

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="h-64 bg-gray-100 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-contain" />
              ) : (
                <span className="text-6xl">🙆</span>
              )}
              <div className="absolute bottom-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                Nivel: Intermedio (Brazos arriba)
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h3 className="font-semibold text-lg">Técnica Correcta:</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li><strong>Brazos arriba:</strong> Aumenta la intensidad en los oblicuos.</li>
                <li><strong>Cadera fija:</strong> No desplaces la cadera, solo mueve el tronco.</li>
                <li><strong>Imagina dos paredes:</strong> Muévete solo lateralmente, no hacia adelante.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-bold transition-all">
                Comenzar Entrenamiento
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 lg:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header Info */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-indigo-900">{passedNombre}</h2>
            <div className="flex gap-4 mt-1 text-sm text-gray-600">
              <span className={`font-bold ${armsUp ? 'text-green-600' : 'text-red-500'}`}>
                {armsUp ? '🙌 Brazos: Correctos' : '⚠️ Brazos: Súbelos'}
              </span>
              <span>Ángulo actual: {angle}°</span>
            </div>
          </div>
          <button onClick={() => setStarted(false)} className="text-indigo-600 font-medium hover:underline">Salir</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Cámara y Visión */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-video">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Overlay: Guía de Columna */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/30 backdrop-blur px-4 py-2 rounded-full text-white font-mono">
                {Math.abs(angle)}°
              </div>

              {/* Overlay: Feedback visual en pantalla */}
              {!armsUp && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10">
                  <div className="text-white text-2xl font-bold animate-bounce">⬆️ ¡Sube los brazos! ⬆️</div>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Métricas y Feedback */}
          <div className="space-y-6">

            {/* Gauge Visual (Transportador) */}
            <div className="bg-white rounded-2xl p-6 shadow-lg flex flex-col items-center">
              <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-4">Inclinación en tiempo real</h3>
              <div className="relative w-48 h-24 overflow-hidden">
                {/* Semicirculo fondo */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-8 border-gray-100 box-border"></div>
                {/* Zonas objetivo */}
                <div className="absolute top-0 left-0 w-48 h-48 rounded-full border-8 border-transparent border-l-green-200 border-r-green-200 opacity-50 transform rotate-45"></div>

                {/* Aguja */}
                <div
                  className="absolute bottom-0 left-1/2 w-1 h-24 bg-indigo-600 origin-bottom transition-transform duration-200 ease-out rounded-full"
                  style={{ transform: `translateX(-50%) rotate(${needleRotation}deg)` }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-600 rounded-full"></div>
                </div>
                {/* Centro */}
                <div className="absolute bottom-0 left-1/2 w-4 h-4 bg-gray-800 rounded-full -translate-x-1/2 translate-y-1/2"></div>
              </div>
              <div className="flex justify-between w-full px-4 mt-2 text-xs text-gray-400 font-mono">
                <span>IZQ</span>
                <span>0°</span>
                <span>DER</span>
              </div>
            </div>

            {/* Contadores */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`bg-white p-5 rounded-2xl shadow-lg border-b-4 ${currentSide === 'left' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                <span className="block text-3xl font-bold text-gray-800">{repsLeft}</span>
                <span className="text-xs text-gray-500 uppercase">Izquierda</span>
              </div>
              <div className={`bg-white p-5 rounded-2xl shadow-lg border-b-4 ${currentSide === 'right' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'}`}>
                <span className="block text-3xl font-bold text-gray-800">{repsRight}</span>
                <span className="text-xs text-gray-500 uppercase">Derecha</span>
              </div>
            </div>

            {/* Mensaje de Feedback */}
            <div className={`p-4 rounded-xl text-center font-medium transition-colors ${feedback.includes('correcta') ? 'bg-green-100 text-green-700' :
                feedback.includes('⚠️') ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
              }`}>
              {feedback}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}