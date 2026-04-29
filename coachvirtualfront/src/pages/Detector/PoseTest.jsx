import { useState, useRef, useEffect } from 'react';
import PoseDetector from './PoseDetector';
import { fetchGroqCompletion } from '../../services/IA/groqClient';
import { useSpeech } from '../../utils/useSpeech';
import { calculateBodyAngles } from '../../utils/poseUtils';
import { savePoseTrainingData } from '../../services/poseTrainingApi';

export default function PoseTest() {
  const [poseData, setPoseData] = useState(null);
  const [currentLandmarks, setCurrentLandmarks] = useState(null);
  const [aiResponse, setAiResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  
  // Estados para modo entrenamiento
  const [trainingMode, setTrainingMode] = useState(false);
  const [ejercicioActual, setEjercicioActual] = useState('flexion');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // Estados para grabación continua
  const [isRecording, setIsRecording] = useState(false);
  const [recordedFrames, setRecordedFrames] = useState([]);
  const [recordingDuration, setRecordingDuration] = useState(10); // segundos
  const [recordingTimer, setRecordingTimer] = useState(0);
  const recordingInterval = useRef(null);
  const recordingFrames = useRef([]);
  
  const lastAnalysisTime = useRef(0);
  const analysisInterval = 10000; 
  
  const { supported, speaking, speak, stop } = useSpeech({ lang: 'es-ES', rate: 1 });

  // Limpiar interval al desmontar
  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
    };
  }, []);

  // Función para describir la pose actual
  const describePose = (landmarks) => {
    const nose = landmarks[0];
    const leftWrist = landmarks[15];
    const rightWrist = landmarks[16];
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    
    let description = 'Posición actual: ';
    
    // Detectar si las manos están levantadas
    if (leftWrist.y < leftShoulder.y && rightWrist.y < rightShoulder.y) {
      description += 'Ambas manos levantadas por encima de los hombros. ';
    } else if (leftWrist.y < leftShoulder.y) {
      description += 'Mano izquierda levantada. ';
    } else if (rightWrist.y < rightShoulder.y) {
      description += 'Mano derecha levantada. ';
    } else {
      description += 'Manos abajo. ';
    }
    
    return description;
  };

  const handlePoseDetected = (landmarks) => {
    // Guardar landmarks completos para el modo entrenamiento
    setCurrentLandmarks(landmarks);
    
    // Si está grabando, añadir frame a la secuencia
    if (isRecording) {
      const frameData = {
        timestamp: Date.now(),
        landmarks: landmarks.map(l => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility
        })),
        angulos: calculateBodyAngles(landmarks)
      };
      recordingFrames.current.push(frameData);
    }
    
    // Update pose data (only show first few landmarks to avoid clutter)
    setPoseData({
      nose: landmarks[0],
      leftShoulder: landmarks[11],
      rightShoulder: landmarks[12],
      leftElbow: landmarks[13],
      rightElbow: landmarks[14],
      leftWrist: landmarks[15],
      rightWrist: landmarks[16],
    });

    // Auto-análisis con IA cada X segundos
    if (autoAnalyze) {
      const now = Date.now();
      if (now - lastAnalysisTime.current > analysisInterval) {
        lastAnalysisTime.current = now;
        analyzePoseWithAI(landmarks);
      }
    }
  };

  const analyzePoseWithAI = async (landmarks) => {
    if (isAnalyzing) return;
    
    setIsAnalyzing(true);
    try {
      const description = describePose(landmarks);
      const prompt = `Eres un entrenador personal. Describe brevemente y de manera motivadora lo que está haciendo la persona según estos datos: ${description}. Responde en máximo 2 oraciones cortas y con tono amigable.`;
      
      const response = await fetchGroqCompletion({ 
        prompt, 
        model: 'llama-3.1-8b-instant' 
      });
      
      setAiResponse(response);
      if (supported) {
        speak(response);
      }
    } catch (error) {
      console.error('Error al analizar pose:', error);
      setAiResponse('Error al analizar la pose');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualAnalysis = () => {
    if (currentLandmarks) {
      analyzePoseWithAI(currentLandmarks);
    }
  };

  // Función para guardar datos de entrenamiento (snapshot individual)
  const handleSaveTrainingData = async (etiqueta) => {
    if (!currentLandmarks) {
      setSaveMessage('❌ No hay datos de pose para guardar');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Calcular ángulos
      const angulos = calculateBodyAngles(currentLandmarks);

      // Preparar datos
      const trainingData = {
        ejercicio: ejercicioActual,
        landmarks: currentLandmarks.map(l => ({
          x: l.x,
          y: l.y,
          z: l.z,
          visibility: l.visibility
        })),
        angulos: angulos,
        etiqueta: etiqueta
      };

      // Guardar en backend
      await savePoseTrainingData(trainingData);
      
      setSaveMessage(`✅ Dato guardado como "${etiqueta}"`);
      
      // Opcional: dar feedback por voz
      if (supported) {
        speak(`Dato guardado como ${etiqueta}`);
      }

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error al guardar:', error);
      setSaveMessage('❌ Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Funciones para grabación continua
  const startRecording = () => {
    if (!currentLandmarks) {
      setSaveMessage('❌ Espera a que se detecte tu pose primero');
      return;
    }

    recordingFrames.current = [];
    setRecordedFrames([]);
    setIsRecording(true);
    setRecordingTimer(recordingDuration);
    setSaveMessage('');

    if (supported) {
      speak(`Comenzando grabación de ${recordingDuration} segundos`);
    }

    let secondsLeft = recordingDuration;
    recordingInterval.current = setInterval(() => {
      secondsLeft--;
      setRecordingTimer(secondsLeft);

      if (secondsLeft <= 0) {
        stopRecording();
      } else if (secondsLeft <= 3 && supported) {
        speak(secondsLeft.toString());
      }
    }, 1000);
  };

  const stopRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    
    setIsRecording(false);
    setRecordingTimer(0);
    
    const frames = recordingFrames.current;
    setRecordedFrames(frames);
    
    if (supported) {
      speak(`Grabación completada. ${frames.length} frames capturados`);
    }

    setSaveMessage(`📹 Grabación completada: ${frames.length} frames. Ahora selecciona la etiqueta para guardar.`);
  };

  const saveRecordedSequence = async (etiqueta) => {
    if (recordedFrames.length === 0) {
      setSaveMessage('❌ No hay secuencia grabada para guardar');
      return;
    }

    setIsSaving(true);
    setSaveMessage('');

    try {
      // Preparar datos de la secuencia
      const sequenceData = {
        ejercicio: ejercicioActual,
        etiqueta: etiqueta,
        tipo: 'secuencia',
        frames: recordedFrames,
        duracion_segundos: recordingDuration,
        fps: recordedFrames.length / recordingDuration,
        total_frames: recordedFrames.length
      };

      // Guardar en backend
      await savePoseTrainingData(sequenceData);
      
      setSaveMessage(`✅ Secuencia de ${recordedFrames.length} frames guardada como "${etiqueta}"`);
      
      if (supported) {
        speak(`Secuencia guardada correctamente`);
      }

      // Limpiar
      setRecordedFrames([]);
      recordingFrames.current = [];

      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error al guardar secuencia:', error);
      setSaveMessage('❌ Error al guardar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelRecording = () => {
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
    }
    setIsRecording(false);
    setRecordingTimer(0);
    setRecordedFrames([]);
    recordingFrames.current = [];
    setSaveMessage('🚫 Grabación cancelada');
    setTimeout(() => setSaveMessage(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🤖 Detección de Poses con IA</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Camera view */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <PoseDetector onPoseDetected={handlePoseDetected} />
            </div>
          </div>

          {/* Control and data panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Modo Entrenamiento */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎯 Modo Entrenamiento</h2>
              
              {/* Toggle modo entrenamiento */}
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="trainingMode"
                  checked={trainingMode} 
                  onChange={e => setTrainingMode(e.target.checked)} 
                  className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="trainingMode" className="ml-3 text-sm font-medium text-gray-700">
                  Activar modo entrenamiento
                </label>
              </div>

              {trainingMode && (
                <>
                  {/* Selector de ejercicio */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ejercicio:
                    </label>
                    <select 
                      value={ejercicioActual} 
                      onChange={e => setEjercicioActual(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="flexion">Flexión</option>
                      <option value="sentadilla">Sentadilla</option>
                      <option value="plancha">Plancha</option>
                      <option value="curl_biceps">Curl de Bíceps</option>
                      <option value="press_hombros">Press de Hombros</option>
                    </select>
                  </div>

                  {/* MODO 1: Captura de Snapshot Individual */}
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-sm mb-3 text-gray-700">📸 Modo Snapshot</h3>
                    <div className="space-y-2">
                      <button 
                        onClick={() => handleSaveTrainingData('correcto')}
                        disabled={isSaving || !currentLandmarks || isRecording}
                        className="w-full bg-green-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        ✅ Guardar pose CORRECTA
                      </button>

                      <button 
                        onClick={() => handleSaveTrainingData('incorrecto')}
                        disabled={isSaving || !currentLandmarks || isRecording}
                        className="w-full bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        ❌ Guardar pose INCORRECTA
                      </button>
                    </div>
                  </div>

                  {/* MODO 2: Grabación de Secuencia Continua */}
                  <div className="mb-4 p-4 border-2 border-purple-300 rounded-lg bg-purple-50">
                    <h3 className="font-semibold text-sm mb-3 text-purple-900">🎬 Modo Secuencia (Recomendado)</h3>
                    
                    {/* Configuración de duración */}
                    <div className="mb-3">
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Duración de grabación (segundos):
                      </label>
                      <input 
                        type="number" 
                        min="5" 
                        max="30" 
                        value={recordingDuration}
                        onChange={e => setRecordingDuration(parseInt(e.target.value) || 10)}
                        disabled={isRecording}
                        className="w-full px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Recomendado: 10-15s para 1-2 repeticiones</p>
                    </div>

                    {/* Estado de grabación */}
                    {isRecording && (
                      <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg text-center animate-pulse">
                        <div className="text-2xl font-bold text-red-600">🔴 GRABANDO</div>
                        <div className="text-3xl font-mono font-bold text-red-700 mt-1">{recordingTimer}s</div>
                        <div className="text-xs text-red-600 mt-1">
                          {recordingFrames.current.length} frames capturados
                        </div>
                      </div>
                    )}

                    {recordedFrames.length > 0 && !isRecording && (
                      <div className="mb-3 p-3 bg-green-100 border border-green-300 rounded-lg">
                        <div className="text-sm font-semibold text-green-800">
                          ✅ Secuencia lista para guardar
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          {recordedFrames.length} frames • {(recordedFrames.length / recordingDuration).toFixed(1)} FPS
                        </div>
                      </div>
                    )}

                    {/* Botones de control */}
                    {!isRecording && recordedFrames.length === 0 && (
                      <button 
                        onClick={startRecording}
                        disabled={!currentLandmarks || isSaving}
                        className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center"
                      >
                        🎬 Iniciar Grabación
                      </button>
                    )}

                    {isRecording && (
                      <button 
                        onClick={cancelRecording}
                        className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 text-sm"
                      >
                        ⏹️ Cancelar
                      </button>
                    )}

                    {recordedFrames.length > 0 && !isRecording && (
                      <div className="space-y-2">
                        <button 
                          onClick={() => saveRecordedSequence('correcto')}
                          disabled={isSaving}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 text-sm"
                        >
                          {isSaving ? '⏳ Guardando...' : '✅ Guardar como CORRECTO'}
                        </button>
                        <button 
                          onClick={() => saveRecordedSequence('incorrecto')}
                          disabled={isSaving}
                          className="w-full bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 text-sm"
                        >
                          {isSaving ? '⏳ Guardando...' : '❌ Guardar como INCORRECTO'}
                        </button>
                        <button 
                          onClick={() => {
                            setRecordedFrames([]);
                            recordingFrames.current = [];
                            setSaveMessage('');
                          }}
                          disabled={isSaving}
                          className="w-full bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500 text-sm"
                        >
                          🗑️ Descartar y grabar de nuevo
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mensaje de guardado */}
                  {saveMessage && (
                    <div className={`mt-4 p-3 rounded-lg text-sm ${
                      saveMessage.includes('✅') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      {saveMessage}
                    </div>
                  )}

                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                    <p className="font-semibold mb-1">💡 Cómo usar:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Snapshot:</strong> Captura una sola pose estática</li>
                      <li><strong>Secuencia:</strong> Graba todo el recorrido del ejercicio (1-2 reps)</li>
                    </ul>
                    <p className="mt-2 font-semibold">📊 Para entrenar ML, usa el modo Secuencia para capturar el movimiento completo.</p>
                  </div>
                </>
              )}
            </div>

            {/* Controles de IA */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">🎙️ Asistente IA</h2>
              
              {/* Toggle auto-análisis */}
              <div className="flex items-center mb-4">
                <input 
                  type="checkbox" 
                  id="autoAnalyze"
                  checked={autoAnalyze} 
                  onChange={e => setAutoAnalyze(e.target.checked)} 
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="autoAnalyze" className="ml-3 text-sm font-medium text-gray-700">
                  Análisis automático (cada 5s)
                </label>
              </div>

              {/* Botón de análisis manual */}
              <button 
                onClick={handleManualAnalysis}
                disabled={isAnalyzing || !poseData}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Analizando...
                  </>
                ) : (
                  <>
                    <span className="mr-2">✨</span>
                    Analizar ahora
                  </>
                )}
              </button>

              {/* Botón detener voz */}
              {speaking && (
                <button 
                  onClick={stop}
                  className="w-full mt-3 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                >
                  <span className="mr-2">⏹️</span>
                  Detener voz
                </button>
              )}

              {/* Respuesta de la IA */}
              {aiResponse && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <span className="text-blue-500 mr-2 text-xl">🤖</span>
                    <div className="flex-1">
                      <p className="text-sm text-blue-900 font-medium">Asistente:</p>
                      <p className="text-sm text-blue-800 mt-1">{aiResponse}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pose data display */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">📊 Datos de Pose</h2>
              {poseData ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <strong>Nariz:</strong>
                    <div className="ml-2 text-gray-600">
                      x: {poseData.nose.x.toFixed(3)}<br />
                      y: {poseData.nose.y.toFixed(3)}<br />
                      z: {poseData.nose.z.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <strong>Muñeca Izq:</strong>
                    <div className="ml-2 text-gray-600">
                      y: {poseData.leftWrist.y.toFixed(3)}
                    </div>
                  </div>
                  <div>
                    <strong>Muñeca Der:</strong>
                    <div className="ml-2 text-gray-600">
                      y: {poseData.rightWrist.y.toFixed(3)}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Esperando detección...</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Instrucciones:</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>Permita el acceso a la cámara cuando se solicite</li>
            <li>Colóquese frente a la cámara con buena iluminación</li>
            <li>Activa el análisis automático o presiona "Analizar ahora" manualmente</li>
            <li>El asistente describirá tu postura y te dará retroalimentación por voz</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
