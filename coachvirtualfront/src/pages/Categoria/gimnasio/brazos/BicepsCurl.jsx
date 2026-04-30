import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

export default function BicepsCurl() {
  // --- ESTADO Y LÓGICA ORIGINAL INTACTA ---
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
  
  const elbowHistoryRef = useRef([])
  const shoulderHistoryRef = useRef([])
  
  const holdStartRef = useRef(null)
  const holdTypeRef = useRef(null) 

  const FLEX_ENTER = 65 
  const FLEX_CONFIRM = 55 
  const EXT_ENTER = 155 
  const EXT_CONFIRM = 165 
  const SHOULDER_ERROR_THRESHOLD = 40 
  const HOLD_MS = 350 
  const MIN_INTERVAL_MS = 1200 
  const SMOOTH_WINDOW = 6 

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)
    const { rightElbow, rightShoulder, leftElbow, leftShoulder } = angles

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

    if (shoulderAngle > SHOULDER_ERROR_THRESHOLD) {
      if (!errorFlagRef.current) {
        setFeedback('⚠️ ¡NO MUEVAS EL HOMBRO!')
        speak('¡No muevas el hombro, mantén el codo fijo!')
      }
      errorFlagRef.current = true
      holdStartRef.current = null
      holdTypeRef.current = null
      return 
    }

    if (errorFlagRef.current && shoulderAngle <= SHOULDER_ERROR_THRESHOLD) {
      errorFlagRef.current = false
    }

    if (stage === 'down' || stage === 'ext_hold') {
      if (elbowAngle < FLEX_ENTER) {
        setStage('up_moving')
        setFeedback('SUBIENDO... MANTÉN CONTROL')
        holdStartRef.current = null
        holdTypeRef.current = null
      }
    } else if (stage === 'up_moving') {
      if (elbowAngle < FLEX_CONFIRM) {
        if (!holdStartRef.current) {
          holdStartRef.current = Date.now()
          holdTypeRef.current = 'flexion'
        } else if (Date.now() - holdStartRef.current >= HOLD_MS) {
          setStage('flex_hold')
          setFeedback('✅ FLEXIÓN CORRECTA')
          holdStartRef.current = null
          holdTypeRef.current = null
        }
      } else {
        if (elbowAngle > EXT_ENTER + 5) {
          setStage('down')
          setFeedback('REINICIA LA SUBIDA CON CONTROL')
        }
      }
    } else if (stage === 'flex_hold') {
      if (elbowAngle > EXT_ENTER) {
        setStage('down_moving')
        setFeedback('BAJANDO... EXTIENDE COMPLETAMENTE')
      }
    } else if (stage === 'down_moving') {
      if (elbowAngle > EXT_CONFIRM) {
        if (!holdStartRef.current) {
          holdStartRef.current = Date.now()
          holdTypeRef.current = 'extension'
        } else if (Date.now() - holdStartRef.current >= HOLD_MS) {
          const now = Date.now()
          if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
            const newCount = repCount + 1
            setRepCount(newCount)
            setFeedback(`💪 REPETICIÓN ${newCount} COMPLETA`)
            speak(newCount.toString())
            lastRepTimeRef.current = now
          } else {
            setFeedback('MOVIMIENTO RÁPIDO, CONTROLA EL RITMO')
          }
          setStage('down')
          holdStartRef.current = null
          holdTypeRef.current = null
        }
      } else if (elbowAngle < FLEX_ENTER - 5) {
        setStage('up_moving')
        setFeedback('SUBIDA NUEVAMENTE, FALTA EXTENSIÓN')
        holdStartRef.current = null
        holdTypeRef.current = null
      }
    }
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
    setFeedback('CONTADOR REINICIADO')
    elbowHistoryRef.current = []
    shoulderHistoryRef.current = []
    holdStartRef.current = null
    holdTypeRef.current = null
    errorFlagRef.current = false
  }

  // --- VISTA DE DESCRIPCIÓN (NUEVO ESTILO) ---
  if (!started) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#e0e0e0] font-mono p-4 md:p-8 relative overflow-hidden">
        {/* Marca de agua de fondo */}
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
          {/* Panel Izquierdo: Visualizador de la Rutina */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-sm p-4 aspect-[4/3] flex flex-col justify-between relative shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 rounded-sm"></div>
            
            <div className="flex justify-center items-center flex-grow opacity-80">
              {passedImage ? (
                <img
                  src={passedImage}
                  alt={passedNombre || 'Curl de bíceps'}
                  className="w-full h-full object-contain mix-blend-screen grayscale"
                />
              ) : (
                <div className="text-[120px] opacity-20">💪</div>
              )}
            </div>

            <div className="border border-[#e5b81a]/40 bg-[#e5b81a]/5 text-[#e5b81a] px-3 py-1.5 rounded-sm flex items-center gap-2.5 w-fit self-start relative z-10">
              <span className="text-xs font-bold tracking-wider">
                ⛨ AI_ARM_MONITOR_V4.9
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
                CURL DE<br />BÍCEPS
              </h1>

              <p className="text-sm text-gray-400 tracking-wide mb-10 pb-4 border-b border-gray-800">
                MONITOREO DE EJE BRAQUIAL Y ESTABILIDAD ESCAPULAR.
              </p>

              {/* Especificaciones Técnicas */}
              <div className="space-y-7 mb-12">
                <div className="flex items-start gap-5">
                  <span className="text-[#e5b81a] text-sm font-bold pt-0.5">01</span>
                  <p className="text-sm tracking-wide leading-relaxed flex-1">
                    <strong className="text-gray-200">FIJACIÓN:</strong> CODOS ANCLADOS AL TORSO (&lt; 40° HOMBRO).
                  </p>
                </div>
                <div className="flex items-start gap-5">
                  <span className="text-[#e5b81a] text-sm font-bold pt-0.5">02</span>
                  <p className="text-sm tracking-wide leading-relaxed flex-1">
                    <strong className="text-gray-200">RANGO:</strong> FLEXIÓN MÁXIMA REQUERIDA (&lt; 60° CODO).
                  </p>
                </div>
                <div className="flex items-start gap-5">
                  <span className="text-[#e5b81a] text-sm font-bold pt-0.5">03</span>
                  <p className="text-sm tracking-wide leading-relaxed flex-1">
                    <strong className="text-gray-200">CADENCIA:</strong> EXTIENDE EL BRAZO POR COMPLETO (&gt; 165°).
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
            CURL DE BÍCEPS <span className="text-gray-500 text-sm font-normal">/ EN EJECUCIÓN</span>
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
              
              {/* Overlay HUD sutil */}
              <div className="absolute top-4 left-4 border border-[#e5b81a]/30 bg-black/50 backdrop-blur-sm px-3 py-2 text-[#e5b81a] text-xs space-y-1 rounded-sm">
                <p>SYS_STATUS: <span className={errorFlagRef.current ? "text-red-500" : "text-green-500"}>
                  {errorFlagRef.current ? "WARN" : "OK"}
                </span></p>
                <p>TRACKING: ACTIVE</p>
              </div>
            </div>

            {/* Métricas de Ángulos (Terminal Style) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'CODO_DER', val: currentAngles.rightElbow, limit: EXT_CONFIRM, isShoulder: false },
                { label: 'CODO_IZQ', val: currentAngles.leftElbow, limit: EXT_CONFIRM, isShoulder: false },
                { label: 'HOMB_DER', val: currentAngles.rightShoulder, limit: SHOULDER_ERROR_THRESHOLD, isShoulder: true },
                { label: 'HOMB_IZQ', val: currentAngles.leftShoulder, limit: SHOULDER_ERROR_THRESHOLD, isShoulder: true }
              ].map((item, i) => (
                <div key={i} className="bg-[#1a1a1a] border border-gray-800 p-3 rounded-sm">
                  <div className="text-[10px] text-gray-500 tracking-wider">{item.label}</div>
                  <div className={`text-xl font-bold ${
                    item.isShoulder 
                      ? (item.val > item.limit ? 'text-red-500' : 'text-gray-300')
                      : 'text-blue-400'
                  }`}>
                    {item.val}°
                  </div>
                </div>
              ))}
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
                : feedback.includes('✅') || feedback.includes('COMPLETA')
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