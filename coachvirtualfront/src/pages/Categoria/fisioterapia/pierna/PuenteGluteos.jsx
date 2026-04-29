import { useState, useRef, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector'
import { calculateBodyAngles } from '../../../../utils/poseUtils'
import { useSpeech } from '../../../../utils/useSpeech'

/**
 * Vista de Elevación de Glúteos (Glute Bridge)
 * Enfoque Clínico:
 * 1. Extensión de Cadera Neutra: Buscar los 180° (Hombro-Cadera-Rodilla).
 * 2. Control Lumbar: Evitar ángulos > 185° (Hiperextensión/Arqueo).
 * 3. Fase Isométrica: Mantener la elevación para activación neuromuscular.
 */
export default function PuenteGluteos() {
  // --- UI STATE ---
  const [started, setStarted] = useState(false)
  const location = useLocation()
  const passedImage = location?.state?.imageUrl || null
  const passedNombre = location?.state?.nombre || 'Puente de glúteos'

  // --- THERAPY STATE ---
  const [repCount, setRepCount] = useState(0)
  const [stage, setStage] = useState('down') // 'down', 'lifting', 'bridge_hold', 'lowering'
  const [feedback, setFeedback] = useState('Túmbate boca arriba, rodillas dobladas')
  const [metrics, setMetrics] = useState({
    hipAngle: 130, // Ángulo de extensión (180 es plano)
    isHyperextended: false,
    isTargetReached: false,
  })

  const { speak } = useSpeech({ lang: 'es-ES' })

  // Refs
  const hipHistoryRef = useRef([])
  const holdStartRef = useRef(null)
  const archWarnRef = useRef(false)

  // --- UMBRALES CLÍNICOS ---
  const DOWN_ANGLE = 145 // Caderas en el suelo (flexionadas)
  const TARGET_ANGLE = 170 // Meta: Línea casi recta
  const HYPER_EXTENSION = 185 // Peligro lumbar

  const HOLD_TIME_MS = 2000 // 2 segundos de pausa arriba
  const SMOOTH_WINDOW = 6

  const handlePoseDetected = (landmarks) => {
    const angles = calculateBodyAngles(landmarks)

    // Usamos el lado visible (asumiendo perfil).
    // Ángulo Hombro-Cadera-Rodilla (180 = Recto, <180 = Flexionado)
    // poseUtils suele devolver rightHip como el ángulo de la articulación.
    // Necesitamos asegurar que estamos midiendo la extensión.
    const rawHip = (angles.rightHip + angles.leftHip) / 2

    // 1. Suavizado
    const updateHistory = (val) => {
      hipHistoryRef.current.push(val)
      if (hipHistoryRef.current.length > SMOOTH_WINDOW) hipHistoryRef.current.shift()
      return hipHistoryRef.current.reduce((a, b) => a + b, 0) / hipHistoryRef.current.length
    }
    const smoothHip = Math.round(updateHistory(rawHip))

    // 2. Detección de Hiperextensión (Trampa Lumbar)
    let isHyperextended = false
    if (smoothHip > HYPER_EXTENSION) {
      isHyperextended = true
      if (!archWarnRef.current) {
        setFeedback('⚠️ ¡No arquees la espalda! Baja las costillas.')
        speak('Baja las costillas')
        archWarnRef.current = true
      }
    } else {
      if (archWarnRef.current) {
        archWarnRef.current = false
        setFeedback('✅ Columna neutra.')
      }
    }

    setMetrics({
      hipAngle: smoothHip,
      isHyperextended,
      isTargetReached: smoothHip >= TARGET_ANGLE && !isHyperextended,
    })

    // 3. Máquina de Estados
    const now = Date.now()

    if (stage === 'down' || stage === 'lowering') {
      // Iniciar subida
      if (smoothHip > DOWN_ANGLE + 10) {
        setStage('lifting')
        setFeedback('Sube la pelvis apretando glúteos...')
        holdStartRef.current = null
      }
    } else if (stage === 'lifting') {
      // Llegar a la meta
      if (smoothHip >= TARGET_ANGLE && !isHyperextended) {
        if (!holdStartRef.current) {
          holdStartRef.current = now
        } else if (now - holdStartRef.current >= HOLD_TIME_MS) {
          setStage('bridge_hold')
          setFeedback('🍑 Sostén arriba... Aprieta.')
          speak('Aprieta')
          holdStartRef.current = null
        }
      }
    } else if (stage === 'bridge_hold') {
      if (!holdStartRef.current) holdStartRef.current = now
      if (now - holdStartRef.current >= 1000) {
        // 1 seg extra de confirmación
        setStage('lowering')
        setFeedback('Baja vértebra a vértebra.')
        holdStartRef.current = null
      }
    } else if (stage === 'lowering') {
      // Vuelta al suelo
      if (smoothHip < DOWN_ANGLE) {
        if (!holdStartRef.current) {
          holdStartRef.current = now
        } else if (now - holdStartRef.current >= 500) {
          setRepCount((c) => c + 1)
          setFeedback('✅ Descansa.')
          speak((repCount + 1).toString())
          setStage('down')
          holdStartRef.current = null
        }
      }
    }
  }

  // --- VISTA PREVIA ---
  if (!started) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">{passedNombre}</h1>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="h-64 bg-indigo-50 flex items-center justify-center relative">
              {passedImage ? (
                <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover" />
              ) : (
                <div className="text-7xl">🍑⬆️</div>
              )}
              <div className="absolute bottom-4 left-0 right-0 text-center">
                <span className="bg-white/90 px-4 py-1 rounded-full text-xs font-bold text-indigo-600 shadow-sm">
                  Activación de Glúteo Mayor
                </span>
              </div>
            </div>
            <div className="p-8">
              <h3 className="text-lg font-semibold text-slate-700 mb-3">Instrucciones Clínicas:</h3>
              <ul className="list-disc pl-5 text-slate-600 mb-8 space-y-2 text-sm">
                <li>Túmbate boca arriba con las rodillas dobladas.</li>
                <li>Eleva la pelvis hasta formar una línea recta rodilla-cadera-hombro.</li>
                <li>
                  <strong>No empujes con la espalda baja</strong>, usa los glúteos.
                </li>
                <li>Sostén arriba 2 segundos.</li>
              </ul>
              <button
                onClick={() => setStarted(true)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-indigo-200"
              >
                Iniciar Terapia
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- VISTA TERAPIA ---
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800">{passedNombre}</h2>
            <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded font-medium">
              Estabilidad Lumbopélvica
            </span>
          </div>
          <button
            onClick={() => setStarted(false)}
            className="text-sm text-slate-500 hover:text-slate-800 underline"
          >
            Salir
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CÁMARA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
              <YogaPoseDetector onPoseDetected={handlePoseDetected} />

              {/* Alerta de Hiperextensión */}
              {metrics.isHyperextended && (
                <div className="absolute inset-0 flex items-center justify-center bg-amber-500/20 pointer-events-none animate-pulse">
                  <div className="bg-amber-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg border-2 border-white">
                    📉 CUIDADO LUMBAR
                  </div>
                </div>
              )}

              {/* Indicador de Ángulo */}
              <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur px-3 py-2 rounded-lg border shadow-sm text-right">
                <div className="text-[10px] uppercase font-bold text-slate-500">Ángulo Cadera</div>
                <div
                  className={`text-2xl font-mono font-bold ${metrics.isTargetReached ? 'text-green-600' : 'text-indigo-600'}`}
                >
                  {metrics.hipAngle}°
                </div>
                <div className="text-[10px] text-slate-400">Meta: 170°-180°</div>
              </div>
            </div>
          </div>

          {/* PANEL LATERAL */}
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-blue-500 text-center">
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-2">
                Repeticiones
              </h3>
              <div className="text-6xl font-medium text-slate-800">{repCount}</div>
              <div className="mt-4">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold text-white transition-colors
                            ${stage === 'bridge_hold' ? 'bg-green-500' : 'bg-slate-300 text-slate-600'}`}
                >
                  {stage === 'bridge_hold' ? 'CONTRAYENDO' : 'MOVIENDO'}
                </span>
              </div>
            </div>

            <div
              className={`p-5 rounded-xl border transition-colors duration-300 flex gap-4 items-start
                    ${
                      feedback.includes('⚠️')
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : feedback.includes('🍑')
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-white border-slate-200 text-slate-600'
                    }`}
            >
              <div className="text-2xl mt-1">
                {feedback.includes('⚠️') ? '📐' : feedback.includes('🍑') ? '🔥' : 'ℹ️'}
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">Fisioterapeuta IA</h4>
                <p className="text-sm leading-relaxed">{feedback}</p>
              </div>
            </div>

            {/* Gráfico de Puente */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center">
              <h4 className="font-bold text-slate-700 mb-4 text-sm">Alineación de Cadera</h4>
              <div className="relative h-32 w-48">
                {/* Fondo Curva Ideal */}
                <svg
                  className="absolute inset-0 w-full h-full overflow-visible"
                  viewBox="0 0 100 50"
                >
                  {/* Suelo */}
                  <line x1="0" y1="50" x2="100" y2="50" stroke="#cbd5e1" strokeWidth="2" />

                  {/* Cuerpo (Línea dinámica) */}
                  {/* Representamos el cuerpo como una línea que pivota desde los hombros (izquierda) */}
                  <line
                    x1="10"
                    y1="50"
                    x2="90"
                    y2={50 - (metrics.hipAngle - 130) * 0.8}
                    stroke={
                      metrics.isHyperextended
                        ? '#ef4444'
                        : metrics.isTargetReached
                          ? '#22c55e'
                          : '#6366f1'
                    }
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="transition-all duration-300 ease-out"
                  />

                  {/* Meta (Línea punteada a 180 grados visuales) */}
                  <line
                    x1="10"
                    y1="50"
                    x2="90"
                    y2="10"
                    stroke="#94a3b8"
                    strokeWidth="1"
                    strokeDasharray="4"
                  />
                </svg>
              </div>
              <div className="flex justify-between w-full text-[10px] text-slate-400 px-4">
                <span>Suelo</span>
                <span>Puente (Meta)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
