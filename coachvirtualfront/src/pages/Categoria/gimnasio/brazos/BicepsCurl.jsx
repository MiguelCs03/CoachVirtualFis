import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * Vista de rutina de Curl de Bíceps dentro de la jerarquía:
 * /categoria/gimnasio/brazos/biceps-curl
 * Muestra primero una tarjeta descriptiva y al pulsar "Iniciar rutina" despliega
 * el detector de pose y la lógica IA para contar repeticiones y dar feedback.
 */
export default function BicepsCurl() {
  const [started, setStarted] = useState(false)
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || null
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('down')
  const [feedback, setFeedback] = useState('Comienza el ejercicio')
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    rightShoulder: 180,
    leftShoulder: 180,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })
  const errorFlagRef = useRef(false)
  const lastRepTimeRef = useRef(0)
  // Historial para suavizado (moving average)
  const elbowHistoryRef = useRef([])
  const shoulderHistoryRef = useRef([])
  // Control de "holds" para validar pico y extensión correctamente
  const holdStartRef = useRef(null)
  const holdTypeRef = useRef(null) // 'flexion' | 'extension' | null

  // Thresholds base (se usan con histeresis)
  const FLEX_ENTER = 65 // entrar en fase de subida cuando baja de este
  const FLEX_CONFIRM = 55 // confirmar flexión correcta sostenida
  const EXT_ENTER = 155 // entrar en fase de bajada cuando supera esto
  const EXT_CONFIRM = 165 // confirmar extensión completa sostenida
  // Aliases para compatibilidad con referencias de UI anteriores
  const FLEXED_THRESHOLD = FLEX_CONFIRM
  const EXTENDED_THRESHOLD = EXT_CONFIRM
  const SHOULDER_ERROR_THRESHOLD = 40 // más estricto
  const HOLD_MS = 350 // tiempo mínimo para validar pico / extensión
  const MIN_INTERVAL_MS = 1200 // tiempo mínimo entre reps
  const SMOOTH_WINDOW = 6 // frames para moving average

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)
    const { rightElbow, rightShoulder, leftElbow, leftShoulder } = angles

    // Actualizar historia para suavizado
    elbowHistoryRef.current.push(rightElbow)
    shoulderHistoryRef.current.push(rightShoulder)
    if (elbowHistoryRef.current.length > SMOOTH_WINDOW) elbowHistoryRef.current.shift()
    if (shoulderHistoryRef.current.length > SMOOTH_WINDOW) shoulderHistoryRef.current.shift()

    const avg = (arr) => arr.reduce((a, b) => a + b, 0) / (arr.length || 1)
    const smoothElbow = avg(elbowHistoryRef.current)
    const smoothShoulder = avg(shoulderHistoryRef.current)

    setCurrentAngles({
      rightElbow: Math.round(smoothElbow),
      leftElbow: Math.round(leftElbow),
      rightShoulder: Math.round(smoothShoulder),
      leftShoulder: Math.round(leftShoulder),
    })

    const elbowAngle = smoothElbow
    const shoulderAngle = smoothShoulder

    // Validar hombro: si se mueve demasiado durante la subida o bajada cancelar hold
    if (shoulderAngle > SHOULDER_ERROR_THRESHOLD) {
      if (!errorFlagRef.current) {
        setFeedback('⚠️ ¡No muevas el hombro!')
        speak('¡No muevas el hombro, mantén el codo fijo!')
      }
      errorFlagRef.current = true
      // Romper cualquier hold en progreso
      holdStartRef.current = null
      holdTypeRef.current = null
      return // no seguimos lógica de rep si hombro se mueve
    }

    // Si hombro se mantuvo estable, podemos limpiar la bandera de error para siguiente rep
    if (errorFlagRef.current && shoulderAngle <= SHOULDER_ERROR_THRESHOLD) {
      errorFlagRef.current = false
    }

    // Lógica con histeresis y holds
    if (stage === 'down' || stage === 'ext_hold') {
      // Detectar inicio de flexión
      if (elbowAngle < FLEX_ENTER) {
        setStage('up_moving')
        setFeedback('Subiendo... Mantén control')
        holdStartRef.current = null
        holdTypeRef.current = null
      }
    } else if (stage === 'up_moving') {
      // Verificar flexión completa sostenida
      if (elbowAngle < FLEX_CONFIRM) {
        if (!holdStartRef.current) {
          holdStartRef.current = Date.now()
          holdTypeRef.current = 'flexion'
        } else if (Date.now() - holdStartRef.current >= HOLD_MS) {
          setStage('flex_hold')
          setFeedback('✅ Flexión correcta')
          holdStartRef.current = null
          holdTypeRef.current = null
        }
      } else {
        // Si se aleja del confirm antes de sostener, reset a down
        if (elbowAngle > EXT_ENTER + 5) {
          setStage('down')
          setFeedback('Reinicia la subida con control')
        }
      }
    } else if (stage === 'flex_hold') {
      // Iniciar descenso
      if (elbowAngle > EXT_ENTER) {
        setStage('down_moving')
        setFeedback('Bajando... Extiende completamente')
      }
    } else if (stage === 'down_moving') {
      // Confirmar extensión completa sostenida -> contar rep
      if (elbowAngle > EXT_CONFIRM) {
        if (!holdStartRef.current) {
          holdStartRef.current = Date.now()
          holdTypeRef.current = 'extension'
        } else if (Date.now() - holdStartRef.current >= HOLD_MS) {
          const now = Date.now()
          if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
            const newCount = repCount + 1
            setRepCount(newCount)
            setFeedback(`💪 Repetición ${newCount} completa`)
            speak(newCount.toString())
            lastRepTimeRef.current = now
          } else {
            setFeedback('Movimiento demasiado rápido, controla el ritmo')
          }
          setStage('down')
          holdStartRef.current = null
          holdTypeRef.current = null
        }
      } else if (elbowAngle < FLEX_ENTER - 5) {
        // Se regresó antes de llegar a extensión completa -> volver a subida
        setStage('up_moving')
        setFeedback('Subida nuevamente, aún no extendiste bien')
        holdStartRef.current = null
        holdTypeRef.current = null
      }
    }
  }

  const getAngleColor = (angle, isElbow = false) => {
    if (isElbow) {
      if (stage === 'flex_hold') return 'text-green-600'
      if (stage === 'down_moving' || stage === 'up_moving') return 'text-yellow-500'
      if (stage === 'down' && angle > EXT_CONFIRM) return 'text-green-600'
      return 'text-blue-500'
    }
    return angle < SHOULDER_ERROR_THRESHOLD ? 'text-green-500' : 'text-red-600'
  }

  const highlightedAngles = useMemo(() => {
    const rightElbowValid = stage === 'flex_hold' || stage === 'down'
    const rightShoulderValid = currentAngles.rightShoulder < SHOULDER_ERROR_THRESHOLD
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: rightElbowValid },
      { indices: [24, 12, 14], angle: currentAngles.rightShoulder, isValid: rightShoulderValid },
    ]
  }, [currentAngles, stage])

  const resetCounter = () => {
    setRepCount(0)
    setStage('down')
    setFeedback('Contador reiniciado')
    elbowHistoryRef.current = []
    shoulderHistoryRef.current = []
    holdStartRef.current = null
    holdTypeRef.current = null
    errorFlagRef.current = false
  }

  // Vista previa antes de iniciar
  if (!started) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Curl de Bíceps</h1>
          <p className="text-gray-600 mb-8 text-lg">
            Rutina asistida por IA para contar tus repeticiones y detectar errores de postura
            (hombro en movimiento).
          </p>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-56 flex items-center justify-center overflow-hidden bg-gray-100">
              {passedImage ? (
                <img
                  src={passedImage}
                  alt={passedNombre || 'Curl de bíceps'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <span className="text-6xl">💪</span>
                </div>
              )}
            </div>
            <div className="p-6 space-y-4">
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Mantén el hombro estable (&lt;45°)</li>
                <li>Sube hasta flexionar el codo (&lt;60°)</li>
                <li>Baja extendiendo el brazo (&gt;160°)</li>
                <li>La voz te da feedback y cuenta reps</li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Iniciar rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Rutina en progreso
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-indigo-900">🏋️ Curl de Bíceps (Rutina)</h1>
          <button
            onClick={() => setStarted(false)}
            className="text-sm text-indigo-600 hover:text-indigo-800 underline"
          >
            Volver a descripción
          </button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-xl overflow-hidden">
              <YogaPoseDetector
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />
            </div>
            <div className="bg-white rounded-lg shadow-xl p-4 mt-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700">Ángulos Detectados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className={`p-3 rounded bg-gray-50 ${getAngleColor(currentAngles.rightElbow, true)}`}>
                  <span className="text-xs text-gray-500">Codo Der</span>
                  <div className="text-2xl font-bold">{currentAngles.rightElbow}°</div>
                </div>
                <div className={`p-3 rounded bg-gray-50 ${getAngleColor(currentAngles.leftElbow, true)}`}>
                  <span className="text-xs text-gray-500">Codo Izq</span>
                  <div className="text-2xl font-bold">{currentAngles.leftElbow}°</div>
                </div>
                <div className={`p-3 rounded bg-gray-50 ${getAngleColor(currentAngles.rightShoulder, false)}`}>
                  <span className="text-xs text-gray-500">Hombro Der</span>
                  <div className="text-2xl font-bold">{currentAngles.rightShoulder}°</div>
                </div>
                <div className={`p-3 rounded bg-gray-50 ${getAngleColor(currentAngles.leftShoulder, false)}`}>
                  <span className="text-xs text-gray-500">Hombro Izq</span>
                  <div className="text-2xl font-bold">{currentAngles.leftShoulder}°</div>
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-xl p-8 text-center">
              <h2 className="text-gray-400 font-bold text-xs uppercase tracking-wider mb-2">
                Repeticiones
              </h2>
              <div className="text-8xl font-black text-indigo-600">{repCount}</div>
              <button
                onClick={resetCounter}
                className="text-indigo-500 hover:text-indigo-700 text-sm underline mt-4"
              >
                Reiniciar contador
              </button>
            </div>

            <div
              className={`rounded-lg shadow-xl p-6 border-l-4 transition-all
                ${
                  feedback.includes('⚠️')
                    ? 'bg-yellow-50 border-yellow-400 text-yellow-800'
                    : feedback.includes('✅') || feedback.includes('completa')
                      ? 'bg-green-50 border-green-500 text-green-800'
                      : 'bg-white border-indigo-500 text-gray-700'
                }`}
            >
              <h3 className="font-bold mb-1">Feedback IA:</h3>
              <p className="text-lg">{feedback}</p>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-6">
              <h3 className="font-semibold text-gray-700 mb-2">Tips de Ejecución</h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>
                  ⬇️ <strong>Bajada:</strong> Extiende completamente el brazo (&gt;160°).
                </li>
                <li>
                  ⬆️ <strong>Subida:</strong> Flexiona el codo con control hasta &lt;60°.
                </li>
                <li>
                  ⚠️ <strong>Ojo:</strong> Mantén el hombro fijo, no lo muevas durante el curl.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
