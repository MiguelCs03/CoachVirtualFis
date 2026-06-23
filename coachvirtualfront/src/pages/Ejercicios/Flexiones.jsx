import React, { useState, useRef, useMemo, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Activity,
  ChevronRight,
  X,
  Shield,
  Zap,
  Terminal,
  Cpu,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Database,
  Smartphone,
  Camera
} from 'lucide-react'

import YogaPoseDetector from '../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../utils/poseUtils'
import { useSpeech } from '../../utils/useSpeech'

/**
 * COMPONENTES AUXILIARES INDUSTRIALES
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
 * VISTA DE RUTINA: FLEXIONES (ESTILO INDUSTRIAL)
 */
export default function Flexiones() {
  const [started, setStarted] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const navigate = useNavigate()
  
  const passedNombre = 'Flexiones de Pecho'

  // --- AI / MÉTRICAS STATE ---
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('up')
  const [feedback, setFeedback] = useState('PROTOCOLO_INICIALIZADO: ESPERE MOVIMIENTO')
  const [currentAngles, setCurrentAngles] = useState({
    rightElbow: 180,
    leftElbow: 180,
    rightKnee: 180,
    leftKnee: 180,
    bodyAngle: 180,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })

  // Refs de control
  const errorFlagRef = useRef(false)
  const lastRepTimeRef = useRef(0)

  // --- CONFIGURACIÓN BIOMECÁNICA ---
  const ELBOW_DOWN_THRESHOLD = 90
  const ELBOW_UP_THRESHOLD = 160
  const BODY_ALIGNMENT_MIN = 160
  const KNEE_STRAIGHT_MIN = 165
  const MIN_INTERVAL_MS = 1000

  const handlePoseDetected = (data) => {
    let rightElbow, leftElbow, rightKnee, leftKnee, bodyAngle;
    
    if (Array.isArray(data)) {
      // Landmarks reales
      const angles = calculateBodyAngles(data)
      rightElbow = angles.rightElbow;
      leftElbow = angles.leftElbow;
      rightKnee = angles.rightKnee;
      leftKnee = angles.leftKnee;

      const rightShoulder = data[12]
      const rightHip = data[24]
      const rightAnkle = data[28]

      const calculateAngle = (a, b, c) => {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
        let angle = Math.abs((radians * 180.0) / Math.PI)
        if (angle > 180.0) angle = 360 - angle
        return angle
      }

      bodyAngle = calculateAngle(
        { x: rightShoulder.x, y: rightShoulder.y },
        { x: rightHip.x, y: rightHip.y },
        { x: rightAnkle.x, y: rightAnkle.y }
      )
    } else {
      // Simulador
      ({ rightElbow, leftElbow, rightKnee, leftKnee, bodyAngle } = data);
    }

    setCurrentAngles({
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
      rightKnee: Math.round(rightKnee),
      leftKnee: Math.round(leftKnee),
      bodyAngle: Math.round(bodyAngle),
    })

    const avgElbow = (rightElbow + leftElbow) / 2
    const avgKnee = (rightKnee + leftKnee) / 2

    const kneesStraight = avgKnee > KNEE_STRAIGHT_MIN
    const bodyAligned = bodyAngle > BODY_ALIGNMENT_MIN

    // Validar Postura (Seguridad)
    if ((!kneesStraight || !bodyAligned) && !errorFlagRef.current) {
      if (!kneesStraight) {
        setFeedback('⚠️ ALERTA: PIERNAS NO RECTAS')
        speak('Mantén las piernas rectas')
      } else {
        setFeedback('⚠️ ALERTA: CUERPO DESALINEADO')
        speak('Mantén el cuerpo recto')
      }
      errorFlagRef.current = true
      setTimeout(() => {
        errorFlagRef.current = false
      }, 3000)
      return
    }

    if (errorFlagRef.current && kneesStraight && bodyAligned) {
      errorFlagRef.current = false
      setFeedback('✅ ALINEACIÓN_RESTABLECIDA')
    }

    // Máquina de Estados
    const now = Date.now()
    if (stage === 'up') {
      if (avgElbow < ELBOW_DOWN_THRESHOLD && kneesStraight && bodyAligned) {
        setStage('down')
        setFeedback('SYNC: FASE_EXCÉNTRICA_COMPLETA')
      }
    } else if (stage === 'down') {
      if (avgElbow > ELBOW_UP_THRESHOLD) {
        if (now - lastRepTimeRef.current > MIN_INTERVAL_MS) {
          setStage('up')
          setRepCount(prev => {
              const next = prev + 1;
              speak(next.toString());
              return next;
          });
          setFeedback('CONTEO_REPETICIÓN')
          lastRepTimeRef.current = now
        }
      }
    }
  }

  const highlightedAngles = useMemo(() => {
    const elbowValid =
      stage === 'down'
        ? (currentAngles.rightElbow + currentAngles.leftElbow) / 2 < ELBOW_DOWN_THRESHOLD
        : (currentAngles.rightElbow + currentAngles.leftElbow) / 2 > ELBOW_UP_THRESHOLD

    const bodyValid = currentAngles.bodyAngle > BODY_ALIGNMENT_MIN
    const kneesValid = (currentAngles.rightKnee + currentAngles.leftKnee) / 2 > KNEE_STRAIGHT_MIN

    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: elbowValid },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: elbowValid },
      { indices: [12, 24, 28], angle: currentAngles.bodyAngle, isValid: bodyValid },
      { indices: [24, 26, 28], angle: currentAngles.rightKnee, isValid: kneesValid },
    ]
  }, [currentAngles, stage])

  // Lógica de Simulación
  useEffect(() => {
    if (!isSimulating || !started) return;
    const interval = setInterval(() => {
      const time = Date.now() / 1000;
      const wave = (Math.sin(time * 2.0) + 1) / 2; // Arriba (180) -> Abajo (80)
      
      const elbow = 80 + ((1 - wave) * 100); 
      const knee = 170 + (Math.random() * 10);
      const body = 170 + (Math.random() * 5); 
      
      handlePoseDetected({
        rightElbow: elbow,
        leftElbow: elbow,
        rightKnee: knee,
        leftKnee: knee,
        bodyAngle: body
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isSimulating, started]);

  // --- VISTA PREVIA INDUSTRIAL ---
  if (!started) {
    return (
      <div className="min-h-screen bg-black p-6 lg:p-12 text-white font-sans selection:bg-yellow-400 selection:text-black">
        <div className="max-w-4xl mx-auto space-y-12">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{' '}
            ABORTAR_MISIÓN
          </button>

          <div className="grid lg:grid-cols-2 gap-12 bg-black border border-white/5 overflow-hidden shadow-2xl relative">
            <div className="relative h-full min-h-[450px] bg-black group overflow-hidden">
              <div className="absolute inset-0 bg-orange-500/10 mix-blend-overlay z-10" />
              <div className="w-full h-full flex items-center justify-center bg-zinc-900 border-r border-white/5">
                 <Activity className="w-32 h-32 text-white/5 animate-pulse" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-20"></div>
              <div className="absolute bottom-8 left-8 border border-yellow-400/20 bg-black/60 px-4 py-2 flex items-center gap-3 z-30">
                <Shield className="w-4 h-4 text-yellow-400" />
                <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">
                  AI_CORE_PUSHUP_MONITOR_v4
                </span>
              </div>
            </div>

            <div className="p-12 space-y-10 flex flex-col justify-between relative z-30">
              <div className="space-y-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 tracking-[0.4em]">
                    <Cpu className="w-3 h-3 text-yellow-400" /> PROTOCOLO_ACTIVO
                  </div>
                  <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
                    {passedNombre}
                  </h1>
                  <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase">
                    DETECCIÓN CINEMÁTICA DE ALINEACIÓN CORPORAL Y RANGO DE FLEXIÓN.
                  </p>
                </div>

                <div className="space-y-6 pt-10 border-t border-white/5">
                  <InstructionItem number="01" text="EJE_ESTÁTICO: Mantenga cuerpo recto (> 160°)." />
                  <InstructionItem number="02" text="RANGO_EXCÉNTRICO: Baje hasta flexión (~ 90°)." />
                  <InstructionItem number="03" text="RECORRIDO_CONTROL: Extensión completa (> 160°)." />
                </div>
              </div>

              <button
                onClick={() => setStarted(true)}
                className="w-full bg-white text-black hover:bg-yellow-400 font-black py-6 transition-all flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] group"
              >
                V-LINK_START_SYNC{' '}
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none uppercase font-mono text-[60px] leading-none select-none italic font-black">
                TERMINAL
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- TERMINAL DE ENTRENAMIENTO ACTIVO ---
  return (
    <div className="min-h-screen bg-black p-6 lg:p-12 text-white font-sans selection:bg-yellow-400 selection:text-black pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Superior */}
        <div className="flex items-center justify-between border-b border-white/10 pb-8 mt-12 md:mt-0">
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
                {passedNombre}
              </h2>
            </div>
            <div className="flex items-center gap-1.5 pl-6 text-[9px] font-mono tracking-widest text-white/20 uppercase">
              ESTADO: <span className="text-green-500/60">BIOS_MONITORING_ACTIVE</span>
              <span className="mx-2">/</span>
              SIM_MODE: <span className={isSimulating ? "text-yellow-400" : "text-white/40"}>{isSimulating ? "ACTIVE" : "IDLE"}</span>
            </div>
          </div>
          <div className="flex gap-4">
            <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`px-6 py-2 border font-black text-[10px] tracking-widest uppercase transition-all ${isSimulating ? 'bg-yellow-400 text-black border-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.2)]' : 'bg-white/5 text-white/40 border-white/10 hover:border-white/40'}`}
            >
                {isSimulating ? 'STOP_SIM' : 'START_SIM'}
            </button>
            <button
                onClick={() => setStarted(false)}
                className="px-8 py-3 bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 group"
            >
                <X className="w-4 h-4 group-hover:rotate-90 transition-transform" /> FINALIZAR
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* Visualización IA (Core) */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-black border border-white/5 relative overflow-hidden shadow-2xl min-h-[400px]">
              {isSimulating ? (
                <div className="w-full h-full relative aspect-video bg-black flex items-center justify-center overflow-hidden border border-white/5">
                  <div className="absolute inset-0 bg-orange-500/5 animate-pulse" />
                  <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 400 225">
                    <line x1="100" y1="180" x2="200" y2="100" stroke="white" strokeWidth="2" />
                    <line x1="200" y1="100" x2="300" y2="180" stroke="yellow" strokeWidth="3" />
                    <circle cx="100" cy="180" r="3" fill="white" />
                    <circle cx="200" cy="100" r="3" fill="white" />
                    <circle cx="300" cy="180" r="3" fill="yellow" />
                  </svg>
                  <div className="absolute bottom-4 right-4 font-mono text-[8px] text-yellow-400/60 uppercase">
                    ESTADO: ANALIZANDO_BIOMECÁNICA_PUSHUP_v4
                  </div>
                </div>
              ) : (
                <YogaPoseDetector
                  onPoseDetected={handlePoseDetected}
                  highlightedAngles={highlightedAngles}
                  isCalibrated={isCalibrated}
                  onCalibrationComplete={() => {
                    setIsCalibrated(true)
                    speak('Calibración exitosa. Comienza el ejercicio.')
                  }}
                />
              )}

              {/* HUD Flotante de Feedback */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={feedback}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cx(
                    'absolute top-8 left-1/2 -translate-x-1/2 px-10 py-3 border backdrop-blur-md shadow-2xl z-20',
                    feedback.includes('⚠️')
                      ? 'bg-red-500 border-red-500 text-white animate-pulse'
                      : 'bg-black/60 border-yellow-400/20 text-yellow-400'
                  )}
                >
                  <div className="flex items-center gap-4">
                    {feedback.includes('⚠️') ? <ShieldAlert className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                    <span className="text-[12px] font-black tracking-[0.3em] uppercase">
                      {feedback}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Link Indicator */}
              <div className="absolute top-8 left-8 flex items-center gap-3 bg-black/80 border border-white/10 px-4 py-1.5 z-20">
                <Smartphone className="w-3 h-3 text-white/40" />
                <span className="text-[9px] font-mono font-black tracking-widest text-white/40 uppercase">
                  V-LINK_POZE_X
                </span>
              </div>
            </div>

            {/* Panel de Sensores (Telemetría) */}
            <div className="bg-black border border-white/5 p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-[10px] font-black text-white/20 tracking-[0.4em] uppercase italic flex items-center gap-3">
                  <Activity className="w-4 h-4" /> PANEL_DE_TELEMETRÍA_ACTIVA
                </h3>
                <div className="text-[8px] font-mono text-white/10 uppercase">Analyzing_motion_vectors...</div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatusCard
                  label="CODO DER"
                  value={`${currentAngles.rightElbow}°`}
                  status={stage.toUpperCase()}
                  neutral
                />
                <StatusCard
                  label="CODO IZQ"
                  value={`${currentAngles.leftElbow}°`}
                  status="SYNC"
                  neutral
                />
                <StatusCard
                  label="CUERPO (ALIN)"
                  value={`${currentAngles.bodyAngle}°`}
                  status={currentAngles.bodyAngle <= BODY_ALIGNMENT_MIN ? '❌ FALLO' : '✅ SYS_OK'}
                  error={currentAngles.bodyAngle <= BODY_ALIGNMENT_MIN}
                />
                <StatusCard
                  label="RODILLAS"
                  value={`${(currentAngles.rightKnee + currentAngles.leftKnee) / 2}°`}
                  status={(currentAngles.rightKnee + currentAngles.leftKnee) / 2 <= KNEE_STRAIGHT_MIN ? '❌ FALLO' : '✅ SYS_OK'}
                  error={(currentAngles.rightKnee + currentAngles.leftKnee) / 2 <= KNEE_STRAIGHT_MIN}
                />
              </div>
            </div>
          </div>

          {/* Panel Lateral (Control y Checklist) */}
          <div className="space-y-8">
            
            {/* Gran Contador de Reps */}
            <div className="bg-black border border-white/5 p-12 text-center space-y-8 shadow-[20px_20px_0px_rgba(255,230,0,0.03)] relative overflow-hidden">
              <h2 className="text-[10px] font-black text-white/20 tracking-[0.5em] uppercase">
                CONTADOR_REPETICIONES
              </h2>
              <div className="text-[140px] font-black italic text-white tracking-tighter leading-none select-none drop-shadow-[0_4px_10px_rgba(255,255,255,0.1)]">
                {repCount}
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="relative h-2 w-full bg-white/5 overflow-hidden">
                  <motion.div
                    animate={{
                      width: stage === 'down' ? '50%' : stage === 'up' ? '100%' : '0%',
                    }}
                    className={cx(
                      'absolute h-full transition-all duration-300',
                      stage === 'up'
                        ? 'bg-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.5)]'
                        : 'bg-white/40'
                    )}
                  />
                </div>
                <p className="text-[9px] font-black text-yellow-400/40 tracking-[0.3em] uppercase italic">
                  FASE_ACTUAL: {stage === 'down' ? 'EXCÉNTRICA' : 'CONCÉNTRICA'}
                </p>
              </div>

              <div className="absolute -bottom-10 -right-10 opacity-5 pointer-events-none">
                <Terminal className="w-40 h-40" />
              </div>
            </div>

            {/* Checklist de Seguridad de Campo */}
            <div className="bg-black border-l-4 border-yellow-400 p-10 space-y-8 shadow-xl">
              <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                <Shield className="w-5 h-5 text-yellow-400" />
                <h3 className="font-black text-xs tracking-widest uppercase">
                  PROTOCOLOS_SEGURIDAD
                </h3>
              </div>

              <ul className="space-y-6">
                <CheckItem
                  label="01. ALINEACIÓN_CUERPO"
                  status={currentAngles.bodyAngle > BODY_ALIGNMENT_MIN}
                />
                <CheckItem
                  label="02. EXTENSIÓN_RODILLAS"
                  status={(currentAngles.rightKnee + currentAngles.leftKnee) / 2 > KNEE_STRAIGHT_MIN}
                />
                <CheckItem
                  label="03. MARGEN_FLEXIÓN_SQUEEZE"
                  status={stage === 'down' || ((currentAngles.rightElbow + currentAngles.leftElbow) / 2 < ELBOW_DOWN_THRESHOLD)}
                  special="✅ FLEX_OK"
                />
              </ul>

              <div className="bg-white/[0.02] border border-white/5 p-4 text-center">
                <p className="text-[8px] font-mono text-white/30 uppercase leading-relaxed tracking-wider">
                  SISTEMA ASISTIDO POR V-COACH IA CORE v4.9
                </p>
              </div>
            </div>

            {/* Registro de Telemetría Inferior */}
            <div className="bg-black border border-white/5 p-6 flex items-center justify-between group cursor-pointer hover:border-yellow-400/30 transition-all">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-white/20 group-hover:text-yellow-400" />
                <span className="text-[10px] font-black tracking-widest uppercase text-white/40 group-hover:text-white">
                  VER_MÉTRICAS_LOG
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
