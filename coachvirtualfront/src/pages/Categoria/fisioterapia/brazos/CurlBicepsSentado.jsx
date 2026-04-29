import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * Vista de Curl de Bíceps Sentado - Enfoque Clínico
 * Objetivos Terapéuticos:
 * 1. Aislamiento: El codo debe permanecer fijo al costado (No flexión de hombro).
 * 2. Control Excéntrico: La bajada debe ser controlada.
 * 3. Rango Funcional: Flexión completa y extensión casi completa.
 */
export default function CurlBicepsSentado() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false)
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || 'Curl de bíceps sentado'

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('down') // 'down', 'concentric', 'peak', 'eccentric'
  const [feedback, setFeedback] = useState('Espalda recta, codos pegados al cuerpo')
  const [metrics, setMetrics] = useState({
    activeArmAngle: 180, // Ángulo del codo
    elbowDrift: 0, // Cuánto se mueve el codo hacia adelante
    isElbowStable: true,
    isRightActive: true,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })

  // Refs
  const lastRepTimeRef = useRef(0)
  const elbowHistoryRef = useRef([])
  const holdStartRef = useRef(null)
  const driftWarnRef = useRef(false)

  // --- UMBRALES CLÍNICOS ---
  const EXTENSION_TARGET = 150 // Punto de inicio
  const FLEXION_TARGET = 50 // Punto de máxima contracción

  // Tolerancia de desplazamiento del codo (Flexión de hombro compensatoria)
  // Medimos el ángulo del hombro (Cadera-Hombro-Codo).
  // En reposo es ~0-10°. Si sube a > 25°, el codo se está adelantando.
  const MAX_ELBOW_DRIFT_ANGLE = 25

  const HOLD_TIME_MS = 500 // Pequeña pausa isométrica arriba
  const SMOOTH_WINDOW = 5

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)

    // 1. Detectar Brazo Activo (El que tiene el ángulo de codo más cerrado)
    const isRightActive = angles.rightElbow < angles.leftElbow
    const rawElbow = isRightActive ? angles.rightElbow : angles.leftElbow

    // 2. Calcular Desplazamiento de Codo (Shoulder Flexion)
    // Usamos ángulo Cadera-Hombro-Codo para ver si el brazo se separa del tronco hacia adelante
    // poseUtils suele dar 'rightShoulder' como el ángulo axilar.
    // Necesitamos estimar si el brazo está vertical o adelantado.
    // Simplificación: Usamos el ángulo del hombro proporcionado.
    const shoulderAngle = isRightActive ? angles.rightShoulder : angles.leftShoulder

    // En posición sentada, brazo abajo = ~0-10 grados (dependiendo de la ref).
    // Asumiremos que si el ángulo del hombro aumenta mucho, el codo se adelanta.
    // (Ajuste empírico: en T-pose es 90, brazo abajo es 0).
    const elbowDrift = shoulderAngle

    // 3. Suavizado
    const updateHistory = (val) => {
      elbowHistoryRef.current.push(val)
      if (elbowHistoryRef.current.length > SMOOTH_WINDOW) elbowHistoryRef.current.shift()
      return elbowHistoryRef.current.reduce((a, b) => a + b, 0) / elbowHistoryRef.current.length
    }
    const smoothElbow = Math.round(updateHistory(rawElbow))

    // 4. Chequeo de Estabilidad (Codo Fijo)
    let isElbowStable = true
    // Solo validamos estabilidad durante la fase de subida (concentric)
    if (stage === 'concentric' && elbowDrift > MAX_ELBOW_DRIFT_ANGLE) {
      isElbowStable = false
      if (!driftWarnRef.current) {
        setFeedback('⚠️ ¡Codo atrás! No lo adelantes.')
        speak('Codo pegado')
        driftWarnRef.current = true
      }
    } else {
      if (driftWarnRef.current) {
        driftWarnRef.current = false
        setFeedback('✅ Buena técnica.')
      }
    }

    setMetrics({
      activeArmAngle: smoothElbow,
      elbowDrift: Math.round(elbowDrift),
      isElbowStable,
      isRightActive,
    })

    // 5. Máquina de Estados
    const now = Date.now()

    if (stage === 'down' || stage === 'eccentric') {
      // Iniciar subida
      if (smoothElbow < EXTENSION_TARGET - 10) {
        setStage('concentric')
        setFeedback('Sube contrayendo el bíceps...')
        holdStartRef.current = null
      }
    } else if (stage === 'concentric') {
      // Llegar al pico
      if (smoothElbow <= FLEXION_TARGET) {
        if (!holdStartRef.current) {
          holdStartRef.current = now
        } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
          setStage('peak')
          setFeedback('💪 Aprieta arriba...')
          holdStartRef.current = null
        }
      }
    } else if (stage === 'peak') {
      if (!holdStartRef.current) holdStartRef.current = now
      if (now - holdStartRef.current >= 500) {
        setStage('eccentric')
        setFeedback('Baja muy despacio (frena la caída).')
        holdStartRef.current = null
      }
    } else if (stage === 'eccentric') {
      // Vuelta abajo
      if (smoothElbow > EXTENSION_TARGET) {
        if (!holdStartRef.current) {
          holdStartRef.current = now
        } else if (now - holdStartRef.current >= 500) {
          setRepCount((c) => c + 1)
          setFeedback('✅ Repetición válida.')
          speak((repCount + 1).toString())
          setStage('down')
          holdStartRef.current = null
        }
      }
    }
  }

  // --- VISTA PREVIA ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">{passedNombre}</h1>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="h-64 bg-indigo-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">💪</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                  Aislamiento Muscular
                </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Claves del Movimiento:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Siéntate con la espalda totalmente apoyada.</li>
                <li>
                  <strong>Imagina que tu codo está pegado con pegamento a tu costilla.</strong>
                </li>
                <li>Sube la mancuerna sin mover el hombro hacia adelante.</li>
                <li>Baja más lento de lo que subes.</li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200"
              >
                Comenzar Terapia
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA TERAPIA ---
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{passedNombre}</h2>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
              Rehab Codo/Bíceps
            </span>
          </div>
          <button
            onClick={() => setStarted(false)}
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Salir
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Alerta de Codo Móvil */}
              {!metrics.isElbowStable && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 pointer-events-none animate-pulse">
                  <div className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg border-2 border-white">
                    FIJA EL CODO
                  </div>
                </div>
              )}

              {/* Lado Activo */}
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1 rounded-lg text-xs font-bold text-slate-600">
                Brazo: {metrics.isRightActive ? 'Derecho' : 'Izquierdo'}
              </div>
            </div>

            {/* Panel de Rango */}
            <div className="mt-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-6">
              {/* Medidor Circular de Flexión */}
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className={stage === 'peak' ? 'text-green-500' : 'text-blue-500'}
                    strokeDasharray={`${Math.max(0, (180 - metrics.activeArmAngle) / 1.4)}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-slate-700">
                  {metrics.activeArmAngle}°
                </div>
              </div>

              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-600 mb-1">Calidad del Movimiento</h4>
                <div className="flex gap-2 text-xs">
                  <span
                    className={`px-2 py-1 rounded ${metrics.isElbowStable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {metrics.isElbowStable ? 'Codo Estable' : 'Compensación'}
                  </span>
                  <span
                    className={`px-2 py-1 rounded ${stage === 'eccentric' ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-500'}`}
                  >
                    Fase Excéntrica
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL LATERAL */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">
                Repeticiones
              </h3>
              <div className="text-6xl font-medium text-slate-800">{repCount}</div>
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'eccentric' ? 'bg-blue-500' : 'bg-slate-300 text-slate-600'}`}
                >
                  {stage === 'eccentric'
                    ? 'BAJANDO LENTO'
                    : stage === 'concentric'
                      ? 'SUBIENDO'
                      : 'PAUSA'}
                </span>
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${
                      feedback.includes('⚠️')
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : feedback.includes('✅')
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                    }`}
            >
              <div className="text-2xl mt-1">
                {feedback.includes('⚠️') ? '🚧' : feedback.includes('✅') ? '🎯' : 'ℹ️'}
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Corrección IA</h4>
                <p className="text-sm leading-relaxed">{feedback}</p>
              </div>
            </div>

            {/* Visualizador de Compensación */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
              <h4 className="font-bold text-slate-700 mb-3 text-sm">Posición del Codo</h4>
              <div className="relative h-24 w-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden">
                {/* Zonas */}
                <div className="absolute left-0 w-[20%] h-full bg-green-100 flex items-center justify-center text-[8px] text-green-800 font-bold writing-mode-vertical">
                  CORRECTO
                </div>
                <div className="absolute left-[20%] w-[80%] h-full bg-gradient-to-r from-yellow-50 to-red-100"></div>

                {/* Indicador de codo */}
                <div
                  className="absolute top-0 h-full w-1 bg-slate-800 transition-all duration-300 z-10"
                  style={{ left: `${Math.min(100, (metrics.elbowDrift / 45) * 100)}%` }}
                >
                  <div className="absolute top-2 -left-2 text-xs">📍</div>
                </div>
                <p className="absolute bottom-1 right-2 text-[9px] text-red-400 font-bold">
                  ADELANTADO
                </p>
              </div>
              <p className="text-xs mt-2 text-slate-400">Mantén el indicador en la zona verde</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
