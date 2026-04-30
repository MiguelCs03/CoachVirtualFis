import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

export default function Flexiones() {
  // --- ESTADO Y LÓGICA ORIGINAL INTACTA ---
  const [started, setStarted] = useState(false)
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || null
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('up')
  const [feedback, setFeedback] = useState('Ponte en posición de plancha')
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    rightHip: 180,
    leftHip: 180,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })
  const errorFlagRef = useRef(false)
  const lastRepTimeRef = useRef(0)

  const elbowHistoryRef = useRef([])
  const hipHistoryRef = useRef([])

  const holdStartRef = useRef(null)
  const holdTypeRef = useRef(null)

  const DOWN_ENTER = 100
  const DOWN_CONFIRM = 85
  const UP_ENTER = 140
  const UP_CONFIRM = 165
  const HIP_MIN_VALID = 160
  const HIP_MAX_VALID = 200
  const HOLD_MS = 200
  const MIN_INTERVAL_MS = 1000
  const SMOOTH_WINDOW = 5

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)
    const { rightElbow, leftElbow, rightHip, leftHip } = angles

    const updateHistory = (ref, val) => {
      ref.current.push(val)
      if (ref.current.length > SMOOTH_WINDOW) ref.current.shift()
      return ref.current.reduce((a, b) => a + b, 0) / ref.current.length
    }

    const smoothElbow = Math.round(updateHistory(elbowHistoryRef, (rightElbow + leftElbow) / 2))
    const smoothHip = Math.round(updateHistory(hipHistoryRef, (rightHip + leftHip) / 2))

    setCurrentAngles({
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      rightHip: Math.round(rightHip),
      leftHip: Math.round(leftHip),
    })

    if (smoothHip < HIP_MIN_VALID || smoothHip > HIP_MAX_VALID) {
      if (!errorFlagRef.current) {
        const msg = smoothHip < HIP_MIN_VALID ? '⚠️ ¡SUBE LA CADERA!' : '⚠️ ¡BAJA LA CADERA!'
        setFeedback(msg)
        speak(
          msg === '⚠️ ¡SUBE LA CADERA!'
            ? 'Sube la cadera, cuerpo recto'
            : 'Baja la cola, cuerpo recto'
        )
      }
      errorFlagRef.current = true
      holdStartRef.current = null
      holdTypeRef.current = null
      return
    }

    if (errorFlagRef.current && smoothHip >= HIP_MIN_VALID && smoothHip <= HIP_MAX_VALID) {
      errorFlagRef.current = false
    }

    const now = Date.now()

    if (stage === 'up' || stage === 'up_hold') {
      if (smoothElbow < DOWN_ENTER) {
        setStage('down_moving')
        setFeedback('BAJANDO... PECHO AL SUELO')
        holdStartRef.current = null
      }
    } else if (stage === 'down_moving') {
      if (smoothElbow < DOWN_CONFIRM) {
        if (!holdStartRef.current) {
          holdStartRef.current = now
          holdTypeRef.current = 'bottom'
        } else if (now - holdStartRef.current >= HOLD_MS) {
          setStage('bottom_hold')
          setFeedback('⚡ ¡EMPUJA HACIA ARRIBA!')
          holdStartRef.current = null
        }
      }
    } else if (stage === 'bottom_hold') {
      if (smoothElbow > UP_ENTER) {
        setStage('up_moving')
        setFeedback('SUBIENDO CON FUERZA...')
      }
    } else if (stage === 'up_moving') {
      if (smoothElbow > UP_CONFIRM) {
        if (!holdStartRef.current) {
          holdStartRef.current = now
          holdTypeRef.current = 'top'
        } else if (now - holdStartRef.current >= HOLD_MS) {
          if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
            const newCount = repCount + 1
            setRepCount(newCount)
            setFeedback(`✅ REPETICIÓN ${newCount} BUENA`)
            speak(newCount.toString())
            lastRepTimeRef.current = now
          }
          setStage('up')
          holdStartRef.current = null
        }
      } else if (smoothElbow < DOWN_ENTER) {
        setStage('down_moving')
        setFeedback('NO COMPLETASTE LA SUBIDA')
        holdStartRef.current = null
      }
    }
  }

  const highlightedAngles = useMemo(() => {
    const hipValid =
      currentAngles.rightHip >= HIP_MIN_VALID && currentAngles.rightHip <= HIP_MAX_VALID
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: true },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: true },
      { indices: [12, 24, 26], angle: currentAngles.rightHip, isValid: hipValid },
    ]
  }, [currentAngles])

  const resetCounter = () => {
    setRepCount(0)
    setStage('up')
    setFeedback('CONTADOR REINICIADO')
    errorFlagRef.current = false
  }

  // --- VISTA DE DESCRIPCIÓN (NUEVO ESTILO) ---
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-4 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none">
          <h1 className="text-[20vw] font-bold tracking-tighter">TERMINAL</h1>
        </div>

        <div className="flex justify-between items-center mb-12 relative z-10">
          <button
            onClick={() => window.history.back()}
            className="text-xs text-gray-500 hover:text-white uppercase tracking-wider"
          >
            ← CANCELAR_OPERACIÓN
          </button>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 relative z-10">
          {/* Panel Izquierdo: Visualizador */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-sm p-4 aspect-[4/3] flex flex-col justify-between relative shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-sm"></div>

            <div className="flex justify-center items-center flex-grow opacity-80">
              {passedImage ? (
                <img
                  src={passedImage}
                  alt={passedNombre || 'Flexiones'}
                  className="w-full h-full object-contain mix-blend-screen grayscale"
                />
              ) : (
                <div className="text-[120px] opacity-20">🤸‍♂️</div>
              )}
            </div>

            <div className="border border-[#e5b81a]/40 bg-[#e5b81a]/5 text-[#e5b81a] px-3 py-1.5 rounded-sm flex items-center gap-2.5 w-fit self-start relative z-10">
              <span className="text-xs font-bold tracking-wider">
                ⛨ AI_PUSHUP_MONITOR_V4.9
              </span>
            </div>
          </div>

          {/* Panel Derecho: Datos y Control */}
          <div className="lg:pl-12 flex flex-col justify-between py-4">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[#e5b81a] text-lg">⚙</span>
                <span className="text-sm text-gray-500 tracking-wider uppercase">
                  PROTOCOLO_ACTIVO <span className="text-gray-400">TERMINAL</span>
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight uppercase mb-4 leading-none italic">
                FLEXIONES<br />(PUSH-UPS)
              </h1>

              <p className="text-sm text-gray-400 tracking-wide mb-10 pb-4 border-b border-gray-800">
                MONITOREO DE PROFUNDIDAD DE CODO Y ALINEACIÓN DE CADERA.
              </p>

              <div className="space-y-7 mb-12">
                <div className="flex items-start gap-5">
                  <span className="text-[#e5b81a] text-sm font-bold pt-0.5">01</span>
                  <p className="text-sm tracking-wide leading-relaxed flex-1">
                    <strong className="text-gray-200">ESPALDA:</strong> MANTENER RECTA (CADERA 160°-200°).
                  </p>
                </div>
                <div className="flex items-start gap-5">
                  <span className="text-[#e5b81a] text-sm font-bold pt-0.5">02</span>
                  <p className="text-sm tracking-wide leading-relaxed flex-1">
                    <strong className="text-gray-200">BAJADA:</strong> CODOS A 90° O MENOS (&lt; 85° CONFIRMADO).
                  </p>
                </div>
                <div className="flex items-start gap-5">
                  <span className="text-[#e5b81a] text-sm font-bold pt-0.5">03</span>
                  <p className="text-sm tracking-wide leading-relaxed flex-1">
                    <strong className="text-gray-200">SUBIDA:</strong> EXTENSIÓN COMPLETA DE BRAZOS (&gt; 165°).
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStarted(true)}
              className="w-full bg-white hover:bg-gray-200 text-black font-bold py-5 px-8 flex items-center justify-between group transition-all duration-300 rounded-sm"
            >
              <span className="text-lg tracking-widest uppercase">
                V-LINK_START_SYNC
              </span>
              <span className="text-2xl group-hover:translate-x-1 transition-transform">
                ›
              </span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA DE RUTINA (NUEVO ESTILO) ---
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-4 md:p-8 relative z-10">
      <div className="max-w-7xl mx-auto">

        {/* Header Rutina */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-[#e5b81a]">⚙</span>
            FLEXIONES <span className="text-gray-500 text-sm font-normal">/ EN EJECUCIÓN</span>
          </h1>
          <button
            onClick={() => setStarted(false)}
            className="text-xs text-gray-500 hover:text-white uppercase tracking-wider underline"
          >
            [ FINALIZAR_SESIÓN ]
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Panel Izquierdo: Cámara e IA */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-sm relative overflow-hidden shadow-2xl">
              <YogaPoseDetector
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />

              <div className="absolute top-4 left-4 border border-[#e5b81a]/30 bg-black/50 backdrop-blur-sm px-3 py-2 text-[#e5b81a] text-xs space-y-1 rounded-sm">
                <p>SYS_STATUS: <span className={errorFlagRef.current ? "text-red-500" : "text-green-500"}>
                  {errorFlagRef.current ? "WARN" : "OK"}
                </span></p>
                <p>TRACKING: ACTIVE</p>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-[#1a1a1a] border border-gray-800 p-3 rounded-sm">
                <div className="text-[10px] text-gray-500 tracking-wider">CODO_DER</div>
                <div className={`text-xl font-bold ${
                  stage === 'bottom_hold' && currentAngles.rightElbow < DOWN_CONFIRM ? 'text-green-400' :
                  stage === 'up' && currentAngles.rightElbow > UP_CONFIRM ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {currentAngles.rightElbow}°
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-gray-800 p-3 rounded-sm">
                <div className="text-[10px] text-gray-500 tracking-wider">CODO_IZQ</div>
                <div className={`text-xl font-bold ${
                  stage === 'bottom_hold' && currentAngles.leftElbow < DOWN_CONFIRM ? 'text-green-400' :
                  stage === 'up' && currentAngles.leftElbow > UP_CONFIRM ? 'text-green-400' : 'text-blue-400'
                }`}>
                  {currentAngles.leftElbow}°
                </div>
              </div>
              <div className="bg-[#1a1a1a] border border-gray-800 p-3 rounded-sm">
                <div className="text-[10px] text-gray-500 tracking-wider">CADERA</div>
                <div className={`text-xl font-bold ${
                  currentAngles.rightHip >= HIP_MIN_VALID && currentAngles.rightHip <= HIP_MAX_VALID ? 'text-green-400' : 'text-red-400'
                }`}>
                  {currentAngles.rightHip}°
                </div>
              </div>
            </div>
          </div>

          {/* Panel Derecho: Datos y Feedback */}
          <div className="space-y-6">

            {/* Repeticiones */}
            <div className="bg-[#1a1a1a] border border-gray-800 rounded-sm p-8 text-center shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-800"></div>
              <h2 className="text-gray-500 text-xs uppercase tracking-widest mb-2">
                REPETICIONES_VALIDADAS
              </h2>
              <div className="text-[100px] font-black text-white leading-none tracking-tighter">
                {repCount}
              </div>
              <button
                onClick={resetCounter}
                className="mt-6 text-xs text-gray-600 hover:text-[#e5b81a] uppercase tracking-wider transition-colors"
              >
                &gt; RESET_COUNTER
              </button>
            </div>

            {/* Feedback Box */}
            <div className={`rounded-sm p-6 shadow-xl border-l-4 transition-colors duration-300 ${
              feedback.includes('⚠️')
                ? 'bg-red-900/20 border-red-500 text-red-400'
                : feedback.includes('✅') || feedback.includes('BUENA')
                  ? 'bg-green-900/20 border-green-500 text-green-400'
                  : 'bg-[#1a1a1a] border-[#e5b81a] text-[#e5b81a]'
            }`}>
              <h3 className="text-[10px] uppercase tracking-widest opacity-70 mb-2">
                LOG_DEL_SISTEMA:
              </h3>
              <p className="text-lg font-medium">{feedback}</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
