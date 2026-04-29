/**
 * Página de ejercicio con detector de pose
 * Muestra el ejercicio seleccionado con detección de cámara y corrección de postura
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, VolumeX, Camera, CameraOff, Play, Pause, RotateCcw } from 'lucide-react';
import UniversalExerciseDetector from './UniversalExerciseDetector';
import { getEjercicioById } from '../../services/IA/ejerciciosDataset';
import { speak } from '../../services/IA/poseDetectionConfig';

export default function EjercicioDetector() {
    const { id } = useParams();
    const navigate = useNavigate();
    const exerciseId = parseInt(id);

    const [exercise, setExercise] = useState(null);
    const [enableVoice, setEnableVoice] = useState(true);
    const [showCamera, setShowCamera] = useState(true);
    const [isActive, setIsActive] = useState(false);
    const [repCount, setRepCount] = useState(0);
    const [timer, setTimer] = useState(0);
    const [sessionStats, setSessionStats] = useState({
        correctPoses: 0,
        totalPoses: 0,
    });

    useEffect(() => {
        const ex = getEjercicioById(exerciseId);
        if (ex) {
            setExercise(ex);
        } else {
            navigate('/ejercicios/categoria');
        }
    }, [exerciseId, navigate]);

    // Timer
    useEffect(() => {
        let interval = null;
        if (isActive) {
            interval = setInterval(() => {
                setTimer(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isActive]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleRepComplete = (count) => {
        setRepCount(count);
    };

    const handlePoseAnalysis = (analysis) => {
        setSessionStats(prev => ({
            correctPoses: prev.correctPoses + (analysis.isCorrect ? 1 : 0),
            totalPoses: prev.totalPoses + 1,
        }));
    };

    const handleStart = () => {
        setIsActive(true);
        if (enableVoice) {
            speak('¡Comenzamos! Realiza el ejercicio', true);
        }
    };

    const handlePause = () => {
        setIsActive(false);
        if (enableVoice) {
            speak('Ejercicio pausado', true);
        }
    };

    const handleReset = () => {
        setIsActive(false);
        setRepCount(0);
        setTimer(0);
        setSessionStats({ correctPoses: 0, totalPoses: 0 });
    };

    if (!exercise) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const accuracy = sessionStats.totalPoses > 0
        ? Math.round((sessionStats.correctPoses / sessionStats.totalPoses) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Header */}
            <div className="bg-black/30 backdrop-blur-md border-b border-white/10 px-4 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-white hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Volver</span>
                    </button>

                    <h1 className="text-white font-bold text-lg">{exercise.nombre}</h1>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setEnableVoice(!enableVoice)}
                            className={`p-2 rounded-lg transition-colors ${enableVoice ? 'bg-green-600' : 'bg-gray-600'}`}
                            title={enableVoice ? 'Desactivar voz' : 'Activar voz'}
                        >
                            {enableVoice ? <Volume2 className="w-5 h-5 text-white" /> : <VolumeX className="w-5 h-5 text-white" />}
                        </button>
                        <button
                            onClick={() => setShowCamera(!showCamera)}
                            className={`p-2 rounded-lg transition-colors ${showCamera ? 'bg-blue-600' : 'bg-gray-600'}`}
                            title={showCamera ? 'Ocultar cámara' : 'Mostrar cámara'}
                        >
                            {showCamera ? <Camera className="w-5 h-5 text-white" /> : <CameraOff className="w-5 h-5 text-white" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-4">
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Panel principal - Cámara */}
                    <div className="lg:col-span-2">
                        {showCamera ? (
                            <UniversalExerciseDetector
                                exerciseId={exerciseId}
                                onRepComplete={handleRepComplete}
                                onPoseAnalysis={handlePoseAnalysis}
                                showCorrections={true}
                                enableVoice={enableVoice && isActive}
                            />
                        ) : (
                            <div className="bg-slate-800 rounded-xl p-8 text-center">
                                <img
                                    src={exercise.url}
                                    alt={exercise.nombre}
                                    className="max-w-full h-auto mx-auto rounded-lg mb-4"
                                    style={{ maxHeight: '400px' }}
                                />
                                <p className="text-gray-400">
                                    Cámara desactivada - Solo mostrando referencia del ejercicio
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Panel lateral - Stats y controles */}
                    <div className="space-y-4">
                        {/* Timer */}
                        <div className="bg-slate-800/80 backdrop-blur rounded-xl p-6 text-center">
                            <p className="text-gray-400 text-sm mb-2">Tiempo</p>
                            <p className="text-5xl font-mono font-bold text-white">{formatTime(timer)}</p>
                        </div>

                        {/* Repeticiones */}
                        <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-center">
                            <p className="text-blue-200 text-sm mb-2">Repeticiones</p>
                            <p className="text-6xl font-bold text-white">{repCount}</p>
                        </div>

                        {/* Precisión */}
                        <div className="bg-slate-800/80 backdrop-blur rounded-xl p-6">
                            <p className="text-gray-400 text-sm mb-2 text-center">Precisión de postura</p>
                            <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden">
                                <div
                                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${accuracy >= 80 ? 'bg-green-500' : accuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                        }`}
                                    style={{ width: `${accuracy}%` }}
                                />
                            </div>
                            <p className="text-center text-2xl font-bold text-white mt-2">{accuracy}%</p>
                        </div>

                        {/* Controles */}
                        <div className="flex gap-3">
                            {!isActive ? (
                                <button
                                    onClick={handleStart}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Play className="w-6 h-6" />
                                    Iniciar
                                </button>
                            ) : (
                                <button
                                    onClick={handlePause}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Pause className="w-6 h-6" />
                                    Pausar
                                </button>
                            )}
                            <button
                                onClick={handleReset}
                                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-4 rounded-xl transition-colors"
                                title="Reiniciar"
                            >
                                <RotateCcw className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Info del ejercicio */}
                        <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4">
                            <h3 className="text-white font-semibold mb-2">{exercise.nombre}</h3>
                            <div className="flex items-center gap-2">
                                <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">{exercise.tipo}</span>
                                <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded">{exercise.musculo}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
