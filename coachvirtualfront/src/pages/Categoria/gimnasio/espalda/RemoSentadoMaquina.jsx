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
  AlertTriangle,
  Flame,
  Database,
} from 'lucide-react'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * COMPONENTES AUXILIARES (DEFINIDOS AL INICIO PARA EVITAR TEMPORAL DEAD ZONE)
 */
const cx = (...c) => c.filter(Boolean).join(' ')

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

const StatusCard = ({ label, value, status, error, warning, neutral }) => (
  <div
    className={cx(
      'p-5 border flex flex-col items-center justify-center gap-2 transition-all duration-300',
      error
        ? 'bg-red-500/10 border-red-500/40'
        : warning
          ? 'bg-yellow-400/10 border-yellow-400/40'
          : neutral
            ? 'bg-white/[0.03] border-white/10'
            : 'bg-green-500/10 border-green-500/40'
    )}
  >
    <span className="text-[7px] font-black tracking-widest text-white/30 uppercase text-center leading-none mb-1">
      {label}
    </span>
    <div
      className={cx(
        'text-2xl font-black italic tracking-tighter',
        error ? 'text-red-500' : warning ? 'text-yellow-400' : 'text-white'
      )}
    >
      {value}
    </div>
    <span
      className={cx(
        'text-[8px] font-black tracking-widest uppercase px-2 py-0.5 border',
        error
          ? 'border-red-500/20 text-red-500 bg-red-500/5'
          : warning
            ? 'border-yellow-400/20 text-yellow-400 bg-yellow-400/5'
            : neutral
              ? 'border-white/10 text-white/40 uppercase'
              : 'border-green-500/20 text-green-500 bg-green-500/5'
      )}
    >
      {status}
    </span>
  </div>
)

const CheckItem = ({ label, status, isWarning, pending, special }) => (
  <li className="flex items-center justify-between group">
    <span className="text-[10px] font-black text-white/40 group-hover:text-white transition-colors tracking-tight uppercase">
      {label}
    </span>
    <div className="flex items-center gap-3">
      {status ? (
        <div className="flex items-center gap-2 text-green-500 font-black text-[10px] tracking-widest uppercase">
          <CheckCircle2 className="w-4 h-4" />
          {special ? special : 'SYS_OK'}
        </div>
      ) : isWarning ? (
        <div className="flex items-center gap-2 text-yellow-400 font-black text-[10px] tracking-widest uppercase italic">
          <AlertTriangle className="w-4 h-4 animate-pulse" /> ALERTA
        </div>
      ) : pending ? (
        <div className="flex items-center gap-2 text-white/10 font-black text-[10px] tracking-widest uppercase italic border border-white/5 px-2 py-1">
          ...ESPERANDO
        </div>
      ) : (
        <div className="flex items-center gap-2 text-red-500 font-black text-[10px] tracking-widest uppercase animate-pulse">
          FALLO_BIOS
        </div>
      )}
    </div>
  </li>
)

/**
 * VISTA DE RUTINA: REMO SENTADO EN POLEA BAJA (INDUSTRIAL)
 * Análisis biomecánico en tiempo real con checklist de seguridad.
 */
export default function RemoSentadoMaquina() {
  const navigate = useNavigate()
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || 'Remo Sentado Polea Baja'

  // --- UI STATE ---
  const [started, setStarted] = useState(false)

  // --- AI / MÉTRICAS STATE ---
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('extended')
  const [feedback, setFeedback] = useState('POSICIÓN_ESTÁNDAR: ESPALDA RECTA')
  const [currentAngles, setCurrentAngles] = useState({
    elbow: 180,
    torso: 90,
    knee: 160,
    symmetryDiff: 0,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })

  // Refs de control cinemático
  const lastRepTimeRef = useRef(0)
  const elbowHistoryRef = useRef([])
  const torsoHistoryRef = useRef([])
  const holdStartRef = useRef(null)
  const cheatFlagRef = useRef(false)
  const kneeWarningRef = useRef(false)

  // --- CONFIGURACIÓN BIOMECÁNICA ---
  const EXTENDED_ENTER = 150
  const PULLED_CONFIRM = 85
  const TORSO_MAX_LEAN = 115
  const KNEE_LOCK_THRESHOLD = 175
  const HOLD_MS = 300
  const MIN_INTERVAL_MS = 1200
  const SMOOTH_WINDOW = 5

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)
    const { rightElbow, leftElbow, rightHip, leftHip, rightKnee, leftKnee } = angles

    const updateHistory = (ref, val) => {
      ref.current.push(val)
      if (ref.current.length > SMOOTH_WINDOW) ref.current.shift()
      return ref.current.reduce((a, b) => a + b, 0) / ref.current.length
    }

    const smoothElbow = Math.round(updateHistory(elbowHistoryRef, (rightElbow + leftElbow) / 2))
    const smoothTorso = Math.round(updateHistory(torsoHistoryRef, (rightHip + leftHip) / 2))
    const smoothKnee = Math.round((rightKnee + leftKnee) / 2)

    setCurrentAngles({
      elbow: smoothElbow,
      torso: smoothTorso,
      knee: smoothKnee,
      symmetryDiff: Math.abs(rightElbow - leftElbow),
    })

    // Seguridad de Rodillas
    if (smoothKnee > KNEE_LOCK_THRESHOLD) {
      if (!kneeWarningRef.current) {
        setFeedback('⚠️ ALERTA_SEGURIDAD: DESBLOQUEE RODILLAS')
        speak('Flexiona un poco las rodillas')
        kneeWarningRef.current = true
      }
    } else {
      kneeWarningRef.current = false
    }

    // Estabilidad del Torso
    if (smoothTorso > TORSO_MAX_LEAN) {
      if (!cheatFlagRef.current) {
        setFeedback('⚠️ ERROR_POSTURAL: BALANCEO_EXCESIVO')
        speak('Controla el torso')
        cheatFlagRef.current = true
      }
      return
    }

    if (cheatFlagRef.current && smoothTorso <= TORSO_MAX_LEAN) {
      cheatFlagRef.current = false
      setFeedback('✅ ESTABILIDAD_RESTABLECIDA')
    }

    // Máquina de Estados de Repetición
    const now = Date.now()
    if (stage === 'extended' || stage === 'return_hold') {
      if (smoothElbow < EXTENDED_ENTER - 10) {
        setStage('pulling')
        setFeedback('PROCESANDO_TRACCIÓN...')
        holdStartRef.current = null
      }
    } else if (stage === 'pulling') {
      if (smoothElbow < PULLED_CONFIRM) {
        if (!holdStartRef.current) holdStartRef.current = now
        else if (now - holdStartRef.current >= HOLD_MS) {
          setStage('squeezing')
          setFeedback('🔥 CONTRACCIÓN_ÓPTIMA_LOGRADA')
          holdStartRef.current = null
        }
      }
    } else if (stage === 'squeezing') {
      if (smoothElbow > PULLED_CONFIRM + 10) {
        setStage('returning')
        setFeedback('CONTROL_EXCÉNTRICO_ACTIVO')
      }
    } else if (stage === 'returning') {
      if (smoothElbow > EXTENDED_ENTER) {
        if (!holdStartRef.current) holdStartRef.current = now
        else if (now - holdStartRef.current >= 150) {
          if (now - lastRepTimeRef.current >= MIN_INTERVAL_MS) {
            const newCount = repCount + 1
            setRepCount(newCount)
            setFeedback(`CONTEO_SYNC: ${newCount}`)
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
    const torsoOk = currentAngles.torso <= TORSO_MAX_LEAN
    const kneesOk = currentAngles.knee <= KNEE_LOCK_THRESHOLD
    return [
      { indices: [12, 14, 16], angle: currentAngles.elbow, isValid: true },
      { indices: [12, 24, 26], angle: currentAngles.torso, isValid: torsoOk },
      { indices: [24, 26, 28], angle: currentAngles.knee, isValid: kneesOk },
    ]
  }, [currentAngles])

  const handleBack = () => {
    navigate(-1)
  }

  // --- VISTA PREVIA INDUSTRIAL ---
  if (!started) {
    return (
      <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
        <div className="max-w-4xl mx-auto space-y-12">
          <button
            onClick={handleBack}
            className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{' '}
            CANCELAR_OPERACIÓN
          </button>

          <div className="grid lg:grid-cols-2 gap-12 bg-[#0f0f0f] border border-white/5 overflow-hidden shadow-2xl relative">
            {/* Visualización Visual del Protocolo */}
            <div className="relative h-full min-h-[450px] bg-black group">
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

              <div className="absolute bottom-8 left-8 border border-yellow-400/20 bg-black/60 px-4 py-2 flex items-center gap-3">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">
                  MÓDULO_HIPERTROFIA_ESPALDA_v3
                </span>
              </div>
            </div>

            {/* Configuración Operativa */}
            <div className="p-12 space-y-10 flex flex-col justify-between">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 tracking-[0.4em]">
                    <Cpu className="w-3 h-3 text-yellow-400" /> PROTOCOLO_ACTIVO
                  </div>
                  <h1 className="text-5xl font-black italic uppercase italic tracking-tighter leading-none">
                    {passedNombre}
                  </h1>
                  <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase">
                    MONITOREO BIOMÁTRICO DE INCLINACIÓN Y FLEXIÓN DE SEGURIDAD.
                  </p>
                </div>

                <div className="space-y-6 pt-10 border-t border-white/5 list-none">
                  <InstructionItem
                    number="01"
                    text="POSICIÓN_SENTADA: Rodillas en semiflexión obligatoria."
                  />
                  <InstructionItem
                    number="02"
                    text="EJE_COLUMNA: Espalda neutra, evite balanceos cinéticos."
                  />
                  <InstructionItem
                    number="03"
                    text="TRACCIÓN: Extienda el maneral hacia el plexo solar bajo."
                  />
                </div>
              </div>

              <button
                onClick={() => setStarted(true)}
                className="w-full bg-white text-black hover:bg-yellow-400 font-black py-6 transition-all flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] group"
              >
                INICIAR_RUTINA_SYNC{' '}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Fondo decorativo terminal */}
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Terminal className="w-64 h-64" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- TERMINAL DE ENTRENAMIENTO ACTIVO ---
  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans selection:bg-yellow-400 selection:text-black pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Superior Dinámico */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
              <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">
                {passedNombre}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 pl-6 text-[9px] font-mono tracking-widest text-white/20 uppercase">
              ESTADO: <span className="text-green-500/60">CONEXIÓN_TOTAL_V-IA</span>
              <span className="mx-2">/</span>
              ID_SESIÓN: <span className="text-white/40">RX_POLE_092</span>
            </div>
          </div>
          <button
            onClick={() => setStarted(false)}
            className="px-8 py-3 bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 group"
          >
            <X className="w-4 h-4 group-hover:scale-125 transition-transform" />{' '}
            FINALIZAR_Y_REPORTAR
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Visualización de Visión Artificial (Core) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#0f0f0f] border border-white/5 relative overflow-hidden shadow-2xl">
              <YogaPoseDetector
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />

              {/* Alerta HUD Flotante */}
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cx(
                    'absolute top-8 left-1/2 -translate-x-1/2 px-10 py-3 border backdrop-blur-md shadow-2xl transition-all z-20',
                    feedback.includes('⚠️')
                      ? 'bg-red-500 border-red-500 text-white animate-pulse'
                      : 'bg-black/60 border-yellow-400/20 text-yellow-400'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {feedback.includes('⚠️') ? (
                      <ShieldAlert className="w-5 h-5" />
                    ) : (
                      <Zap className="w-5 h-5" />
                    )}
                    <span className="text-[12px] font-black tracking-[0.3em] uppercase">
                      {feedback}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Telemetría Dinámica Visual */}
              <div className="absolute top-8 left-8 flex flex-col gap-2">
                <div className="flex items-center gap-3 bg-black/80 border border-white/10 px-4 py-1.5">
                  <Smartphone className="w-3 h-3 text-white/40" />
                  <span className="text-[9px] font-mono font-black tracking-widest text-white/40 uppercase">
                    V-LINK_ACTIVE
                  </span>
                </div>
              </div>
            </div>

            {/* Semáforo de Postura Industrial */}
            <div className="bg-[#0f0f0f] border border-white/5 p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase italic flex items-center gap-3">
                  <Activity className="w-4 h-4" /> SEMÁFORO_DE_POSTURA_BIOMÉTRICA
                </h3>
                <div className="text-[8px] font-mono text-white/10">
                  ANALYZING_CORE_STABILITY...
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <StatusCard
                  label="TORSO (ESTABILIDAD)"
                  value={`${currentAngles.torso}°`}
                  status={currentAngles.torso > TORSO_MAX_LEAN ? '❌ FALLO_INST' : '✅ ÓPTIMO'}
                  error={currentAngles.torso > TORSO_MAX_LEAN}
                />
                <StatusCard
                  label="RODILLAS (SEGURIDAD)"
                  value={`${currentAngles.knee}°`}
                  status={
                    currentAngles.knee > KNEE_LOCK_THRESHOLD ? '⚠️ ALERTA_BLOQUEO' : '✅ ÓPTIMO'
                  }
                  warning={currentAngles.knee > KNEE_LOCK_THRESHOLD}
                />
                <StatusCard
                  label="RECORRIDO (CODOS)"
                  value={`${currentAngles.elbow}°`}
                  status={stage.toUpperCase()}
                  neutral
                />
              </div>
            </div>
          </div>

          {/* Panel de Control de Sesión (Right) */}
          <div className="space-y-8">
            {/* Contador de Telemetría */}
            <div className="bg-[#0f0f0f] border border-white/5 p-12 text-center space-y-8 shadow-[20px_20px_0px_rgba(255,230,0,0.03)] relative overflow-hidden">
              <h2 className="text-[10px] font-black text-white/20 tracking-[0.5em] uppercase">
                CONTEO_REPETICIONES
              </h2>
              <div className="text-[140px] font-black italic text-white tracking-tighter leading-none">
                {repCount}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="relative h-2 w-full bg-white/5 overflow-hidden">
                  <motion.div
                    animate={{
                      width: stage === 'pulling' ? '50%' : stage === 'squeezing' ? '100%' : '0%',
                    }}
                    className={cx(
                      'absolute h-full transition-all duration-300',
                      stage === 'squeezing'
                        ? 'bg-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.5)]'
                        : 'bg-white/40'
                    )}
                  />
                </div>
                <p className="text-[9px] font-black text-yellow-400/40 tracking-[0.3em] uppercase italic italic italic">
                  ESTADO_ACTUAL: {stage.replace('_', ' ')}
                </p>
              </div>

              <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                <Flame className="w-40 h-40" />
              </div>
            </div>

            {/* Checklist de Seguridad de Campo */}
            <div className="bg-[#111111] border-l-4 border-yellow-400 p-10 space-y-8 shadow-xl">
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <Shield className="w-5 h-5 text-yellow-400" />
                <h3 className="font-black text-xs tracking-widest uppercase">
                  CHECKLIST_DE_SEGURIDAD
                </h3>
              </div>

              <ul className="space-y-6">
                <CheckItem
                  label="01. EJE_COLUMNA_NEUTRO"
                  status={currentAngles.torso <= TORSO_MAX_LEAN}
                />
                <CheckItem
                  label="02. MARGEN_FLEXIÓN_RODILLA"
                  status={currentAngles.knee <= KNEE_LOCK_THRESHOLD}
                  isWarning={currentAngles.knee > KNEE_LOCK_THRESHOLD}
                />
                <CheckItem
                  label="03. RANGO_HIPERTROFIA (SQUEEZE)"
                  status={stage === 'squeezing'}
                  pending={stage !== 'squeezing'}
                  special="🔥 SQUEEZE"
                />
              </ul>

              <div className="bg-white/[0.02] border border-white/5 p-4 text-center">
                <p className="text-[8px] font-mono text-white/30 uppercase leading-relaxed tracking-wider">
                  Protocolo de seguridad gestionado por V-COACH IA Core v4.9
                </p>
              </div>
            </div>

            {/* Registro de Telemetría Pasada (Ficticio/UI) */}
            <div className="bg-[#0f0f0f] border border-white/5 p-6 flex items-center justify-between group cursor-pointer hover:border-yellow-400/30 transition-all">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-white/20 group-hover:text-yellow-400" />
                <span className="text-[10px] font-black tracking-widest uppercase text-white/40 group-hover:text-white">
                  LOGS_DE_ESTADÍSTICAS
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-white/10 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
