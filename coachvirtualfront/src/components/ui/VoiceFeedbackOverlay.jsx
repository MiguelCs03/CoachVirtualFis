/**
 * VoiceFeedbackOverlay - Componente visual para feedback de voz
 * Muestra indicador de voz activa, correcciones actuales y controles de voz
 */

import { useState, useEffect } from 'react'
import { Volume2, VolumeX, Mic, AlertCircle, CheckCircle, Info, Clock, Timer } from 'lucide-react'
import {
  onSpeakingStateChange,
  stopSpeaking,
  setVolume,
  initVoiceService,
} from '../../services/IA/voiceFeedbackService'

export default function VoiceFeedbackOverlay({
  corrections = [],
  currentInstruction = '',
  isCorrect = false,
  repCount = 0,
  exerciseName = '',
  onVoiceToggle,
  voiceEnabled = true,
  // Props para ejercicios isométricos
  isIsometric = false,
  holdTime = 0, // Tiempo acumulado manteniendo la posición
  targetHoldTime = 30, // Tiempo objetivo en segundos
  targetReps = 12, // Número de repeticiones objetivo
}) {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentMessage, setCurrentMessage] = useState('')
  const [showVolume, setShowVolume] = useState(false)
  const [volume, setVolumeState] = useState(1)

  useEffect(() => {
    initVoiceService()

    onSpeakingStateChange((speaking, message) => {
      setIsSpeaking(speaking)
      setCurrentMessage(message || '')
    })

    return () => {
      stopSpeaking()
    }
  }, [])

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value)
    setVolumeState(newVolume)
    setVolume(newVolume)
  }

  // Calcular tiempo restante para ejercicios isométricos
  const remainingTime = Math.max(0, targetHoldTime - holdTime)
  const progressPercent = Math.min(100, (holdTime / targetHoldTime) * 100)

  // Formatear tiempo como MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <>
      {/* Indicador de voz activa - esquina superior izquierda */}
      <div className="absolute top-12 left-3 z-20 flex flex-col gap-2 font-mono">
        {/* Toggle de voz */}
        <button
          onClick={() => onVoiceToggle?.(!voiceEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 border font-mono text-[9px] uppercase tracking-widest rounded-none transition-all duration-300 ${
            voiceEnabled 
              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_12px_rgba(255,230,0,0.15)]' 
              : 'bg-black/90 border-white/10 text-white/40 hover:border-white/20'
          }`}
          title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
        >
          {voiceEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>{voiceEnabled ? 'Voz ON' : 'Voz OFF'}</span>
        </button>

        {/* Indicador de hablando */}
        {isSpeaking && voiceEnabled && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-none backdrop-blur-sm animate-pulse text-[9px] uppercase tracking-wider max-w-[200px]">
            <Mic className="w-3.5 h-3.5 text-blue-400" />
            <span className="truncate">
              {currentMessage || 'Hablando...'}
            </span>
          </div>
        )}

        {/* Control de volumen */}
        {voiceEnabled && showVolume && (
          <div className="px-3 py-2 bg-black/95 border border-white/10 rounded-none backdrop-blur-sm">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-1 bg-white/10 rounded-none appearance-none cursor-pointer accent-yellow-400"
            />
            <p className="text-white/50 text-[8px] text-center mt-1 font-mono">{Math.round(volume * 100)}%</p>
          </div>
        )}
      </div>

      {/* INDICADOR ÚNICO DINÁMICO - Verde=Correcto, Rojo=Incorrecto */}
      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-20 w-auto max-w-[90%] sm:max-w-md">
        {isCorrect ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/40 text-green-400 font-mono text-[9px] uppercase tracking-wider rounded-none backdrop-blur-md shadow-[0_0_15px_rgba(34,197,94,0.15)]">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="font-black">[POSTURA_CORRECTA]</span>
          </div>
        ) : (
          <div className="flex items-start gap-2 px-4 py-2 bg-red-500/10 border border-red-500/40 text-red-400 font-mono text-[9px] uppercase tracking-wider rounded-none backdrop-blur-md shadow-[0_0_15px_rgba(239,68,68,0.2)]">
            <AlertCircle className="w-4 h-4 text-red-400 animate-pulse mt-0.5" />
            <div>
              <span className="font-black block">[SISTEMA_ERROR] CORRIGE TU POSTURA</span>
              {corrections.length > 0 && (
                <span className="text-[8px] text-white/70 block mt-1 lowercase font-normal leading-normal">
                  &gt;&gt; {corrections[0]?.message || corrections[0]}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Contador de repeticiones O Cronómetro isométrico - esquina superior derecha */}
      <div className="absolute top-3 right-3 z-20">
        {isIsometric ? (
          // Cronómetro para ejercicios isométricos
          <div className="relative bg-[#0d0d0d]/95 border border-white/10 rounded-none px-4 py-2.5 min-w-[120px] shadow-[8px_8px_0px_rgba(0,0,0,0.4)] font-mono text-center">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-orange-500" />
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-0.5">ISOMÉTRICO</p>
            <p className={`text-3xl font-black text-orange-400 italic leading-none my-1 ${isCorrect ? 'animate-pulse' : ''}`}>
              {formatTime(remainingTime)}
            </p>
            {/* Barra de progreso */}
            <div className="mt-1.5 bg-white/5 border border-white/10 rounded-none h-1 overflow-hidden">
              <div
                className="bg-orange-500 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[7px] text-orange-400/70 uppercase tracking-wider mt-1.5 leading-none">
              {isCorrect ? 'MANTENER_OK' : 'CORREGIR_POS'}
            </p>
          </div>
        ) : (
          // Contador de repeticiones normal
          <div className="relative bg-[#0d0d0d]/95 border border-white/10 rounded-none px-4 py-2.5 min-w-[100px] shadow-[8px_8px_0px_rgba(0,0,0,0.4)] font-mono text-center">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow-400" />
            <p className="text-[8px] text-white/40 uppercase tracking-widest mb-0.5">REPETICIONES</p>
            <p className="text-3xl font-black text-yellow-400 italic leading-none my-1">{repCount}</p>
            <p className="text-[7px] text-white/30 uppercase tracking-wider leading-none">DE {targetReps}</p>
          </div>
        )}
      </div>

      {/* Estilos para animación de ondas de sonido */}
      <style>{`
        @keyframes soundWave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
        .sound-wave {
          animation: soundWave 0.3s ease-in-out infinite;
        }
        .sound-wave:nth-child(2) { animation-delay: 0.1s; }
        .sound-wave:nth-child(3) { animation-delay: 0.2s; }
      `}</style>
    </>
  )
}
