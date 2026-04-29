import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, 
    Volume2, 
    VolumeX, 
    Mic, 
    MicOff, 
    Info,
    Play, 
    Pause, 
    RotateCcw, 
    Clock, 
    Target, 
    Dumbbell,
    CheckCircle, 
    AlertCircle, 
    Eye, 
    BookOpen,
    Zap,
    Activity,
    Shield,
    Terminal,
    Cpu,
    ChevronRight,
    Trophy
} from 'lucide-react';
import YogaPoseDetector from '../Yoga/YogaPoseDetector';
import VoiceFeedbackOverlay from '../../components/ui/VoiceFeedbackOverlay';
import { speak, stopSpeaking, initVoiceService, speakNumber } from '../../services/IA/voiceFeedbackService';
import { getExerciseDescription, generateExerciseExplanation } from '../../services/IA/exerciseDescriptions';
import { getEjercicioById } from '../../services/IA/ejerciciosDataset';
import {
    initVoiceRecognition,
    startListening,
    stopListening,
    onVoiceCommand,
    isVoiceRecognitionSupported
} from '../../services/IA/voiceCommandService';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { useSubscription } from '../../context/SubscriptionContext';

/**
 * PÁGINA UNIVERSAL DE EJERCICIOS INDUSTRIAL
 * Soporta detección dinámica para cualquier ejercicio del sistema con estética de terminal.
 */
export default function UniversalExercisePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const exerciseId = parseInt(id);

    // Contexto de Suscripción para validación de permisos
    const { puedeUsar } = useSubscription();

    // Estado del ejercicio y metadatos IA
    const [exerciseData, setExerciseData] = useState(null);
    const [exerciseDesc, setExerciseDesc] = useState(null);

    // Controles de estado de la sesión
    const [isActive, setIsActive] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(() => puedeUsar('feedback_voz'));
    const [micEnabled, setMicEnabled] = useState(false);
    const [showDemo, setShowDemo] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);

    // Métricas del entrenamiento
    const [repCount, setRepCount] = useState(0);
    const [setCount, setSetCount] = useState(1);
    const [timer, setTimer] = useState(0);
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);

    // Estado de la visión artificial y biometría
    const [isCorrect, setIsCorrect] = useState(false);
    const [corrections, setCorrections] = useState([]);
    const [currentInstruction, setCurrentInstruction] = useState('');

    // Referencias de control temporal y lógica de conteo
    const timerRef = useRef(null);
    const restTimerRef = useRef(null);
    const lastRepTimeRef = useRef(0);
    const repStateRef = useRef('idle');
    const lastCorrectionTimeRef = useRef(0);
    const explanationDoneRef = useRef(false);

    // CARGA DE DATOS DEL MÓDULO DE EJERCICIO
    useEffect(() => {
        const data = getEjercicioById(exerciseId);
        const desc = getExerciseDescription(exerciseId);

        if (data) {
            setExerciseData(data);
            setExerciseDesc(desc);
            setCurrentInstruction(desc.proposito);
        } else {
            navigate(-1);
        }
    }, [exerciseId, navigate]);

    // INICIALIZACIÓN DE SERVICIOS BIOMÉTRICOS Y DE VOZ
    useEffect(() => {
        initVoiceService();
        if (isVoiceRecognitionSupported()) {
            initVoiceRecognition();
        }

        return () => {
            stopSpeaking();
            if (timerRef.current) clearInterval(timerRef.current);
            if (restTimerRef.current) clearInterval(restTimerRef.current);
        };
    }, []);

    // CONFIGURACIÓN DE ESCUCHA DE COMANDOS DE VOZ IA
    useEffect(() => {
        onVoiceCommand((command) => {
            handleVoiceCommand(command);
        });
    }, []);

    // CRONÓMETRO DE ACTIVIDAD PRINCIPAL
    useEffect(() => {
        if (isActive && !isPaused && !isResting) {
            timerRef.current = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isActive, isPaused, isResting]);

    // LÓGICA DE TEMPORIZADOR PARA MÓDULO DE DESCANSO
    useEffect(() => {
        if (isResting && restTimer > 0) {
            restTimerRef.current = setInterval(() => {
                setRestTimer(prev => {
                    if (prev <= 1) {
                        handleRestComplete();
                        return 0;
                    }
                    if (prev <= 5 && voiceEnabled) {
                        speakNumber(prev - 1);
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => { if (restTimerRef.current) clearInterval(restTimerRef.current); };
    }, [isResting, restTimer, voiceEnabled]);

    // Formateo de tiempo estándar para terminal
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // INICIO DEL PROTOCOLO DE ENTRENAMIENTO
    const handleStart = useCallback(() => {
        setIsActive(true);
        setShowInstructions(false);
        explanationDoneRef.current = false;
        repStateRef.current = 'idle';

        if (voiceEnabled && exerciseDesc) {
            const explanation = generateExerciseExplanation(exerciseId, 'full');
            speak(`${explanation}`, 'info', true);
            setTimeout(() => {
                explanationDoneRef.current = true;
                speak('¡Protocolo iniciado! Comience el movimiento.', 'encouragement', true);
            }, 8000);
        } else {
            explanationDoneRef.current = true;
        }
    }, [voiceEnabled, exerciseDesc, exerciseId]);

    const handleTogglePause = () => {
        setIsPaused(!isPaused);
        if (voiceEnabled) speak(isPaused ? 'REANUDANDO' : 'PAUSADO', 'info');
    };

    const handleReset = () => {
        setIsActive(false);
        setIsPaused(false);
        setRepCount(0);
        setSetCount(1);
        setTimer(0);
        setRestTimer(0);
        setIsResting(false);
        setShowInstructions(true);
    };

    // MANEJO DE FINALIZACIÓN DE SERIE BIOMÉTRICA
    const handleSetComplete = useCallback(() => {
        if (voiceEnabled) speak(`Serie ${setCount} finalizada.`, 'encouragement');
        const targetSets = exerciseDesc?.series || 3;

        if (setCount < targetSets) {
            const restTime = exerciseDesc?.descanso || 60;
            setIsResting(true);
            setRestTimer(restTime);
            if (voiceEnabled) speak(`Iniciando descanso de ${restTime} segundos.`, 'info');
        } else {
            if (voiceEnabled) speak('¡Objetivo cumplido! Protocolo de entrenamiento completado.', 'encouragement', true);
            setIsActive(false);
        }
    }, [setCount, exerciseDesc, voiceEnabled]);

    const handleRestComplete = useCallback(() => {
        setIsResting(false);
        setRepCount(0);
        setSetCount(prev => prev + 1);
        if (voiceEnabled) speak(`Iniciando serie ${setCount + 1}. Esté preparado.`, 'encouragement');
    }, [setCount, voiceEnabled]);

    // CONTEO SINCROZINADO CON VOZ IA
    const handleRepComplete = useCallback(() => {
        const newCount = repCount + 1;
        setRepCount(newCount);
        if (voiceEnabled) {
            setTimeout(() => speakNumber(newCount), 200);
        }
        const targetReps = exerciseDesc?.reps || 12;
        if (newCount >= targetReps) {
            setRepCount(0);
            handleSetComplete();
        }
    }, [repCount, exerciseDesc, voiceEnabled, handleSetComplete]);

    // MANEJO DE COMANDOS DE VOZ EN TIEMPO REAL
    const handleVoiceCommand = useCallback((command) => {
        switch (command) {
            case 'SHOW_EXERCISE': setShowDemo(true); setTimeout(() => setShowDemo(false), 5000); break;
            case 'PAUSE': setIsPaused(true); break;
            case 'RESUME': setIsPaused(false); break;
            case 'HELP': if (voiceEnabled) speak('Diga: Demostración, Pausa, Continuar o Descanso.', 'info'); break;
        }
    }, [voiceEnabled]);

    const toggleMic = () => {
        if (micEnabled) { stopListening(); setMicEnabled(false); }
        else { startListening(); setMicEnabled(true); if (voiceEnabled) speak('Micrófono activo. Control de voz habilitado.', 'info'); }
    };

    // ANÁLISIS DE POSE Y BIOMECÁNICA (Visión Artificial)
    const handlePoseDetected = useCallback((landmarks) => {
        if (!isActive || isPaused || isResting || !explanationDoneRef.current) return;

        const now = Date.now();
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];

        if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) {
            setIsCorrect(false);
            setCorrections([{ type: 'warning', message: 'FUERA_DE_RANGO: Ajuste su posición' }]);
            setCurrentInstruction('Vuelva al encuadre de la cámara');
            return;
        }

        let formCorrect = true;
        const newCorrections = [];

        // Validación de postura - Espalda recta (Biometría básica)
        const shoulderCenterX = (leftShoulder.x + rightShoulder.x) / 2;
        const hipCenterX = (leftHip.x + rightHip.x) / 2;
        if (Math.abs(shoulderCenterX - hipCenterX) > 0.15) {
            formCorrect = false;
            newCorrections.push({ type: 'error', message: 'ERROR_BIOS: Mantenga la verticalidad' });
        }

        if (formCorrect) {
            const hipY = (leftHip.y + rightHip.y) / 2;
            const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;
            const verticalRatio = Math.abs(hipY - shoulderY);

            // Algoritmo de detección de repetición por oscilación vertical
            if (repStateRef.current === 'idle' && verticalRatio < 0.25) repStateRef.current = 'down';
            else if (repStateRef.current === 'down' && verticalRatio > 0.3) repStateRef.current = 'up';
            else if (repStateRef.current === 'up' && verticalRatio < 0.25) {
                if (now - lastRepTimeRef.current > 1500) {
                    handleRepComplete();
                    repStateRef.current = 'idle';
                    lastRepTimeRef.current = now;
                }
            }
            setIsCorrect(true); setCorrections([]); setCurrentInstruction('POSTURA_ÓPTIMA: Continúe');
        } else {
            if (now - lastCorrectionTimeRef.current > 5000 && voiceEnabled) {
                speak(newCorrections[0]?.message || 'Corrija la postura', 'correction');
                lastCorrectionTimeRef.current = now;
            }
            setIsCorrect(false); setCorrections(newCorrections); setCurrentInstruction(newCorrections[0]?.message || 'AJUSTE_REQUERIDO');
        }
    }, [isActive, isPaused, isResting, handleRepComplete, voiceEnabled]);

    if (!exerciseData || !exerciseDesc) return <div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-12 h-12 text-yellow-400 animate-spin" /></div>;

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-yellow-400 selection:text-black">
            
            {/* Header de Terminal de Entrenamiento */}
            <div className="bg-[#0f0f0f] border-b border-white/10 px-6 py-4 fixed top-16 left-0 right-0 z-40 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button onClick={() => navigate(-1)} className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest">
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETROCEDER
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-yellow-400 font-mono text-[9px] tracking-[0.4em] uppercase">MÓDULO_EJERCICIO_IA</span>
                        <h1 className="text-xl font-black italic uppercase italic tracking-tighter leading-none">{exerciseData.nombre}</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setVoiceEnabled(!voiceEnabled)} className={`p-2 border transition-all ${voiceEnabled ? 'border-yellow-400 text-yellow-400 bg-yellow-400/5' : 'border-white/10 text-white/20'}`}>
                            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        </button>
                        {isVoiceRecognitionSupported() && (
                            <button onClick={toggleMic} className={`p-2 border transition-all ${micEnabled ? 'border-yellow-400 animate-pulse text-yellow-400' : 'border-white/10 text-white/20'}`}>
                                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 pt-36">
                <div className="grid lg:grid-cols-3 gap-8">
                    
                    {/* Panel Central: IA y Visualización */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Módulo de Descanso Industrial */}
                        <AnimatePresence>
                            {isResting && (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="bg-yellow-400 text-black p-8 text-center space-y-4 shadow-[15px_15px_0px_rgba(255,230,0,0.1)]">
                                    <p className="text-[10px] font-black tracking-[0.5em] uppercase">CRONÓMETRO_RECARGA_ATLETA</p>
                                    <p className="text-8xl font-black italic tracking-tighter leading-none">{restTimer}s</p>
                                    <div className="flex items-center justify-center gap-4 pt-4">
                                        <div className="text-[10px] font-mono font-bold uppercase tracking-widest">SERIE_{setCount} / {exerciseDesc.series}</div>
                                        <button onClick={handleRestComplete} className="bg-black text-white px-6 py-2 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">ABORTAR_DESCANSO</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Preparación: Tutorial e Instrucciones */}
                        {showInstructions && !isActive && (
                            <div className="bg-[#0f0f0f] border border-white/5 overflow-hidden">
                                <div className="h-96 relative bg-black flex items-center justify-center p-8">
                                    <img src={exerciseData.url} alt={exerciseData.nombre} className="max-h-full filter grayscale brightness-75 contrast-125 transition-all duration-700 hover:grayscale-0 hover:brightness-100" />
                                    <div className="absolute bottom-6 right-6 border border-yellow-400/20 bg-black/60 px-4 py-2 flex items-center gap-2">
                                        <Cpu className="w-4 h-4 text-yellow-400" />
                                        <span className="text-[10px] font-black tracking-widest text-yellow-400">DEMO_PROTOCOLO</span>
                                    </div>
                                </div>
                                <div className="p-10 space-y-8">
                                    <div className="space-y-4 border-l-4 border-yellow-400 pl-8">
                                        <h2 className="text-4xl font-black italic uppercase italic tracking-tighter leading-none">{exerciseData.nombre}</h2>
                                        <p className="text-white/40 font-mono text-xs uppercase leading-relaxed tracking-tight">{exerciseDesc.proposito}</p>
                                    </div>
                                    
                                    <div className="grid md:grid-cols-3 gap-6 pt-6 border-t border-white/5">
                                        <StatBox icon={Target} label="MÚSCULOS" value={exerciseDesc.musculos.join(', ').toUpperCase()} />
                                        <StatBox icon={Zap} label="META_SYNC" value={`${exerciseDesc.reps} REPS × ${exerciseDesc.series} SERIES`} />
                                        <StatBox icon={Clock} label="DESCANSO" value={`${exerciseDesc.descanso}S`} />
                                    </div>

                                    <div className="bg-white/[0.02] border border-white/5 p-8 space-y-4">
                                        <h3 className="text-[10px] font-black text-yellow-400 tracking-[0.3em] uppercase flex items-center gap-3"><BookOpen className="w-4 h-4" /> GUÍA_EJECUCIÓN_TÉCNICA</h3>
                                        <p className="text-sm font-mono text-white/60 leading-relaxed uppercase">{exerciseDesc.instrucciones}</p>
                                    </div>

                                    <button onClick={handleStart} className="w-full bg-white text-black hover:bg-yellow-400 font-black py-6 transition-all flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] group">
                                        INICIAR_PROCESAMIENTO <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Visión Artificial en Tiempo Real */}
                        {isActive && !isResting && (
                            <div className="relative bg-[#0f0f0f] border border-white/5 shadow-2xl">
                                <YogaPoseDetector onPoseDetected={handlePoseDetected} highlightedAngles={[]} />
                                <VoiceFeedbackOverlay corrections={corrections} currentInstruction={currentInstruction} isCorrect={isCorrect} repCount={repCount} exerciseName={exerciseData.nombre} voiceEnabled={voiceEnabled} onVoiceToggle={setVoiceEnabled} />
                                
                                {exerciseData.url && (
                                    <div onClick={() => setShowDemo(!showDemo)} className="absolute top-8 right-8 w-40 h-28 border border-white/20 bg-black/40 backdrop-blur-md p-1 group cursor-pointer hover:border-yellow-400/50 transition-all">
                                        <img src={exerciseData.url} alt="Ref" className="w-full h-full object-cover filter grayscale hover:grayscale-0" />
                                        <div className="absolute inset-x-0 bottom-0 py-1 bg-black/60 text-[8px] font-black text-center text-white/60 group-hover:text-yellow-400">REFERENCIA_SYNC</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Controles de Sesión Activa */}
                        {isActive && (
                            <div className="flex items-center justify-center gap-6 pt-6">
                                <ControlCircle onClick={() => setShowDemo(true)} icon={Eye} label="DEMO" />
                                <button onClick={handleTogglePause} className={`w-20 h-20 flex items-center justify-center rounded-full border-2 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)] ${isPaused ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-transparent border-white/20 text-white hover:border-yellow-400 hover:text-yellow-400'}`}>
                                    {isPaused ? <Play className="w-8 h-8 fill-current" /> : <Pause className="w-8 h-8 fill-current" />}
                                </button>
                                <ControlCircle onClick={handleReset} icon={RotateCcw} label="RESET" />
                            </div>
                        )}
                    </div>

                    {/* Barra Lateral: Telemetría del Atleta */}
                    <div className="space-y-6">
                        
                        {/* Tiempo de Módulo */}
                        <div className="bg-[#0f0f0f] border border-white/5 p-8 text-center space-y-2 shadow-[10px_10px_0px_rgba(255,255,255,0.02)]">
                            <span className="text-[8px] font-black text-white/20 tracking-[0.4em] uppercase">TELEMETRÍA_CRONO</span>
                            <div className="text-5xl font-mono font-black italic tracking-tighter text-white">{formatTime(timer)}</div>
                        </div>

                        {/* Contadores Biométricos */}
                        <div className="grid grid-cols-2 gap-1">
                            <div className="bg-[#0d0d0d] border border-white/5 p-6 text-center space-y-4">
                                <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">REPETICIONES_SYNC</span>
                                <div className="text-6xl font-black italic text-yellow-400 tracking-tighter">{repCount}</div>
                                <div className="text-[10px] font-mono text-white/10 uppercase">DE {exerciseDesc.reps}</div>
                            </div>
                            <div className="bg-[#0d0d0d] border border-white/5 p-6 text-center space-y-4">
                                <span className="text-[7px] font-black text-white/20 tracking-widest uppercase">SERIE_ACTIVA</span>
                                <div className="text-6xl font-black italic text-white tracking-tighter">{setCount}</div>
                                <div className="text-[10px] font-mono text-white/10 uppercase">DE {exerciseDesc.series}</div>
                            </div>
                        </div>

                        {/* Diagnóstico de Errores Comunes */}
                        <div className="bg-red-500/5 border-l-2 border-red-500 p-8 space-y-6">
                            <h3 className="text-[9px] font-black text-red-500 tracking-[0.3em] uppercase flex items-center gap-3"><AlertCircle className="w-4 h-4" /> REPORTE_DE_FALLOS</h3>
                            <ul className="space-y-3">
                                {exerciseDesc.erroresComunes.map((err, i) => (
                                    <li key={i} className="flex gap-3 text-[10px] font-mono text-white/40 uppercase leading-tight">
                                        <span className="text-red-500">_</span> {err}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Comandos del Terminal */}
                        <div className="bg-[#0f0f0f] border border-white/5 p-8 space-y-6">
                            <h3 className="text-[9px] font-black text-white/20 tracking-[0.3em] uppercase border-b border-white/5 pb-2">ACCESO_RÁPIDO_SISTEMA</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <TerminalBtn onClick={() => setShowDemo(true)} icon={Eye} text="REPRODUCIR_DEMO" />
                                <TerminalBtn onClick={() => voiceEnabled && speak(exerciseDesc.instrucciones, 'info', true)} icon={Volume2} text="ESCUCHAR_TUTORIAL" />
                                <TerminalBtn onClick={() => navigate('/mis-alertas')} icon={Shield} text="LOGS_DE_SESIÓN" />
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Modal de Demostración Industrial */}
            <AnimatePresence>
                {showDemo && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[100] cursor-pointer" onClick={() => setShowDemo(false)}>
                        <div className="bg-[#0f0f0f] border border-white/10 p-1 bg-black max-w-4xl w-full mx-4 shadow-[0_0_100px_rgba(255,230,0,0.1)] relative">
                             <div className="absolute top-4 left-4 flex items-center gap-3 bg-black/80 px-4 py-2 border border-yellow-400/20">
                                <Cpu className="w-4 h-4 text-yellow-400" />
                                <span className="text-[10px] font-black text-yellow-400 tracking-widest uppercase">DEMO_LOOP_SYS</span>
                             </div>
                             <img src={exerciseData.url} alt={exerciseData.nombre} className="w-full h-auto max-h-[70vh] object-contain filter contrast-125" />
                             <div className="p-8 text-center bg-[#0d0d0d] space-y-2">
                                <h4 className="text-2xl font-black uppercase italic italic tracking-tighter text-white">{exerciseData.nombre}</h4>
                                <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">PRESIONE EN CUALQUIER LUGAR PARA ABORTAR VISTA</p>
                             </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Overlay de Pausa Industrial */}
            <AnimatePresence>
                {isPaused && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="text-center space-y-8 max-w-md mx-auto p-12 bg-[#0d0d0d] border border-white/10 shadow-[20px_20px_0px_rgba(255,230,0,0.05)]">
                            <Pause className="w-24 h-24 text-yellow-400 mx-auto animate-pulse" />
                            <div className="space-y-2">
                                <h2 className="text-5xl font-black italic uppercase italic tracking-tighter text-white">SESIÓN_SUSPENDIDA</h2>
                                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest leading-relaxed">BIOMETRÍA EN PAUSA. EL SISTEMA ESPERA LA SEÑAL DE REANUDACIÓN PARA CONTINUAR EL PROCESAMIENTO.</p>
                            </div>
                            <button onClick={handleTogglePause} className="w-full bg-white text-black py-4 font-black uppercase text-[12px] tracking-[0.4em] hover:bg-yellow-400 transition-all">REANUDAR_PROTOCOLO</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ========= Subcomponentes de UI =========
const StatBox = ({ icon: Icon, label, value }) => (
    <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-white/20">
            <Icon className="w-3 h-3" />
            <span className="text-[8px] font-black tracking-widest uppercase">{label}</span>
        </div>
        <p className="text-[11px] font-mono font-bold text-white/80 leading-none">{value}</p>
    </div>
);

const ControlCircle = ({ onClick, icon: Icon, label }) => (
    <div className="flex flex-col items-center gap-2 group">
        <button onClick={onClick} className="p-4 bg-[#1a1a1a] border border-white/10 rounded-full hover:border-yellow-400/50 hover:bg-white/5 transition-all text-white/40 hover:text-white">
            <Icon className="w-6 h-6" />
        </button>
        <span className="text-[7px] font-black tracking-[0.2em] text-white/10 group-hover:text-yellow-400 transition-colors uppercase">{label}</span>
    </div>
);

const TerminalBtn = ({ onClick, icon: Icon, text }) => (
    <button onClick={onClick} className="flex items-center gap-4 group text-left">
        <div className="p-3 bg-white/[0.03] border border-white/5 text-white/20 group-hover:border-yellow-400/20 group-hover:text-yellow-400 transition-all">
            <Icon className="w-4 h-4" />
        </div>
        <span className="text-[9px] font-black tracking-widest text-white/40 group-hover:text-white transition-colors uppercase">{text}</span>
    </button>
);

const Loader2 = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
);

const cx = (...c) => c.filter(Boolean).join(" ");
