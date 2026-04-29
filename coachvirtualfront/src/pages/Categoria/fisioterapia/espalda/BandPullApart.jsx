import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * Vista de rutina de Band Pull-Apart
 * Objetivo: Fortalecer la parte superior de la espalda y los hombros.
 * Movimiento: Brazos extendidos al frente -> Abrir brazos hacia los lados (abducción horizontal) -> Volver.
 */
export default function BandPullApart() {
  const [started, setStarted] = useState(false)
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || 'Band Pull-Apart'

  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('start') // 'start', 'pulling', 'hold', 'return'
  const [feedback, setFeedback] = useState('Extiende los brazos al frente')

  // Ángulos para monitoreo
  const [currentAngles, setCurrentAngles] = useState({
    rightShoulder: 0,
    leftShoulder: 0,
    rightElbow: 0,
    leftElbow: 0,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })
  const lastRepTimeRef = useRef(0)

  // Umbrales
  // Para simplificar, usaremos el ángulo del hombro en el plano frontal (aunque el movimiento es horizontal).
  // En 2D, cuando los brazos están al frente (hacia la cámara), el ángulo hombro-codo-muñeca es difícil de medir profundidad.
  // Usaremos la posición relativa X de las muñecas respecto a los hombros.
  // Start: Muñecas cerca del centro (distancia entre muñecas pequeña).
  // Pull: Muñecas lejos del centro (distancia entre muñecas grande).

  // Alternativamente, ángulo del hombro (Codo-Hombro-Cadera).
  // Brazos abajo = 0-20. Brazos en cruz = 90. Brazos arriba = 180.
  // Band Pull Apart se hace con brazos a 90 grados (horizontal).

  const SHOULDER_LEVEL_MIN = 70
  const SHOULDER_LEVEL_MAX = 110
  const ELBOW_STRAIGHT_MIN = 140

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)
    const { rightShoulder, leftShoulder, rightElbow, leftElbow } = angles

    setCurrentAngles({
      rightShoulder: Math.round(rightShoulder),
      leftShoulder: Math.round(leftShoulder),
      rightElbow: Math.round(rightElbow),
      leftElbow: Math.round(leftElbow),
    })

    // Lógica basada en landmarks directos para detectar apertura
    // Landmarks: 11 (hombro izq), 12 (hombro der), 15 (muñeca izq), 16 (muñeca der)
    const leftWrist = landmarks[15]
    const rightWrist = landmarks[16]
    const leftShoulderPt = landmarks[11]
    const rightShoulderPt = landmarks[12]

    if (!leftWrist || !rightWrist || !leftShoulderPt || !rightShoulderPt) return

    // Distancia horizontal normalizada por ancho de hombros
    const shoulderWidth = Math.abs(rightShoulderPt.x - leftShoulderPt.x)
    const wristDistance = Math.abs(rightWrist.x - leftWrist.x)
    const expansionRatio = wristDistance / shoulderWidth

    // Validar que los brazos estén levantados (nivel hombro) y codos estirados
    const armsLevel =
      rightShoulder > SHOULDER_LEVEL_MIN &&
      rightShoulder < SHOULDER_LEVEL_MAX &&
      leftShoulder > SHOULDER_LEVEL_MIN &&
      leftShoulder < SHOULDER_LEVEL_MAX

    const armsStraight = rightElbow > ELBOW_STRAIGHT_MIN && leftElbow > ELBOW_STRAIGHT_MIN

    const now = Date.now()

    // Máquina de estados
    if (stage === 'start' || stage === 'return') {
      // Esperamos brazos al frente (ratio bajo) y nivelados
      if (armsLevel && armsStraight) {
        if (expansionRatio < 1.5) {
          // Brazos al frente
          setFeedback('Abre los brazos separando la banda')
          if (stage !== 'start') setStage('start')
        } else if (expansionRatio > 2.5) {
          // Ya está abierto
          setStage('pulling')
        }
      } else {
        if (!armsLevel) setFeedback('Levanta los brazos a la altura de los hombros')
        else if (!armsStraight) setFeedback('Estira los codos')
      }
    } else if (stage === 'pulling') {
      if (armsLevel && armsStraight) {
        if (expansionRatio > 2.8) {
          // Completamente abierto
          setStage('hold')
          setFeedback('¡Mantén un segundo!')
          speak('Bien')
          lastRepTimeRef.current = now
        } else if (expansionRatio < 1.5) {
          // Regresó sin completar
          setStage('start')
          setFeedback('Abre más los brazos')
        }
      } else {
        setFeedback('Mantén los brazos rectos y a nivel')
      }
    } else if (stage === 'hold') {
      // Pequeña pausa para validar la repetición
      if (now - lastRepTimeRef.current > 500) {
        // 0.5s hold
        setRepCount((c) => c + 1)
        setStage('return')
        setFeedback('Regresa lentamente al frente')
        speak('Regresa')
      }
    }
  }

  const getAngleColor = (val, target, isMin = true) => {
    // Simple visual helper
    return 'text-blue-600'
  }

  const highlightedAngles = useMemo(() => {
    // Visualizar brazos
    return [
      { indices: [12, 14, 16], angle: currentAngles.rightElbow, isValid: true },
      { indices: [11, 13, 15], angle: currentAngles.leftElbow, isValid: true },
    ]
  }, [currentAngles])

  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-gray-800">{passedNombre}</h1>
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-64 bg-blue-50 flex items-center justify-center">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-8xl">🎗️</div>
              )}
            </div>
            <div className="p-8">
              <h2 className="text-xl font-semibold mb-3">Instrucciones</h2>
              <ul className="list-disc pl-5 text-gray-600 space-y-2 mb-6">
                <li>Sostén la banda elástica con ambas manos al frente.</li>
                <li>Mantén los brazos estirados a la altura de los hombros.</li>
                <li>Separa los brazos horizontalmente hasta que la banda toque tu pecho.</li>
                <li>Regresa lentamente a la posición inicial.</li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg transition-colors text-lg shadow-md"
              >
                Iniciar Rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-blue-900">{passedNombre}</h2>
          <button
            onClick={() => setStarted(false)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            &larr; Volver
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Cámara */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden border-4 border-white relative">
              <YogaPoseDetector
                onPoseDetected={handlePoseDetected}
                highlightedAngles={highlightedAngles}
              />
            </div>

            <div className="mt-4 bg-white rounded-xl shadow p-4">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Métricas en tiempo real
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Hombros (Nivel)</div>
                  <div className="text-xl font-bold text-blue-600">
                    {currentAngles.rightShoulder}°
                  </div>
                  <div className="text-xs text-gray-400">Meta: 70° - 110°</div>
                </div>
                <div className="p-2 bg-gray-50 rounded">
                  <div className="text-xs text-gray-500">Codos (Estirados)</div>
                  <div className="text-xl font-bold text-blue-600">{currentAngles.rightElbow}°</div>
                  <div className="text-xs text-gray-400">Meta: &gt;140°</div>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Feedback */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6 text-center">
              <h3 className="text-gray-500 font-medium mb-2">Repeticiones</h3>
              <div className="text-6xl font-extrabold text-blue-600">{repCount}</div>
            </div>

            <div
              className={`rounded-xl shadow-lg p-6 text-center transition-colors duration-300 ${stage === 'hold' ? 'bg-green-100 border-2 border-green-400' : 'bg-white'}`}
            >
              <h3 className="text-gray-500 font-medium mb-2">Instrucción IA</h3>
              <div className="text-2xl font-bold text-gray-800">{feedback}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
