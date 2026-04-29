/**
 * VoiceFeedbackOverlay - Componente visual para feedback de voz
 * Muestra indicador de voz activa, correcciones actuales y controles de voz
 */

import { useState, useEffect } from 'react';
import { Volume2, VolumeX, Mic, AlertCircle, CheckCircle, Info, Clock, Timer } from 'lucide-react';
import { onSpeakingStateChange, stopSpeaking, setVolume, initVoiceService } from '../../services/IA/voiceFeedbackService';

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
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentMessage, setCurrentMessage] = useState('');
    const [showVolume, setShowVolume] = useState(false);
    const [volume, setVolumeState] = useState(1);

    useEffect(() => {
        initVoiceService();

        onSpeakingStateChange((speaking, message) => {
            setIsSpeaking(speaking);
            setCurrentMessage(message || '');
        });

        return () => {
            stopSpeaking();
        };
    }, []);

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolumeState(newVolume);
        setVolume(newVolume);
    };

    // Calcular tiempo restante para ejercicios isométricos
    const remainingTime = Math.max(0, targetHoldTime - holdTime);
    const progressPercent = Math.min(100, (holdTime / targetHoldTime) * 100);

    // Formatear tiempo como MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <>
            {/* Indicador de voz activa - esquina superior izquierda */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2">
                {/* Toggle de voz */}
                <button
                    onClick={() => onVoiceToggle?.(!voiceEnabled)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm transition-all duration-300 ${voiceEnabled
                        ? 'bg-green-500/90 text-white'
                        : 'bg-gray-600/90 text-gray-300'
                        }`}
                    title={voiceEnabled ? 'Desactivar voz' : 'Activar voz'}
                >
                    {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    <span className="text-sm font-medium">
                        {voiceEnabled ? 'Voz ON' : 'Voz OFF'}
                    </span>
                </button>

                {/* Indicador de hablando */}
                {isSpeaking && voiceEnabled && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-500/90 text-white rounded-full backdrop-blur-sm animate-pulse">
                        <Mic className="w-4 h-4" />
                        <span className="text-sm font-medium truncate max-w-[200px]">
                            {currentMessage || 'Hablando...'}
                        </span>
                    </div>
                )}

                {/* Control de volumen */}
                {voiceEnabled && showVolume && (
                    <div className="px-3 py-2 bg-black/80 rounded-lg backdrop-blur-sm">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={handleVolumeChange}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                        <p className="text-white text-xs text-center mt-1">{Math.round(volume * 100)}%</p>
                    </div>
                )}
            </div>



            {/* INDICADOR ÚNICO DINÁMICO - Verde=Correcto, Rojo=Incorrecto */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-xl backdrop-blur-md shadow-lg transition-all duration-300 ${isCorrect
                    ? 'bg-green-600 text-white'
                    : 'bg-red-600 text-white'
                    }`}>
                    {isCorrect ? (
                        <>
                            <CheckCircle className="w-6 h-6" />
                            <span className="font-bold text-lg">¡Postura Correcta!</span>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-6 h-6" />
                            <div>
                                <span className="font-bold text-lg block">Corrige tu postura</span>
                                {corrections.length > 0 && (
                                    <span className="text-sm opacity-90">
                                        {corrections[0]?.message || corrections[0]}
                                    </span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Contador de repeticiones O Cronómetro isométrico - esquina superior derecha */}
            <div className="absolute top-4 right-4 z-20">
                {isIsometric ? (
                    // Cronómetro para ejercicios isométricos
                    <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl px-5 py-3 shadow-xl min-w-[120px]">
                        <div className="flex items-center gap-2 justify-center mb-1">
                            <Timer className="w-4 h-4 text-orange-200" />
                            <p className="text-orange-200 text-xs">Mantener</p>
                        </div>
                        <p className={`text-4xl font-bold text-white text-center transition-all ${isCorrect ? 'animate-pulse' : ''}`}>
                            {formatTime(remainingTime)}
                        </p>
                        {/* Barra de progreso */}
                        <div className="mt-2 bg-white/30 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-white h-full rounded-full transition-all duration-500"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                        <p className="text-orange-200 text-xs text-center mt-1">
                            {isCorrect ? '¡Bien! Mantén la posición' : 'Corrige para continuar'}
                        </p>
                    </div>
                ) : (
                    // Contador de repeticiones normal
                    <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl px-5 py-3 shadow-xl">
                        <p className="text-blue-200 text-xs text-center mb-1">Repeticiones</p>
                        <p className="text-4xl font-bold text-white text-center">{repCount}</p>
                        <p className="text-blue-200 text-xs text-center mt-1">de {targetReps}</p>
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
    );
}
