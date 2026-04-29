import React, { useState, useRef, useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  ChevronRight,
  Play,
  X,
  Settings,
  Shield,
  Zap,
  Clock,
  Terminal,
  Cpu,
  Info,
  Target,
  ShieldAlert,
  CheckCircle2,
  Scale,
  Flame,
  Gauge,
} from 'lucide-react'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * COMPONENTES AUXILIARES (DEFINIDOS AL INICIO)
 */
const cx = (...c) => c.filter(Boolean).join(' ')

const InstructionItem = ({ number, text }) => (
  <div className="flex gap-6 items-start group">
    <span className="text-[10px] font-black text-yellow-400/40 group-hover:text-yellow-400 font-mono transition-colors">
      {number}
    </span>
    <p className="text-[11px] font-mono text-white/60 uppercase leading-relaxed tracking-tight group-hover:text-white transition-colors">
      {text}
    </p>
  </div>
)

/**
 * VISTA DE RUTINA: REMO CON MANCUERNAS (INDUSTRIAL)
 * Análisis biomecánico de inclinación (Hip Hinge) y simetría.
 */
export default function RemoConMancuernas() {
  const navigate = useNavigate()
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || 'Remo con Mancuernas'

  // --- UI STATE ---
  const [started, setStarted] = useState(false)

  // --- AI LOGIC STATE ---
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('extended')
  const [feedback, setFeedback] = useState('INCLINACIÓN_REQUERIDA: 45°')
  const [currentAngles, setCurrentAngles] = useState({
    elbow: 180,
    hipAngle: 170,
    symmetryDiff: 0,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })

  // Refs
  const lastRepTimeRef = useRef(0)
  const elbowHistoryRef = useRef([])
  const hipHistoryRef = useRef([])
  const holdStartRef = useRef(null)
  const postureErrorRef = useRef(false)

  // --- CONFIGURACIÓN BIOMECÁNICA ---
  const START_PULL = 150
  const END_PULL = 95
  const MAX_UPRIGHT = 160
  const MAX_LOW = 85
  const HOLD_MS = 250
  const MIN_INTERVAL_MS = 1100
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
    const symmetryDiff = Math.abs(rightElbow - leftElbow)

    setCurrentAngles({
      elbow: smoothElbow,
      hipAngle: smoothHip,
      symmetryDiff,
    })

    // Validación de Postura
    if (smoothHip > MAX_UPRIGHT) {
      if (!postureErrorRef.current) {
        setFeedback('⚠️ CRIT_ERROR: INCLINAR_TORSO')
        speak('Inclínate hacia adelante')
        postureErrorRef.current = true
      }
      return
    } else if (smoothHip < MAX_LOW) {
      setFeedback('⚠️ CRIT_WARNING: TORSO_DEMASIADO_BAJO')
      return
    }

    if (postureErrorRef.current && smoothHip <= MAX_UPRIGHT) {
      postureErrorRef.current = false
      setFeedback('✅ STATUS_OK: POSTURA_ESTABLE')
    }

    // Máquina de Estados
    const now = Date.now()
    if (stage === 'extended' || stage === 'lowering') {
      if (smoothElbow < START_PULL - 10) {
        setStage('pulling')
        setFeedback('EJECUTANDO_TRACCIÓN...')
        holdStartRef.current = null
      }
    } else if (stage === 'pulling') {
      if (smoothElbow < END_PULL) {
        if (!holdStartRef.current) holdStartRef.current = now
        else if (now - holdStartRef.current >= HOLD_MS) {
          setStage('squeezing')
          setFeedback('🔥 PEAK_CONTRACCIÓN: AGUANTE')
          holdStartRef.current = null
        }
      }
    } else if (stage === 'squeezing') {
      if (smoothElbow > END_PULL + 10) {
        setStage('lowering')
        setFeedback('DESCENSO_CONTROLADO_SYNC')
      }
    } else if (stage === 'lowering') {
      if (smoothElbow > START_PULL) {
        if (!holdStartRef.current) holdStartRef.current = now
        else if (now - holdStartRef.current >= HOLD_MS) {
          if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
            const newCount = repCount + 1
            setRepCount(newCount)
            setFeedback(`SYNC_REP_COMPLETADA: ${newCount}`)
            speak(newCount.toString())
            lastRepTimeRef.current = now
          }
          setStage('extended')
          holdStartRef.current = null
        }
      }
    }
  }

  const highlightedAngles = useMemo(() => {
    const postureOk = currentAngles.hipAngle <= MAX_UPRIGHT && currentAngles.hipAngle >= MAX_LOW
    return [
      { indices: [12, 14, 16], angle: currentAngles.elbow, isValid: true },
      { indices: [11, 13, 15], angle: currentAngles.elbow, isValid: true },
      { indices: [12, 24, 26], angle: currentAngles.hipAngle, isValid: postureOk },
    ]
  }, [currentAngles])

  const handleBack = () => {
    navigate(-1)
  }

  // --- VISTA PREVIA ---
  if (!started) {
    return (
      <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
        <div className="max-w-4xl mx-auto space-y-12">
          <button
            onClick={handleBack}
            className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{' '}
            RECUPERAR_SISTEMA
          </button>

          <div className="grid lg:grid-cols-2 gap-12 bg-[#0f0f0f] border border-white/5 overflow-hidden shadow-2xl relative">
            {/* Visual de Referencia */}
            <div className="relative h-full min-h-[400px] bg-black group">
              {passedImage ? (
                <img
                  src={passedImage}
                  alt={passedNombre}
                  className="w-full h-full object-cover filter grayscale contrast-125 brightness-50 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/5">
                  <Activity className="w-24 h-24" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent"></div>

              <div className="absolute bottom-0 w-full bg-yellow-400/10 backdrop-blur-sm border-t border-yellow-400/20 p-4 text-center">
                <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase italic">
                  POSTURA_CLAVE: INCLINACIÓN_45° (CADERA ~130°)
                </span>
              </div>
            </div>

            {/* Configuración */}
            <div className="p-12 space-y-10 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 tracking-[0.4em]">
                    <Cpu className="w-3 h-3 text-yellow-400" /> BIOMECÁNICA_ACTIVA
                  </div>
                  <h1 className="text-4xl font-black italic uppercase italic tracking-tighter leading-none">
                    {passedNombre}
                  </h1>
                  <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase italic leading-relaxed">
                    El sistema verificará la inclinación constante del torso para prevenir estrés
                    lumbar.
                  </p>
                </div>

                <div className="space-y-6 pt-10 border-t border-white/5 list-none">
                  <InstructionItem number="01" text="Pies al ancho de hombros, base estable." />
                  <InstructionItem
                    number="02"
                    text="Incline el torso hacia adelante [hip-hinge]."
                  />
                  <InstructionItem
                    number="03"
                    text="Jale mancuernas hacia la línea de la cintura."
                  />
                </div>
              </div>

              <button
                onClick={() => setStarted(true)}
                className="w-full bg-white text-black hover:bg-yellow-400 font-black py-6 transition-all flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] group"
              >
                DESPLEGAR_MODALIDAD_IA{' '}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA RUTINA ---
  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans selection:bg-yellow-400 selection:text-black pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Superior */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">
                {passedNombre} IA
              </h2>
            </div>
            <div className="text-[9px] font-mono tracking-widest text-white/20 uppercase pl-6">
              PROTOCOL: BENT-OVER_ROW_v2
            </div>
          </div>
          <button
            onClick={() => setStarted(false)}
            className="px-8 py-3 bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 group"
          >
            <X className="w-4 h-4 group-hover:scale-125 transition-transform" /> CERRAR_OPERATIVO
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* CÁMARA & MÉTRICAS (Izquierda) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#0f0f0f] border border-white/5 relative overflow-hidden shadow-2xl">
              <YogaPoseDetector
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />

              {/* Indicador de Inclinación en Video */}
              <div
                className={cx(
                  'absolute bottom-8 right-8 px-6 py-4 border backdrop-blur-md shadow-2xl transition-all z-20',
                  currentAngles.hipAngle > MAX_UPRIGHT
                    ? 'bg-red-500 border-red-500 text-white animate-pulse'
                    : 'bg-black/60 border-white/10 text-white'
                )}
              >
                <div className="text-[9px] font-black uppercase opacity-60 tracking-[0.2em] mb-1">
                  ÁNGULO_TORSO
                </div>
                <div className="text-3xl font-black italic tracking-tighter">
                  {currentAngles.hipAngle}°
                </div>
                <div className="text-[10px] font-bold uppercase mt-1">
                  {currentAngles.hipAngle > MAX_UPRIGHT ? '¡INCLÍNATE!' : 'STATUS: CORRECTO'}
                </div>
              </div>
            </div>

            {/* Panel de Sensores Secundarios */}
            <div className="bg-[#0f0f0f] border border-white/5 p-8 grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/20">
                  <Scale className="w-4 h-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    SIMETRÍA_DE_BRAZOS
                  </span>
                </div>
                <div
                  className={cx(
                    'text-2xl font-black italic tracking-tighter',
                    currentAngles.symmetryDiff > 15 ? 'text-yellow-400' : 'text-green-500'
                  )}
                >
                  {currentAngles.symmetryDiff}°{' '}
                  <span className="text-xs opacity-40 uppercase">DIF</span>
                </div>
                <div className="h-1 w-full bg-white/5">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: Math.min(100, (currentAngles.symmetryDiff / 30) * 100) + '%' }}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-white/20">
                  <Activity className="w-4 h-4" />
                  <span className="text-[10px] font-black tracking-widest uppercase">
                    FASE_MOVIMIENTO
                  </span>
                </div>
                <div className="text-2xl font-black italic tracking-tighter text-yellow-400 uppercase">
                  {stage === 'squeezing' ? 'PEAK_HOLD' : stage}
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={cx(
                        'h-1 flex-1',
                        i <= (stage === 'pulling' ? 3 : stage === 'squeezing' ? 5 : 1)
                          ? 'bg-yellow-400'
                          : 'bg-white/5'
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* DASHBOARD DE SESIÓN (Derecha) */}
          <div className="space-y-8">
            {/* Contador de Potencia */}
            <div className="bg-[#0f0f0f] border border-white/5 p-12 text-center relative overflow-hidden shadow-[20px_20px_0px_rgba(255,230,0,0.03)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-white/[0.03]">
                <motion.div
                  animate={{ width: stage === 'extended' ? '5%' : '100%' }}
                  className={cx(
                    'h-full transition-all duration-300',
                    stage === 'squeezing'
                      ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]'
                      : 'bg-yellow-400'
                  )}
                />
              </div>
              <h2 className="text-white/20 font-black text-[10px] uppercase tracking-[0.5em] mb-4">
                REPETICIONES_SYNC
              </h2>
              <div className="text-[120px] font-black text-white italic tracking-tighter leading-none">
                {repCount}
              </div>
              <button
                onClick={() => setRepCount(0)}
                className="mt-4 text-[9px] font-black text-white/20 hover:text-white transition-all uppercase tracking-widest border border-white/5 px-4 py-1"
              >
                REINICIAR_CONTADOR
              </button>
            </div>

            {/* Feedback Central Terminal */}
            <div
              className={cx(
                'p-8 border-l-4 shadow-xl transition-all',
                feedback.includes('⚠️')
                  ? 'bg-red-500/10 border-red-500 text-red-500'
                  : feedback.includes('🔥')
                    ? 'bg-green-500/10 border-green-500 text-green-500'
                    : 'bg-white/[0.02] border-yellow-400 text-yellow-400'
              )}
            >
              <div className="flex items-center gap-4">
                <Terminal className="w-5 h-5 shrink-0" />
                <p className="text-lg font-black italic uppercase italic tracking-tighter leading-tight">
                  {feedback}
                </p>
              </div>
            </div>

            {/* Posturometro Industrial (El Medidor de Postura) */}
            <div className="bg-[#111111] border border-white/5 p-8 relative space-y-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="font-black text-[10px] text-white/40 tracking-[0.3em] uppercase flex items-center gap-3">
                  <Gauge className="w-4 h-4 text-yellow-400" /> MEDIDOR_DE_POSTURA_v5
                </h3>
              </div>

              <div className="relative pt-10 pb-4">
                {/* Barra de Rango Industrial */}
                <div className="relative h-6 w-full bg-white/5 overflow-hidden flex">
                  <div className="w-[30%] h-full bg-red-500/20" /> {/* Muy bajo */}
                  <div className="w-[40%] h-full bg-yellow-400/20 border-x border-white/10" />{' '}
                  {/* Zona Ideal */}
                  <div className="w-[30%] h-full bg-red-500/20" /> {/* Muy parado */}
                </div>

                {/* Escala de texto terminal */}
                <div className="flex justify-between text-[8px] font-mono font-black text-white/20 mt-3 tracking-widest uppercase px-1">
                  <span>BAJO_P7</span>
                  <span className="text-yellow-400/60">ZONA_ÓPTIMA_IDEAL</span>
                  <span>ALTO_P2</span>
                </div>

                {/* Cursor de Telemetría */}
                <motion.div
                  className="absolute top-4 transition-all z-20"
                  animate={{
                    left: `${Math.min(Math.max(((currentAngles.hipAngle - 80) / 100) * 100, 0), 100)}%`,
                  }}
                >
                  <div className="w-1 h-12 bg-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.8)] relative">
                    <div className="absolute -top-1 -left-1.5 w-4 h-4 bg-yellow-400 transform rotate-45 border-2 border-black"></div>
                  </div>
                </motion.div>
              </div>

              <div className="bg-black/40 border border-white/5 p-4 text-center">
                <p className="text-[9px] font-mono text-white/40 uppercase leading-relaxed tracking-wider">
                  MANTENGA EL INDICADOR EN LA ZONA CENTRAL PARA VALIDACIÓN BIOMÉTRICA.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const Smartphone = ({ className }) => (
  <svg
    className={className}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
    <line x1="12" y1="18" x2="12.01" y2="18" />
  </svg>
)
