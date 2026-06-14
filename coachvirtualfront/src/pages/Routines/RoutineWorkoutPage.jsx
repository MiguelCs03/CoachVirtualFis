import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Info,
  CheckCircle,
  Clock,
  Dumbbell,
  Target,
  AlertCircle,
  ArrowUp,
  ArrowDown,
  Lock,
  MoveRight,
  Square,
  RefreshCw,
  Trophy,
  ClipboardList,
  TrendingUp,
  Activity,
  Terminal,
  Zap,
  Shield,
  Cpu,
  ChevronRight,
  X,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import YogaPoseDetector from '../Yoga/YogaPoseDetector'
import VoiceFeedbackOverlay from '../../components/ui/VoiceFeedbackOverlay'
import {
  speak,
  stopSpeaking,
  initVoiceService,
  speakNumber,
  isSpeakingNow,
} from '../../services/IA/voiceFeedbackService'
import {
  getExerciseDescription,
  generateExerciseExplanation,
} from '../../services/IA/exerciseDescriptions'
import { getEjercicioById, EJERCICIOS } from '../../services/IA/ejerciciosDataset'
import api from '../../api/api'
import rutinaService from '../../services/rutinaService'
import { createRepCounter } from '../../services/IA/exerciseRepCounter'
import {
  initVoiceRecognition,
  startListening,
  stopListening,
  onVoiceCommand,
  isVoiceRecognitionSupported,
} from '../../services/IA/voiceCommandService'
import { calculateBodyAngles } from '../../utils/poseUtils'
import { useSubscription } from '../../context/SubscriptionContext'
import { useNotification } from '../../context/NotificationContext'

const WORKOUT_STATES = {
  INTRO: 'intro',
  ACTIVE: 'active',
  REST: 'rest',
  COMPLETED: 'completed',
}

export default function RoutineWorkoutPage() {
  const { rutinaId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { puedeUsar, getPlanConfig } = useSubscription()

  const [routineData, setRoutineData] = useState(null)
  const [exercises, setExercises] = useState([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [workoutState, setWorkoutState] = useState(WORKOUT_STATES.INTRO)
  const [isPaused, setIsPaused] = useState(false)
  const [voiceEnabled, setVoiceEnabled] = useState(() => puedeUsar('feedback_voz'))
  const [micEnabled, setMicEnabled] = useState(false)
  const [repCount, setRepCount] = useState(0)
  const [setCount, setSetCount] = useState(1)
  const [restTimer, setRestTimer] = useState(0)
  const [exerciseTimer, setExerciseTimer] = useState(0)
  const [holdTime, setHoldTime] = useState(0)
  const [isCorrect, setIsCorrect] = useState(false)
  const [corrections, setCorrections] = useState([])
  const [showDemo, setShowDemo] = useState(false)
  const [showVoiceCommandsModal, setShowVoiceCommandsModal] = useState(false)
  const [showUpgradeAd, setShowUpgradeAd] = useState(false)
  const [adCountdown, setAdCountdown] = useState(30)

  // Estados para variantes de ejercicios por dolor (HU-8)
  const [showSwapModal, setShowSwapModal] = useState(false)
  const [swapVariants, setSwapVariants] = useState([])

  // Estados para calibración y mapeo (HU-11, HU-12)
  const [isCalibrated, setIsCalibrated] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [highlightedAngles, setHighlightedAngles] = useState([])

  // Estados para incidencias posturales por repetición (HU-14)
  const [currentExerciseErrors, setCurrentExerciseErrors] = useState([])
  const [sessionErrors, setSessionErrors] = useState({})

  const restIntervalRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const lastRepTimeRef = useRef(0)
  const lastCorrectionTimeRef = useRef(0)
  const explanationDoneRef = useRef(false)
  const repCounterRef = useRef(null)
  const sessionCorrectionsRef = useRef([])
  const lastMovementTimeRef = useRef(Date.now())
  const lastPoseRef = useRef(null)

  useEffect(() => {
    const loadRoutine = async () => {
      let stateData = location.state?.routine
      if (!stateData && rutinaId) {
        try {
          stateData = await rutinaService.getById(rutinaId)
        } catch (err) {
          console.error('Error cargando rutina desde API:', err)
        }
      }
      if (stateData) {
        setRoutineData(stateData)
        const ejerciciosArray = Array.isArray(stateData.ejercicios)
          ? stateData.ejercicios
          : Array.isArray(stateData.datos_rutina)
            ? stateData.datos_rutina
            : []
        const exerciseList = ejerciciosArray.map((e, index) => ({
          ...getEjercicioById(e.ejercicio_id || e.id),
          ...getExerciseDescription(e.ejercicio_id || e.id),
          targetReps: e.repeticiones || 12,
          targetSets: e.series || 3,
          targetTime: e.tiempo || 30,
          uniqueKey: `exercise-${index}-${e.ejercicio_id || e.id || Date.now()}`,
          descanso: e.descanso || 60,
          url: e.url || null,
        }))
        setExercises(exerciseList)
      }
    }
    loadRoutine()
  }, [location.state, rutinaId])

  useEffect(() => {
    initVoiceService()
    if (isVoiceRecognitionSupported()) initVoiceRecognition()
    return () => {
      stopSpeaking()
      stopListening()
    }
  }, [])

  useEffect(() => {
    onVoiceCommand((command) => handleVoiceCommand(command))
  }, [currentExerciseIndex])

  useEffect(() => {
    if (workoutState === WORKOUT_STATES.ACTIVE && !isPaused && isCalibrated) {
      const currentEx = exercises[currentExerciseIndex]
      if (currentEx?.esTiempo) {
        timerIntervalRef.current = setInterval(() => {
          setExerciseTimer((prev) => {
            if (prev >= (currentEx.targetTime || 30)) {
              handleSetComplete()
              return 0
            }
            return prev + 1
          })
        }, 1000)
      }
    }
    return () => clearInterval(timerIntervalRef.current)
  }, [workoutState, isPaused, currentExerciseIndex, exercises, isCalibrated])

  const currentExercise = exercises[currentExerciseIndex] || null

  useEffect(() => {
    if (workoutState === WORKOUT_STATES.REST) {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
      const descansoTime = currentExercise?.descanso || 60
      let currentTime = restTimer

      restIntervalRef.current = setInterval(() => {
        currentTime = currentTime - 1
        if (currentTime <= 5 && currentTime > 0 && voiceEnabled) speakNumber(currentTime)
        setRestTimer(currentTime)
        if (currentTime <= 0) {
          clearInterval(restIntervalRef.current)
          setTimeout(() => handleRestComplete(), 500)
          return
        }
      }, 1000)
    } else if (restIntervalRef.current) {
      clearInterval(restIntervalRef.current)
    }
    return () => {
      if (restIntervalRef.current) clearInterval(restIntervalRef.current)
    }
  }, [workoutState, voiceEnabled, currentExercise])

  useEffect(() => {
    if (exercises.length > 0 && workoutState === WORKOUT_STATES.INTRO) explainCurrentExercise()
  }, [currentExerciseIndex, exercises, workoutState])

  useEffect(() => {
    if (currentExercise) {
      repCounterRef.current = createRepCounter(currentExercise.ejercicio_id || currentExercise.id)
      repCounterRef.current.reset()
      
      // Resetear calibración e incidencias para el nuevo ejercicio (HU-11)
      setIsCalibrated(false)
      setCurrentExerciseErrors([])
      setHighlightedAngles([])
    }
  }, [currentExercise])

  const explainCurrentExercise = useCallback(() => {
    if (!currentExercise) return
    setShowDemo(true)
    explanationDoneRef.current = false
    if (voiceEnabled) {
      const exp = generateExerciseExplanation(currentExercise.id, 'full')
      speak(exp, 'info', true)
    }
    const exp = generateExerciseExplanation(currentExercise.id, 'full')
    const palabras = exp.split(' ').length
    const tiempoEstimado = Math.max(8000, palabras * 400)

    setTimeout(() => {
      setShowDemo(false)
      explanationDoneRef.current = true
      setWorkoutState(WORKOUT_STATES.ACTIVE)
      if (voiceEnabled) speak('¡Tu turno! Procede con el movimiento.', 'encouragement', true)
    }, tiempoEstimado)
  }, [currentExercise, voiceEnabled])

  const skipExplanation = useCallback(() => {
    stopSpeaking()
    setShowDemo(false)
    explanationDoneRef.current = true
    setWorkoutState(WORKOUT_STATES.ACTIVE)
  }, [])

  const handleVoiceCommand = useCallback((command) => {
    switch (command) {
      case 'NEXT_EXERCISE':
        goToNextExercise()
        break
      case 'PREV_EXERCISE':
        goToPrevExercise()
        break
      case 'PAUSE':
        setIsPaused(true)
        break
      case 'RESUME':
        setIsPaused(false)
        break
      case 'REST':
        startRest()
        break
    }
  }, [])

  const handleSetComplete = useCallback(() => {
    if (setCount < (currentExercise?.targetSets || 3)) {
      setSetCount((prev) => prev + 1)
      startRest()
    } else {
      goToNextExercise()
    }
  }, [setCount, currentExercise])

  const handleRepComplete = useCallback(() => {
    const newCount = repCount + 1
    setRepCount(newCount)
    if (voiceEnabled) {
      setTimeout(() => speakNumber(newCount), 250)
    }
    if (newCount >= (currentExercise?.targetReps || 12)) {
      setRepCount(0)
      handleSetComplete()
    }
  }, [repCount, currentExercise, voiceEnabled, handleSetComplete])

  const startRest = useCallback(() => {
    setWorkoutState(WORKOUT_STATES.REST)
    const restTime = currentExercise?.descanso || 60
    setRestTimer(restTime)
    if (voiceEnabled) speak(`Buen trabajo. Descanso de ${restTime} segundos.`, 'info')
  }, [currentExercise, voiceEnabled])

  const handleRestComplete = useCallback(() => {
    setWorkoutState(WORKOUT_STATES.ACTIVE)
    setRepCount(0)
  }, [])

  const goToNextExercise = useCallback(() => {
    // Guardar errores del ejercicio actual en la sesión (HU-14)
    setSessionErrors(prev => ({
      ...prev,
      [currentExerciseIndex]: currentExerciseErrors
    }))

    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1)
      setRepCount(0)
      setSetCount(1)
      setWorkoutState(WORKOUT_STATES.INTRO)
    } else {
      // Guarda el progreso en el backend (Lote de ejercicios)
      ;(async () => {
        try {
          const finalSessionErrors = { ...sessionErrors, [currentExerciseIndex]: currentExerciseErrors }

          const payload = exercises.map((ex, idx) => {
            const exErrors = finalSessionErrors[idx] || []
            // Calcular precisión reduciendo un 5% por cada error único (mínimo 50%)
            const computedPrecision = Math.max(50.0, 100.0 - (exErrors.length * 5.0))
            return {
              nombre_ejercicio: ex.nombre,
              repeticiones: ex.targetReps,
              tiempo_segundos: ex.targetTime || 45,
              precision_porcentaje: computedPrecision,
              completado: true,
              errores: exErrors
            }
          })
          
          // Guarda los ejercicios en el historial
          await api.post('/usuarios/historial-paginado/', payload)
          
          // Genera alerta de rutina completada
          await api.post('/alertas/routine-complete/', {
            routine_name: routineData?.nombre || 'Rutina',
            duration_minutes: routineData?.duracion_minutos || 45
          })
        } catch (err) {
          console.error('Error guardando sesion de entrenamiento:', err)
        }
      })()

      setWorkoutState(WORKOUT_STATES.COMPLETED)
      showNotification('ENTRENAMIENTO_FINALIZADO_CON_ÉXITO', 'success')
    }
  }, [currentExerciseIndex, exercises, routineData, showNotification, currentExerciseErrors, sessionErrors])

  const goToPrevExercise = useCallback(() => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex((prev) => prev - 1)
      setRepCount(0)
      setSetCount(1)
      setWorkoutState(WORKOUT_STATES.INTRO)
    }
  }, [currentExerciseIndex])

  const handlePoseDetected = useCallback(
    (landmarks) => {
      if (
        !currentExercise ||
        workoutState !== WORKOUT_STATES.ACTIVE ||
        isPaused ||
        !isCalibrated || // HU-11: no procesar si no está calibrado
        !explanationDoneRef.current ||
        !repCounterRef.current
      )
        return

      const now = Date.now()
      const result = repCounterRef.current.processFrame(landmarks)
      setIsCorrect(result.isCorrect)

      // 1. Obtener ángulos para dibujar (HU-12)
      const counter = repCounterRef.current
      let activeAngles = []
      if (counter && counter.config) {
        const primaryAngleConf = counter.config.detection?.primaryAngle
        if (primaryAngleConf && result.angle !== undefined) {
          const jointMap = { shoulder: 11, elbow: 13, wrist: 15, hip: 23, knee: 25, ankle: 27, head: 0 }
          const indices = primaryAngleConf.joints.map(j => jointMap[j]).filter(idx => idx !== undefined)
          activeAngles.push({
            indices: indices,
            angle: result.angle,
            isValid: result.isCorrect
          })
        }
      }
      setHighlightedAngles(activeAngles)

      // 2. Registrar incidencia de error postural por repetición (HU-14)
      if (result.errors && result.errors.length > 0) {
        setCorrections(result.errors)
        const msg = result.errors[0]?.message || result.errors[0]
        
        // Registrar error único para la repetición actual
        const currentRep = repCount + 1
        setCurrentExerciseErrors(prev => {
          const alreadyLogged = prev.some(e => e.tipo_error === msg && e.repeticion === currentRep)
          if (!alreadyLogged) {
            return [...prev, { tipo_error: msg, repeticion: currentRep }]
          }
          return prev
        })

        if (now - lastCorrectionTimeRef.current > 4000 && voiceEnabled && !isSpeakingNow()) {
          speak(msg, 'correction', true)
          lastCorrectionTimeRef.current = now
        }
      } else if (result.isCorrect) {
        setCorrections([{ type: 'success', message: 'TÉCNICA_ÓPTIMA' }])
      }

      if (result.counted && result.isCorrect) {
        if (now - lastRepTimeRef.current > 2500) {
          lastRepTimeRef.current = now
          handleRepComplete()
        }
      }

      if (result.holdTime !== undefined && result.holdTime > 0) {
        const h = Math.floor(result.holdTime)
        setHoldTime(h)
        if (h >= (currentExercise?.targetTime || 30)) {
          setHoldTime(0)
          handleSetComplete()
        }
      } else {
        setHoldTime(0)
      }
    },
    [currentExercise, workoutState, isPaused, handleRepComplete, handleSetComplete, voiceEnabled, repCount]
  )

  const handleReportDiscomfort = () => {
    if (!currentExercise) return
    
    // Busca variantes del mismo grupo muscular y tipo, excluyendo el actual (HU-8)
    const musculoActual = currentExercise.musculo || ''
    const tipoActual = currentExercise.tipo || ''
    
    const variantes = EJERCICIOS.filter((ej) => 
      ej.musculo === musculoActual && 
      ej.tipo === tipoActual && 
      ej.id !== (currentExercise.ejercicio_id || currentExercise.id)
    )
    
    setSwapVariants(variantes)
    setShowSwapModal(true)
  }

  const handleSwapExercise = (nuevaVariante) => {
    const nuevosEjercicios = [...exercises]
    
    // Reemplaza el ejercicio en el indice actual conservando reps, series y descanso
    nuevosEjercicios[currentExerciseIndex] = {
      ...nuevosEjercicios[currentExerciseIndex],
      ...nuevaVariante,
      id: nuevaVariante.id,
      ejercicio_id: nuevaVariante.id,
      nombre: nuevaVariante.nombre,
      url: nuevaVariante.url,
      musculo: nuevaVariante.musculo,
      tipo: nuevaVariante.tipo
    }
    
    setExercises(nuevosEjercicios)
    setShowSwapModal(false)
    
    // Reinicia contadores de repeticiones y series
    setRepCount(0)
    setSetCount(1)
    
    showNotification(`CAMBIADO A: ${nuevaVariante.nombre.toUpperCase()}`, 'success')
    
    if (voiceEnabled) {
      speak(`Entendido. Cambiamos el ejercicio a ${nuevaVariante.nombre}. Evita cualquier dolor.`, 'info', true)
    }
    
    // Vuelve a reproducir la explicacion del nuevo ejercicio
    setWorkoutState(WORKOUT_STATES.INTRO)
  }

  if (!routineData)
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent animate-spin" />
          <span className="text-[10px] font-mono tracking-[0.5em] text-white/20 uppercase">
            CARGANDO_BIOS_SYSTEM
          </span>
        </div>
      </div>
    )

  if (workoutState === WORKOUT_STATES.COMPLETED) {
    const totalExercises = exercises.length
    const finalSessionErrors = { ...sessionErrors, [currentExerciseIndex]: currentExerciseErrors }
    
    let precisionSum = 0
    exercises.forEach((ex, idx) => {
      const errCount = finalSessionErrors[idx]?.length || 0
      precisionSum += Math.max(50.0, 100.0 - (errCount * 5.0))
    })
    const avgPrecision = totalExercises > 0 ? Math.round(precisionSum / totalExercises) : 100
    const durationMinutes = routineData?.duracion_minutos || 30
    const caloriesBurned = durationMinutes * 8 // HU-15: 8 kcal/min

    const allPosturalErrors = []
    exercises.forEach((ex, idx) => {
      const exErrors = finalSessionErrors[idx] || []
      exErrors.forEach(err => {
        allPosturalErrors.push({
          ejercicio: ex.nombre,
          tipo_error: err.tipo_error,
          repeticion: err.repeticion
        })
      })
    })

    return (
      <div className="min-h-screen bg-[#050505] text-white p-6 font-sans flex items-center justify-center">
        <div className="max-w-3xl w-full space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4"
          >
            <div className="w-20 h-20 bg-yellow-400 text-black mx-auto flex items-center justify-center">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
                REPORTE <span className="text-yellow-400">POST-SESIÓN</span>
              </h1>
              <p className="text-white/40 font-mono text-[9px] tracking-[0.4em] mt-2 uppercase">
                SESIÓN_{routineData?.nombre || 'RUTINA'}_FINALIZADA_EXITOSAMENTE
              </p>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
            {/* Precisión */}
            <div className="bg-[#0d0d0d] border border-white/5 p-6 flex flex-col justify-between space-y-4">
              <span className="text-[9px] text-white/40 uppercase tracking-widest">PRECISIÓN ARTICULAR</span>
              <p className="text-4xl font-black text-yellow-400 italic">
                {avgPrecision}%
              </p>
              <div className="w-full h-1 bg-white/5">
                <div className="h-full bg-yellow-400" style={{ width: `${avgPrecision}%` }} />
              </div>
            </div>

            {/* Duración */}
            <div className="bg-[#0d0d0d] border border-white/5 p-6 flex flex-col justify-between space-y-4">
              <span className="text-[9px] text-white/40 uppercase tracking-widest">TIEMPO TOTAL</span>
              <p className="text-4xl font-black text-white italic">
                {durationMinutes} <span className="text-xs text-white/30 font-normal">MIN</span>
              </p>
              <span className="text-[8px] text-white/30 uppercase">Sincronizado con IA</span>
            </div>

            {/* Calorías */}
            <div className="bg-[#0d0d0d] border border-white/5 p-6 flex flex-col justify-between space-y-4">
              <span className="text-[9px] text-white/40 uppercase tracking-widest">CALORÍAS QUEMADAS</span>
              <p className="text-4xl font-black text-red-400 italic">
                {caloriesBurned} <span className="text-xs text-red-400/30 font-normal">KCAL</span>
              </p>
              <span className="text-[8px] text-red-500/40 uppercase">Metabolismo estimado</span>
            </div>
          </div>

          {/* Incidencias Log */}
          <div className="bg-[#0d0d0d] border border-white/5 p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60 font-mono">
              LOG DE INCIDENCIAS POSTURALES POR REPETICIÓN (HU-14)
            </h3>
            {allPosturalErrors.length === 0 ? (
              <div className="text-center py-8 border border-white/5 bg-white/[0.01]">
                <p className="text-[9px] font-mono text-green-400 uppercase tracking-widest">
                  ¡EXCELENTE EJECUCIÓN! NO SE REGISTRARON ERRORES DE POSTURA
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar font-mono text-[10px]">
                {allPosturalErrors.map((err, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5">
                    <div className="flex items-center gap-3">
                      <span className="text-red-500">⚠</span>
                      <span className="text-white/60">{err.ejercicio}</span>
                    </div>
                    <div className="text-right flex gap-4">
                      <span className="text-red-400">{err.tipo_error}</span>
                      <span className="text-yellow-400 font-bold">REP #{err.repeticion}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => navigate('/home')}
            className="w-full bg-white text-black py-5 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-yellow-400 transition-all font-mono"
          >
            VOLVER AL TERMINAL PRINCIPAL
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-white">
      {/* Header Industrial */}
      <div className="border-b border-white/5 bg-[#0a0a0a] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 text-white/40 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">ABORTAR</span>
          </button>
          <div className="text-center">
            <h1 className="text-xs font-black uppercase tracking-[0.4em] text-yellow-400 mb-1">
              {routineData.nombre}
            </h1>
            <p className="text-[9px] font-mono text-white/20 tracking-widest">
              MÓDULO_{currentExerciseIndex + 1}_DE_{exercises.length}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Botón para mostrar/ocultar esqueleto interactivo (HU-12) */}
            <button
              onClick={() => setShowSkeleton(!showSkeleton)}
              className={`p-2 border ${showSkeleton ? 'border-yellow-400 text-yellow-400' : 'border-white/10 text-white/20'}`}
              title={showSkeleton ? "Ocultar esqueleto interactivo" : "Mostrar esqueleto interactivo"}
            >
              {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 border ${voiceEnabled ? 'border-yellow-400 text-yellow-400' : 'border-white/10 text-white/20'}`}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowVoiceCommandsModal(!showVoiceCommandsModal)}
              className="p-2 border border-white/10 text-white/20 hover:text-white"
            >
              <Terminal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar Industrial */}
      <div className="h-0.5 w-full bg-white/5">
        <div
          className="h-full bg-yellow-400 transition-all duration-500"
          style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto p-6 lg:p-10">
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Estado REST */}
            <AnimatePresence>
              {workoutState === WORKOUT_STATES.REST && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-yellow-400 p-12 text-black text-center relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 opacity-10">
                    <Clock className="w-48 h-48 -ml-10 -mt-10" />
                  </div>
                  <p className="text-[10px] font-black tracking-[0.5em] mb-4">FASE_RECUPERACIÓN</p>
                  <p className="text-9xl font-black italic uppercase italic tracking-tighter leading-none mb-6 font-mono">
                    {restTimer}
                  </p>
                  <div className="flex justify-center gap-6">
                    <button
                      onClick={handleRestComplete}
                      className="bg-black text-white px-10 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all flex items-center gap-3"
                    >
                      SALTAR <SkipForward className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Workspace Cámara / Detector */}
            {workoutState !== WORKOUT_STATES.REST && (
              <div className="relative bg-[#0d0d0d] border border-white/5 aspect-video overflow-hidden group">
                {workoutState === WORKOUT_STATES.INTRO && (
                  <div className="absolute inset-0 z-40 bg-black/60 flex flex-col items-center justify-center p-10 text-center space-y-6">
                    <Cpu className="w-16 h-16 text-yellow-400 animate-pulse" />
                    <div>
                      <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">
                        SINCRONIZANDO MOVIMIENTO
                      </h3>
                      <p className="text-white/40 font-mono text-[9px] tracking-widest mt-2 uppercase">
                        ANALIZANDO_PATRÓN_BIOMECÁNICO...
                      </p>
                    </div>
                    <button
                      onClick={skipExplanation}
                      className="border border-white/20 px-8 py-3 text-[9px] font-black uppercase tracking-widest hover:border-yellow-400 hover:text-yellow-400 transition-all"
                    >
                      TERMINAR PRE-CARGA
                    </button>
                  </div>
                )}

                {showDemo && currentExercise?.url && (
                  <div className="absolute inset-0 z-30 bg-black/90 p-10 flex items-center justify-center">
                    <img
                      src={currentExercise.url}
                      className="max-w-full max-h-full object-contain filter grayscale invert brightness-150"
                      alt=""
                    />
                  </div>
                )}

                <div
                  className={cx(
                    'w-full h-full',
                    workoutState === WORKOUT_STATES.INTRO
                      ? 'opacity-20 grayscale scale-[1.05]'
                      : 'opacity-100'
                  )}
                >
                  <YogaPoseDetector
                    onPoseDetected={handlePoseDetected}
                    highlightedAngles={highlightedAngles}
                    isCalibrated={isCalibrated}
                    onCalibrationComplete={() => {
                      setIsCalibrated(true)
                      if (voiceEnabled) {
                        speak('¡Calibración exitosa! Comienza tu ejercicio.', 'encouragement', true)
                      }
                    }}
                    showSkeleton={showSkeleton}
                  />
                </div>

                <VoiceFeedbackOverlay
                  corrections={corrections}
                  currentInstruction={currentExercise?.nombre || ''}
                  isCorrect={isCorrect}
                  repCount={repCount}
                  exerciseName={currentExercise?.nombre}
                  voiceEnabled={voiceEnabled}
                  onVoiceToggle={setVoiceEnabled}
                  isIsometric={currentExercise?.esTiempo || false}
                  holdTime={holdTime}
                  targetHoldTime={currentExercise?.targetTime || 30}
                  targetReps={currentExercise?.targetReps || 12}
                />
              </div>
            )}

            {/* Controles de Navegación Industrial */}
            <div className="flex items-center justify-center gap-6 pt-4">
              <button
                onClick={goToPrevExercise}
                disabled={currentExerciseIndex === 0}
                className="w-14 h-14 border border-white/10 flex items-center justify-center hover:border-yellow-400 disabled:opacity-10 transition-all"
              >
                <SkipBack className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className="w-20 h-20 bg-yellow-400 flex items-center justify-center hover:bg-white transition-all"
              >
                {isPaused ? (
                  <Play className="w-8 h-8 text-black" />
                ) : (
                  <Pause className="w-8 h-8 text-black" />
                )}
              </button>
              <button
                onClick={goToNextExercise}
                className="w-14 h-14 border border-white/10 flex items-center justify-center hover:border-yellow-400 transition-all"
              >
                <SkipForward className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Side Info Panel */}
          <div className="space-y-6">
            {/* Stats Panel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0f0f0f] border border-white/5 p-6 space-y-2">
                <p className="text-[8px] font-black text-white/20 tracking-widest uppercase">
                  CONTEO_RPS
                </p>
                <p className="text-4xl font-black italic uppercase italic tracking-tighter text-white">
                  {repCount}{' '}
                  <span className="text-xs text-white/20 NOT-italic">
                    / {currentExercise?.targetReps}
                  </span>
                </p>
              </div>
              <div className="bg-[#0f0f0f] border border-white/5 p-6 space-y-2">
                <p className="text-[8px] font-black text-white/20 tracking-widest uppercase">
                  CICLO_SERIE
                </p>
                <p className="text-4xl font-black italic uppercase italic tracking-tighter text-yellow-400">
                  {setCount}{' '}
                  <span className="text-xs text-yellow-400/20 NOT-italic">
                    / {currentExercise?.targetSets}
                  </span>
                </p>
              </div>
            </div>

            {/* Exercise Meta */}
            <div className="bg-[#0f0f0f] border border-white/5 p-8 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1 h-4 bg-yellow-400" />
                  <h2 className="text-xl font-black italic uppercase italic tracking-tighter">
                    {currentExercise?.nombre}
                  </h2>
                </div>
                <p className="text-[10px] font-mono text-white/40 leading-relaxed uppercase tracking-tight">
                  {currentExercise?.proposito || 'UNIDAD_RENDIMIENTO_ALTA_INTENSIDAD'}
                </p>
              </div>

              <div className="space-y-3">
                <InfoRow
                  icon={Target}
                  label="FOCO_MUSCULAR"
                  value={currentExercise?.musculos?.join(' | ') || 'ESTRACCIÓN_GLOBAL'}
                />
                <InfoRow
                  icon={Shield}
                  label="PREVENCIÓN"
                  value={`${currentExercise?.descanso}S_DESCANSO_LOG`}
                />
                <InfoRow icon={Zap} label="INTENSIDAD" value="HARDCORE_SYSTEM" color="yellow" />
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <p className="text-[8px] font-black text-white/20 tracking-[0.2em] uppercase">
                  MÉTODO_OPERATIVO:
                </p>
                <p className="text-[11px] font-mono text-white/60 leading-relaxed uppercase">
                  {currentExercise?.instrucciones || 'PROCESANDO_INSTRUCCIONES_SISTEMA...'}
                </p>
              </div>

              {/* Botón para reportar molestias y cambiar por variante (HU-8) */}
              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={handleReportDiscomfort}
                  className="w-full flex items-center justify-center gap-2 border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/10 py-4 text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-all font-mono"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  REPORTAR MOLESTIA / VARIAR EJERCICIO
                </button>
              </div>
            </div>

            {/* Errores Comunes */}
            <div className="bg-red-500/5 border-l-2 border-red-500/40 p-6">
              <p className="text-[8px] font-black text-red-500/60 tracking-widest uppercase mb-3 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" /> ALERTAS_POSTURALES
              </p>
              <ul className="space-y-2">
                {currentExercise?.erroresComunes?.map((err, i) => (
                  <li
                    key={i}
                    className="text-[10px] font-mono text-red-100/40 uppercase leading-snug"
                  >
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Paused Overlay Industrial */}
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6"
          >
            <div className="text-center space-y-8">
              <Pause className="w-24 h-24 text-yellow-400 mx-auto animate-pulse" />
              <h2 className="text-4xl font-black italic uppercase italic tracking-tighter">
                SISTEMA <span className="text-yellow-400">EN PAUSA</span>
              </h2>
              <button
                onClick={() => setIsPaused(false)}
                className="bg-white text-black px-12 py-5 font-black uppercase tracking-[0.4em] text-[10px] hover:bg-yellow-400 transition-all flex items-center gap-4 mx-auto"
              >
                REANUDAR OPERACIÓN <Play className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Comandos de Voz */}
      <AnimatePresence>
        {showVoiceCommandsModal && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="fixed bottom-10 right-10 z-[110] bg-[#0f0f0f] border border-white/20 p-8 w-80 shadow-[10px_10px_0px_rgba(255,230,0,0.1)]"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2 text-yellow-400">
                <Terminal className="w-4 h-4" /> COMANDOS_TERMINAL
              </h3>
              <button onClick={() => setShowVoiceCommandsModal(false)}>
                <X className="w-4 h-4 text-white/20" />
              </button>
            </div>
            <div className="space-y-4 font-mono text-[10px] text-white/40 uppercase tracking-tighter">
              <div className="flex justify-between">
                <span>SIGUIENTE</span> <span className="text-white/60">"SIGUIENTE"</span>
              </div>
              <div className="flex justify-between">
                <span>PAUSA</span> <span className="text-white/60">"PAUSA"</span>
              </div>
              <div className="flex justify-between">
                <span>REFERENCIA</span> <span className="text-white/60">"MOSTRAR"</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Cambio de Variantes (HU-8) */}
      <AnimatePresence>
        {showSwapModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[120] flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0f0f0f] border border-white/10 p-8 max-w-md w-full relative"
            >
              <button
                onClick={() => setShowSwapModal(false)}
                className="absolute top-4 right-4 text-white/40 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="mb-6 space-y-2">
                <p className="text-[8px] font-black text-yellow-400 tracking-[0.25em] uppercase font-mono">
                  BUSCADOR_DE_VARIANTES_EVITACIÓN_DOLOR
                </p>
                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">
                  ¿Sientes Molestia?
                </h3>
                <p className="text-[10px] font-mono text-white/40 leading-relaxed uppercase">
                  Reemplaza el ejercicio actual por una variante para el grupo muscular:{' '}
                  <span className="text-yellow-400 font-bold">{currentExercise?.musculo?.toUpperCase()}</span>
                </p>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {swapVariants.length === 0 ? (
                  <div className="text-center py-6 border border-white/5 bg-white/[0.01]">
                    <p className="text-[9px] font-mono text-red-400 uppercase tracking-widest">
                      NO_HAY_VARIANTES_DISPONIBLES
                    </p>
                  </div>
                ) : (
                  swapVariants.map((variante) => (
                    <button
                      key={variante.id}
                      onClick={() => handleSwapExercise(variante)}
                      className="w-full text-left p-4 bg-white/[0.01] border border-white/5 hover:border-yellow-400/60 hover:bg-white/[0.03] transition-all flex items-center justify-between group font-mono"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-black uppercase text-white group-hover:text-yellow-400 transition-colors truncate">
                          {variante.nombre}
                        </p>
                        <p className="text-[8px] font-mono text-white/30 uppercase mt-1 truncate">
                          TIPO: {variante.tipo}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
                    </button>
                  ))
                )}
              </div>

              <div className="mt-8 pt-4 border-t border-white/5">
                <button
                  onClick={() => setShowSwapModal(false)}
                  className="w-full border border-white/10 hover:border-white py-4 font-black uppercase tracking-widest text-[9px] text-white/60 hover:text-white transition-all font-mono"
                >
                  CANCELAR Y VOLVER AL ENTRENAMIENTO
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const InfoRow = ({ icon: Icon, label, value, color }) => (
  <div className="flex items-center gap-4">
    <div
      className={cx(
        'p-2 border',
        color === 'yellow' ? 'border-yellow-400/20 text-yellow-400' : 'border-white/5 text-white/20'
      )}
    >
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1">
      <p className="text-[7px] font-black text-white/20 tracking-widest uppercase leading-none mb-1">
        {label}
      </p>
      <p className="text-[10px] font-mono text-white/80 uppercase truncate">{value}</p>
    </div>
  </div>
)

const cx = (...c) => c.filter(Boolean).join(' ')
