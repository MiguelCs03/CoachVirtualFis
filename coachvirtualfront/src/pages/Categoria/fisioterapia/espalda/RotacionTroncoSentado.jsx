import { useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';
import { useSpeech } from '../../../../utils/useSpeech';

export default function RotacionTroncoSentado() {
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Rotación de tronco sentado';

  // Estados de lógica
  const [reps, setReps] = useState(0);
  const [direction, setDirection] = useState('center'); // 'center', 'left', 'right'
  const [rotationIntensity, setRotationIntensity] = useState(0); // -100 (Izq) a 100 (Der)
  const [feedback, setFeedback] = useState('Siéntate y extiende los brazos');
  const [hipStability, setHipStability] = useState(true); // ¿Están las caderas quietas?

  const { speak } = useSpeech({ lang: 'es-ES' });

  // Refs para evitar rebotes en el conteo
  const holdingRef = useRef(false);
  const holdStartTimeRef = useRef(0);

  // --- CONSTANTES ---
  const ROTATION_THRESHOLD = 40; // Intensidad necesaria para contar rep
  const HOLD_TIME_MS = 1000;     // Tiempo de isometría al final del giro
  const HIP_TOLERANCE = 0.05;    // Cuánto permitimos que se muevan las caderas en Z

  // Normalizar valores para que funcionen cerca o lejos de la cámara
  const getDepthScore = (leftPoint, rightPoint) => {
    // MediaPipe Z: Negativo = Cerca de cámara, Positivo = Lejos
    // Si giro a la IZQUIERDA: Hombro Der se acerca (Z disminuye), Hombro Izq se aleja (Z aumenta).
    // diff = (Izq.z - Der.z)
    // Positivo = Giro Izquierda
    // Negativo = Giro Derecha
    return (leftPoint.z - rightPoint.z) * 1000; // Multiplicador arbitrario para escala
  };

  const handlePoseDetected = (landmarks) => {
    // Landmarks: 11/12 (Hombros), 23/24 (Caderas)
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    // 1. Calcular Rotación de Hombros (Torácica)
    const shoulderRotation = getDepthScore(leftShoulder, rightShoulder);

    // 2. Calcular Rotación de Caderas (Trampa)
    const hipRotation = getDepthScore(leftHip, rightHip);

    // La rotación REAL es cuánto giran los hombros MENOS cuánto giran las caderas
    // Esto obliga al usuario a disociar.
    const netRotation = shoulderRotation - hipRotation;

    // Mapear a escala visual -100 a 100
    // Ajustamos sensibilidad con divisor
    const visualValue = Math.min(100, Math.max(-100, netRotation * 5));
    setRotationIntensity(visualValue);

    // 3. Detectar estabilidad de cadera
    const isHipStable = Math.abs(hipRotation) < (Math.abs(shoulderRotation) * 0.5) + 20; // Tolerancia dinámica
    setHipStability(isHipStable);

    if (!isHipStable && Math.abs(visualValue) > 20) {
      setFeedback('⚠️ ¡Mantén las caderas fijas!');
      return;
    }

    // --- MÁQUINA DE ESTADOS ---
    const absRot = Math.abs(visualValue);
    const currentDir = visualValue > 0 ? 'left' : 'right';

    if (absRot < 15) {
      // Zona Neutral
      if (direction !== 'center') {
        setDirection('center');
        setFeedback('Centro. Crece hacia arriba y gira.');
        holdingRef.current = false;
      }
    } else if (absRot > ROTATION_THRESHOLD) {
      // Zona de Giro Efectivo
      if (!holdingRef.current) {
        holdingRef.current = true;
        holdStartTimeRef.current = Date.now();
        setFeedback(`Mantén el giro a la ${currentDir === 'left' ? 'izquierda' : 'derecha'}...`);
      } else {
        // Contar tiempo
        const elapsed = Date.now() - holdStartTimeRef.current;
        if (elapsed > HOLD_TIME_MS && direction === 'center') {
          // ¡Repetición completada!
          setReps(r => r + 1);
          speak(currentDir === 'left' ? 'Izquierda' : 'Derecha');
          setFeedback('✅ ¡Bien! Regresa suavemente.');
          setDirection('returning'); // Bloqueo temporal hasta que vuelva al centro
        }
      }
    }
  };

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="h-64 bg-gray-100 flex items-center justify-center">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-contain" />
              ) : (
                <span className="text-6xl">🔄</span>
              )}
            </div>
            <div className="p-6 space-y-4">
              <h3 className="font-bold text-lg">Puntos Clave Biomecánicos:</h3>
              <ul className="list-disc pl-5 text-gray-600 space-y-2">
                <li><strong>Caderas de cemento:</strong> Imagina que tus caderas están pegadas al suelo. No deben moverse.</li>
                <li><strong>Giro desde el pecho:</strong> La rotación debe ocurrir en las costillas, no en la espalda baja.</li>
                <li><strong>Brazos en cruz:</strong> Ayudan a generar inercia y mantener la postura.</li>
              </ul>
              <button onClick={() => setStarted(true)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                Iniciar Calibración
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{passedNombre}</h2>
            <p className="text-sm text-gray-500">Detectando rotación profunda (Z-Axis)</p>
          </div>
          <button onClick={() => setStarted(false)} className="text-red-500 hover:underline">Terminar</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Visión */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-2xl overflow-hidden shadow-xl aspect-video border-4 border-white">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Visualización de "Vista de Pájaro" (Top-down view simulator) */}
              <div className="absolute bottom-4 right-4 w-32 h-32 bg-white/90 rounded-full shadow-lg border-2 border-gray-200 flex items-center justify-center">
                {/* Cabeza */}
                <div className="absolute w-4 h-4 bg-gray-800 rounded-full z-10"></div>
                {/* Hombros (Línea que gira) */}
                <div
                  className="absolute w-24 h-2 bg-blue-600 rounded transition-transform duration-200"
                  style={{ transform: `rotate(${rotationIntensity * 0.9}deg)` }} // Escalado visual
                ></div>
                {/* Caderas (Línea fija o que muestra error) */}
                <div className="absolute w-16 h-8 border-2 border-gray-400 rounded opacity-50"></div>
                <span className="absolute -bottom-6 text-xs font-bold bg-white px-1 rounded">Vista Superior</span>
              </div>

              {!hipStability && (
                <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 backdrop-blur-sm">
                  <div className="bg-white text-red-600 px-6 py-3 rounded-full font-bold shadow-xl animate-bounce">
                    🛑 ¡Fija las caderas!
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel de Control */}
          <div className="space-y-6">

            {/* Indicador de Rotación (Barra Horizontal) */}
            <div className="bg-white p-6 rounded-2xl shadow-lg">
              <h3 className="text-gray-500 text-xs uppercase tracking-wider mb-4 text-center">Rango de Movimiento</h3>
              <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                {/* Centro */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-400"></div>

                {/* Barra de progreso dinámica */}
                <div
                  className={`absolute top-0 bottom-0 transition-all duration-200 ${rotationIntensity > 0 ? 'left-1/2 bg-blue-500' : 'right-1/2 bg-indigo-500'}`}
                  style={{ width: `${Math.abs(rotationIntensity)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs mt-2 font-mono text-gray-400">
                <span>DERECHA</span>
                <span>CENTRO</span>
                <span>IZQUIERDA</span>
              </div>
            </div>

            {/* Contador */}
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center">
              <span className="text-6xl font-black text-gray-800">{reps}</span>
              <p className="text-gray-500 uppercase text-sm mt-2 tracking-wide">Giros Completos</p>
            </div>

            {/* Feedback Box */}
            <div className={`p-4 rounded-xl font-medium text-center transition-colors duration-300 ${feedback.includes('✅') ? 'bg-green-100 text-green-800' :
                feedback.includes('⚠️') ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'
              }`}>
              {feedback}
            </div>

            {/* Tip Terapéutico */}
            <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-sm text-yellow-800">
              💡 <strong>Tip Pro:</strong> Exhala el aire mientras giras. La falta de aire en los pulmones permite que la caja torácica rote unos grados extra.
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}