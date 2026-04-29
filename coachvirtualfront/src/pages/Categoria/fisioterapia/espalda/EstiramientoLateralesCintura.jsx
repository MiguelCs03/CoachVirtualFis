import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * Lógica Biomecánica:
 * 1. Calculamos el "Eje de la Columna": Línea entre el punto medio de las caderas y el punto medio de los hombros.
 * 2. Medimos la desviación de ese eje respecto a la vertical absoluta (90°).
 * 3. Fases: Centro -> Inclinación (Dcha/Izq) -> Hold (Estiramiento) -> Retorno.
 */
export default function EstiramientoLateralesCintura() {
  const [started, setStarted] = useState(false)
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || 'Estiramiento laterales de cintura'

  // Estados de lógica
  const [count, setCount] = useState(0) // Total de estiramientos completados
  const [feedback, setFeedback] = useState('Ponte en posición neutral')
  const [direction, setDirection] = useState('center') // 'center', 'right', 'left'
  const [spineTilt, setSpineTilt] = useState(0) // Grados de inclinación (0 = recto)

  // Refs para control de flujo
  const holdTimerRef = useRef(null)
  const lastSpokenRef = useRef(0) // Para evitar spam de voz
  const { speak } = useSpeech({ lang: 'es-ES' })

  // --- CONSTANTES FISIOTERAPÉUTICAS ---
  const MIN_TILT = 15 // Grados mínimos para considerar que empezó el estiramiento
  const GOOD_TILT = 25 // Grados para un estiramiento efectivo
  const MAX_TILT = 45 // Límite de seguridad (evitar hernias/compresión excesiva)
  const HOLD_TIME = 2000 // ms que se debe mantener el estiramiento (es un ejercicio de movilidad)

  // Cálculo matemático de la inclinación del tronco
  const calculateSpineAngle = (landmarks) => {
    if (!landmarks) return 0

    // Índices MediaPipe: 11/12 (Hombros), 23/24 (Caderas)
    const leftShoulder = landmarks[11]
    const rightShoulder = landmarks[12]
    const leftHip = landmarks[23]
    const rightHip = landmarks[24]

    // Puntos medios
    const midShoulderX = (leftShoulder.x + rightShoulder.x) / 2
    const midShoulderY = (leftShoulder.y + rightShoulder.y) / 2
    const midHipX = (leftHip.x + rightHip.x) / 2
    const midHipY = (leftHip.y + rightHip.y) / 2

    // Calcular ángulo en grados respecto a la vertical
    // Math.atan2 devuelve radianes. Convertimos a grados.
    // Delta Y es negativo porque en visión por computador Y crece hacia abajo.
    const deltaX = midShoulderX - midHipX
    const deltaY = midHipY - midShoulderY // Invertido para que sea cartesiano estándar

    let angleRad = Math.atan2(deltaX, deltaY)
    let angleDeg = angleRad * (180 / Math.PI)

    // angleDeg será aprox 0 cuando está recto.
    // Positivo = Inclinación Derecha (según vista cámara espejo)
    // Negativo = Inclinación Izquierda
    return Math.round(angleDeg)
  }

  const handlePoseDetected = (landmarks) => {
    const tilt = calculateSpineAngle(landmarks)
    setSpineTilt(tilt)
    const absTilt = Math.abs(tilt)

    // Detección de dirección actual
    let currentDir = 'center'
    if (tilt > MIN_TILT) currentDir = 'right'
    if (tilt < -MIN_TILT) currentDir = 'left'

    // Máquina de Estados
    if (direction === 'center') {
      if (absTilt > MIN_TILT) {
        setDirection(currentDir)
        const side = currentDir === 'right' ? 'derecha' : 'izquierda'
        setFeedback(`Estirando a la ${side}... mantén`)
        speak(`Mantén a la ${side}`)

        // Iniciar timer de "Hold"
        holdTimerRef.current = Date.now()
      } else {
        setFeedback('Posición neutral. Inclínate a un lado.')
      }
    } else if (direction === 'right' || direction === 'left') {
      // Verificar si mantiene el estiramiento
      const isGoodStretch =
        (direction === 'right' && tilt > GOOD_TILT) || (direction === 'left' && tilt < -GOOD_TILT)

      // Verificar si regresó al centro
      if (absTilt < 10) {
        // Si rompió la postura antes de tiempo
        setDirection('center')
        setFeedback('Regresaste al centro')
        holdTimerRef.current = null
        return
      }

      if (isGoodStretch) {
        // Calcular tiempo sostenido
        const elapsed = Date.now() - (holdTimerRef.current || Date.now())

        if (elapsed > HOLD_TIME) {
          // ¡Éxito!
          speak('¡Bien! Regresa al centro')
          setFeedback('✅ ¡Excelente! Regresa suavemente')
          setCount((c) => c + 1)
          setDirection('waiting_reset') // Estado temporal para obligar a volver al centro
          holdTimerRef.current = null
        } else {
          // Feedback de progreso visual
          const progress = Math.min(100, (elapsed / HOLD_TIME) * 100)
          setFeedback(`Sostén... ${Math.round(progress)}%`)
        }
      } else {
        // Está inclinado pero no lo suficiente
        setFeedback('Inclínate un poco más para estirar bien')
      }
    } else if (direction === 'waiting_reset') {
      if (absTilt < 8) {
        setDirection('center')
        setFeedback('Listo para el siguiente')
      }
    }
  }

  const getProgressColor = () => {
    if (direction === 'center') return 'bg-gray-200'
    if (direction === 'waiting_reset') return 'bg-green-500'
    const absTilt = Math.abs(spineTilt)
    if (absTilt > GOOD_TILT) return 'bg-blue-600' // Rango óptimo
    if (absTilt > MAX_TILT) return 'bg-red-500' // Peligroso
    return 'bg-yellow-400' // Iniciando
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 bg-gray-100 flex items-center justify-center">
              {passedImage ? (
                <img
                  src={passedImage}
                  alt={passedNombre}
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <div className="text-6xl">🧘</div>
              )}
            </div>
            <div className="p-8">
              <h3 className="text-xl font-semibold mb-2">Beneficios Terapéuticos</h3>
              <ul className="list-disc pl-5 text-gray-600 mb-6 space-y-1">
                <li>Descomprime las vértebras lumbares.</li>
                <li>Estira el músculo cuadrado lumbar y dorsal ancho.</li>
                <li>Mejora la movilidad de la caja torácica.</li>
              </ul>
              <p className="text-sm text-gray-500 mb-6 bg-blue-50 p-3 rounded border-l-4 border-blue-500">
                ℹ️ <strong>Instrucción:</strong> Mantén las caderas quietas y solo mueve el tronco
                hacia los lados. La IA detectará la inclinación de tu columna.
              </p>
              <button
                onClick={() => setStarted(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-all shadow-md"
              >
                Iniciar Sesión de Movilidad
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{passedNombre}</h2>
            <p className="text-gray-500 text-sm">Fisioterapia asistida por IA</p>
          </div>
          <button
            onClick={() => setStarted(false)}
            className="text-red-500 hover:bg-red-50 px-4 py-2 rounded font-medium transition-colors"
          >
            Finalizar
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Panel de Cámara */}
          <div className="lg:col-span-2">
            <div className="relative bg-black rounded-2xl shadow-2xl overflow-hidden aspect-video border-4 border-white">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Overlay de Guía Visual */}
              <div className="absolute top-4 right-4 bg-black/50 backdrop-blur text-white px-4 py-2 rounded-full">
                Ángulo: <span className="font-mono font-bold text-xl">{spineTilt}°</span>
              </div>

              {/* Línea central guía (Visual Aid) */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white/30 border-dashed border-l"></div>
            </div>
          </div>

          {/* Panel de Control y Métricas */}
          <div className="space-y-6">
            {/* Feedback Principal */}
            <div
              className={`rounded-2xl p-6 shadow-lg text-center transition-colors duration-300 ${
                direction === 'waiting_reset'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-white text-gray-800'
              }`}
            >
              <div className="text-5xl mb-2">
                {direction === 'center' && '🧍'}
                {direction === 'right' && '➡️'}
                {direction === 'left' && '⬅️'}
                {direction === 'waiting_reset' && '✅'}
              </div>
              <h3 className="text-xl font-bold mb-1">{feedback}</h3>
              {direction !== 'center' && direction !== 'waiting_reset' && (
                <p className="text-sm opacity-75 animate-pulse">Mantén la posición...</p>
              )}
            </div>

            {/* Métricas */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-4">
                Progreso de la Sesión
              </h4>

              <div className="flex justify-between items-end mb-2">
                <span className="text-4xl font-bold text-blue-600">{count}</span>
                <span className="text-gray-400 font-medium mb-1">Estiramientos</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(count * 10, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Guía de Ángulos */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h4 className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-4">
                Calidad del Rango
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Neutral (0-10°)</span>
                  <div
                    className={`w-3 h-3 rounded-full ${Math.abs(spineTilt) < 10 ? 'bg-green-500 ring-2 ring-green-200' : 'bg-gray-200'}`}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estiramiento (15-40°)</span>
                  <div
                    className={`w-3 h-3 rounded-full ${Math.abs(spineTilt) >= 15 && Math.abs(spineTilt) <= 40 ? 'bg-blue-500 ring-2 ring-blue-200' : 'bg-gray-200'}`}
                  ></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Excesivo (45°)</span>
                  <div
                    className={`w-3 h-3 rounded-full ${Math.abs(spineTilt) > 45 ? 'bg-red-500 ring-2 ring-red-200' : 'bg-gray-200'}`}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
