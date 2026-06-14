import { useEffect, useRef, useState, useCallback } from 'react'
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Zap } from 'lucide-react'
import {
  getPoseLandmarker,
  isMediaPipePreloaded,
  preloadMediaPipe,
} from '../../services/IA/mediaPipePreloader'

export default function YogaPoseDetector({
  onPoseDetected,
  highlightedAngles = [],
  isCalibrated = false,
  onCalibrationComplete,
  showSkeleton = true,
}) {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const [error, setError] = useState(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [modelReady, setModelReady] = useState(false)
  const poseLandmarkerRef = useRef(null)
  const animationFrameRef = useRef(null)
  const streamRef = useRef(null)
  const onPoseDetectedRef = useRef(onPoseDetected)
  const highlightedAnglesRef = useRef(highlightedAngles)
  const smoothedLandmarksRef = useRef(null)
  const isMountedRef = useRef(true)

  // Estados para calibración (HU-11)
  const [lightStatus, setLightStatus] = useState('OK')
  const [framingStatus, setFramingStatus] = useState('NO_BODY')
  const [countdown, setCountdown] = useState(3)

  // Refs de calibración para requestAnimationFrame
  const lightStatusRef = useRef('OK')
  const framingStatusRef = useRef('NO_BODY')
  const frameCountRef = useRef(0)
  const brightnessCanvasRef = useRef(null)
  const countdownRef = useRef(3)
  const calibrationStartTimeRef = useRef(null)

  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected
    highlightedAnglesRef.current = highlightedAngles
  }, [onPoseDetected, highlightedAngles])

  // Suavizado de landmarks
  const smoothLandmarks = useCallback((newLandmarks, smoothingFactor = 0.2) => {
    if (!smoothedLandmarksRef.current) {
      smoothedLandmarksRef.current = newLandmarks
      return newLandmarks
    }
    const smoothed = newLandmarks.map((landmark, idx) => {
      const prev = smoothedLandmarksRef.current[idx]
      if (!prev) return landmark
      return {
        x: prev.x * smoothingFactor + landmark.x * (1 - smoothingFactor),
        y: prev.y * smoothingFactor + landmark.y * (1 - smoothingFactor),
        z: prev.z * smoothingFactor + landmark.z * (1 - smoothingFactor),
        visibility: landmark.visibility,
      }
    })
    smoothedLandmarksRef.current = smoothed
    return smoothed
  }, [])

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    smoothedLandmarksRef.current = null
  }, [])

  // INICIALIZACIÓN PARALELA: Cámara y Modelo al mismo tiempo
  useEffect(() => {
    isMountedRef.current = true

    // 1. CARGAR CÁMARA (INMEDIATO)
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Navegador no soporta cámara')
        }

        const configs = [
          { width: 640, height: 480, facingMode: 'user' },
          { facingMode: 'user' },
          true,
        ]

        let stream = null
        for (const config of configs) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: config, audio: false })
            break
          } catch (e) {
            continue
          }
        }

        if (!stream) throw new Error('No se pudo acceder a la cámara')
        if (!isMountedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
            if (isMountedRef.current) setCameraReady(true)
          }
        }
      } catch (err) {
        if (isMountedRef.current) {
          if (err.name === 'NotAllowedError') {
            setError('Permite el acceso a la cámara')
          } else if (err.name === 'NotFoundError') {
            setError('No se encontró cámara')
          } else {
            setError('Error de cámara: ' + err.message)
          }
        }
      }
    }

    // 2. CARGAR MODELO (EN PARALELO)
    const initModel = async () => {
      try {
        let poseLandmarker

        if (isMediaPipePreloaded()) {
          console.log('⚡ MediaPipe precargado')
          poseLandmarker = await getPoseLandmarker()
        } else {
          console.log('📦 Cargando MediaPipe...')
          const result = await preloadMediaPipe()
          poseLandmarker = result.poseLandmarker
        }

        if (!isMountedRef.current) return
        poseLandmarkerRef.current = poseLandmarker
        setModelReady(true)
        console.log('✅ Modelo listo')
      } catch (err) {
        console.error('Error modelo:', err)
        // Fallback directo
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
          )
          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            numPoses: 1,
          })
          if (isMountedRef.current) setModelReady(true)
        } catch (e) {
          console.error('Fallback falló:', e)
        }
      }
    }

    Promise.all([initCamera(), initModel()])

    return () => {
      isMountedRef.current = false
      cleanup()
    }
  }, [cleanup])

  // DETECCIÓN: Comienza cuando AMBOS están listos
  useEffect(() => {
    if (!cameraReady || !modelReady) return
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')

    const detect = () => {
      if (!isMountedRef.current || !poseLandmarkerRef.current) return

      if (video.readyState >= 2) {
        canvas.width = video.videoWidth || 640
        canvas.height = video.videoHeight || 480

        try {
          const results = poseLandmarkerRef.current.detectForVideo(video, performance.now())
          ctx.clearRect(0, 0, canvas.width, canvas.height)

          if (results.landmarks?.[0]) {
            const landmarks = smoothLandmarks(results.landmarks[0])
            const w = canvas.width,
              h = canvas.height
            const points = landmarks.map((l) => ({
              x: l.x * w,
              y: l.y * h,
              z: l.z,
              visibility: l.visibility,
            }))

            // ===== HU-11: Calibración en tiempo real =====
            // 1. Evaluar brillo (Iluminación)
            if (frameCountRef.current % 15 === 0) {
              if (!brightnessCanvasRef.current) {
                brightnessCanvasRef.current = document.createElement('canvas')
                brightnessCanvasRef.current.width = 40
                brightnessCanvasRef.current.height = 30
              }
              const bCtx = brightnessCanvasRef.current.getContext('2d')
              bCtx.drawImage(video, 0, 0, 40, 30)
              const imgData = bCtx.getImageData(0, 0, 40, 30)
              const data = imgData.data
              let colorSum = 0
              for (let i = 0; i < data.length; i += 4) {
                colorSum += (data[i] + data[i + 1] + data[i + 2]) / 3
              }
              const brightnessVal = Math.floor(colorSum / (40 * 30))
              const statusVal = brightnessVal < 60 ? 'LOW' : brightnessVal > 220 ? 'HIGH' : 'OK'
              lightStatusRef.current = statusVal
              setLightStatus(statusVal)
            }
            frameCountRef.current++

            // 2. Evaluar encuadre (Hombros y Caderas son esenciales)
            const shouldersVisible = (landmarks[11]?.visibility > 0.55) && (landmarks[12]?.visibility > 0.55)
            const hipsVisible = (landmarks[23]?.visibility > 0.55) && (landmarks[24]?.visibility > 0.55)
            const kneesVisible = (landmarks[25]?.visibility > 0.55) && (landmarks[26]?.visibility > 0.55)
            const anklesVisible = (landmarks[27]?.visibility > 0.55) && (landmarks[28]?.visibility > 0.55)

            let framingVal = 'NO_BODY'
            if (shouldersVisible && hipsVisible) {
              if (kneesVisible && anklesVisible) {
                framingVal = 'FULL'
              } else {
                framingVal = 'UPPER'
              }
            }
            framingStatusRef.current = framingVal
            setFramingStatus(framingVal)

            // 3. Evaluar cuenta regresiva de calibración
            const isLightOK = lightStatusRef.current === 'OK'
            const isFramingOK = framingStatusRef.current !== 'NO_BODY'

            if (isLightOK && isFramingOK) {
              if (!calibrationStartTimeRef.current) {
                calibrationStartTimeRef.current = Date.now()
                countdownRef.current = 3
                setCountdown(3)
              } else {
                const elapsed = (Date.now() - calibrationStartTimeRef.current) / 1000
                const remaining = Math.max(0, Math.ceil(3 - elapsed))
                if (remaining !== countdownRef.current) {
                  countdownRef.current = remaining
                  setCountdown(remaining)
                }
                if (elapsed >= 3 && !isCalibrated) {
                  onCalibrationComplete?.()
                }
              }
            } else {
              calibrationStartTimeRef.current = null
              if (countdownRef.current !== 3) {
                countdownRef.current = 3
                setCountdown(3)
              }
            }

            // ===== HU-12: Mapeo de esqueleto interactivo =====
            const highlighted = highlightedAnglesRef.current || []

            // Función para dibujar líneas con brillo de neón
            const drawLine = (p1, p2, color = '#00FF88') => {
              if (!showSkeleton || !p1 || !p2) return
              ctx.beginPath()
              ctx.moveTo(p1.x, p1.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = color
              ctx.lineWidth = 6
              ctx.lineCap = 'round'
              
              // Efecto de neón
              ctx.shadowColor = color
              ctx.shadowBlur = 10
              ctx.stroke()
              ctx.shadowBlur = 0 // reset
            }

            const drawConnection = (indices, isValid = null) => {
              const color = isValid === null ? '#00FF88' : isValid ? '#00FF88' : '#FF3366'
              for (let i = 0; i < indices.length - 1; i++) {
                drawLine(points[indices[i]], points[indices[i + 1]], color)
              }
            }

            // Si hay ángulos resaltados por el contador de ejercicio
            highlighted.forEach(({ indices, isValid }) => drawConnection(indices, isValid))

            // Si no hay específicos, dibujar el esqueleto genérico
            if (highlighted.length === 0) {
              ;[
                [11, 13, 15],
                [12, 14, 16],
                [11, 12],
                [11, 23],
                [12, 24],
                [23, 24],
                [23, 25, 27],
                [24, 26, 28],
              ].forEach((c) => drawConnection(c))
            }

            // Dibujar articulaciones
            if (showSkeleton) {
              ;[11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach((idx) => {
                if (points[idx] && landmarks[idx].visibility > 0.5) {
                  ctx.beginPath()
                  ctx.arc(points[idx].x, points[idx].y, 6, 0, Math.PI * 2)
                  ctx.fillStyle = '#AAFF00'
                  ctx.fill()
                  ctx.strokeStyle = '#000'
                  ctx.lineWidth = 2
                  ctx.stroke()
                }
              })
            }

            // Dibujar textos de ángulos
            if (showSkeleton) {
              highlighted.forEach(({ indices, angle, isValid }) => {
                if (angle !== undefined && indices.length >= 3) {
                  const mp = points[indices[1]]
                  if (mp && landmarks[indices[1]].visibility > 0.5) {
                    ctx.font = 'bold 24px monospace'
                    ctx.fillStyle = isValid ? '#00FF88' : '#FF3366'
                    ctx.strokeStyle = '#000'
                    ctx.lineWidth = 4
                    ctx.strokeText(`${Math.round(angle)}°`, mp.x + 12, mp.y + 12)
                    ctx.fillText(`${Math.round(angle)}°`, mp.x + 12, mp.y + 12)
                  }
                }
              })
            }

            onPoseDetectedRef.current?.(results.landmarks[0])
          }
        } catch (e) {
          // Silenciar
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect)
    }

    detect()
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current)
    }
  }, [cameraReady, modelReady, smoothLandmarks, isCalibrated, showSkeleton])

  // ERROR
  if (error) {
    return (
      <div className="flex items-center justify-center p-6 bg-red-900/50 rounded-xl min-h-[350px]">
        <div className="text-center font-mono">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Error</p>
          <p className="text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reintentar</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      translate="no"
      className="relative rounded-none overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.02)] notranslate"
      style={{
        minHeight: '350px',
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #1a1a2e 100%)',
      }}
    >
      {/* Indicador de estado */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 font-mono">
        {cameraReady && modelReady ? (
          <div className="flex items-center gap-1.5 border border-green-500/50 bg-green-500/10 text-green-400 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-none shadow-[0_0_10px_rgba(34,197,94,0.15)]">
            <Zap className="w-3.5 h-3.5" />
            <span>Activo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 border border-yellow-500/50 bg-yellow-500/10 text-yellow-400 text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-none animate-pulse shadow-[0_0_10px_rgba(255,230,0,0.15)]">
            <Camera className="w-3.5 h-3.5" />
            <span>{cameraReady ? 'Preparando IA...' : 'Conectando...'}</span>
          </div>
        )}
      </div>

      {/* HU-11: Overlay de Calibración Inicial */}
      {!isCalibrated && (
        <div
          translate="no"
          className="absolute inset-0 bg-black/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center space-y-6 notranslate"
        >
          <div className="border-l-4 border-yellow-400 pl-4 py-1 text-left font-mono">
            <p className="text-[9px] font-black text-yellow-400 tracking-[0.25em] uppercase">
              <span>CALIBRACIÓN_OBLIGATORIA</span>
            </p>
            <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">
              <span>Ajuste de Luz y Encuadre</span>
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm font-mono">
            {/* Iluminación */}
            <div className={`p-4 border text-left ${lightStatus === 'OK' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${lightStatus === 'OK' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[8px] font-black text-white/50 tracking-wider">ILUMINACIÓN</span>
              </div>
              <p className={`text-xs font-black uppercase ${lightStatus === 'OK' ? 'text-green-400' : 'text-red-400'}`}>
                <span>{lightStatus === 'OK' ? 'ÓPTIMA' : lightStatus === 'LOW' ? 'BAJA' : 'EXCESIVA'}</span>
              </p>
              <p className="text-[7px] text-white/40 uppercase mt-1">
                <span>{lightStatus === 'OK' ? 'Luz ambiente correcta' : 'Enciende una luz o acércate'}</span>
              </p>
            </div>

            {/* Encuadre */}
            <div className={`p-4 border text-left ${framingStatus !== 'NO_BODY' ? 'border-green-500/30 bg-green-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${framingStatus !== 'NO_BODY' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-[8px] font-black text-white/50 tracking-wider">ENCUADRE_CUERPO</span>
              </div>
              <p className={`text-xs font-black uppercase ${framingStatus !== 'NO_BODY' ? 'text-green-400' : 'text-red-400'}`}>
                <span>{framingStatus === 'FULL' ? 'CUERPO COMPLETO' : framingStatus === 'UPPER' ? 'CUERPO PARCIAL' : 'SIN CUERPO'}</span>
              </p>
              <p className="text-[7px] text-white/40 uppercase mt-1">
                <span>{framingStatus !== 'NO_BODY' ? 'Encuadre detectado' : 'Ubícate frente a la cámara'}</span>
              </p>
            </div>
          </div>

          {lightStatus === 'OK' && framingStatus !== 'NO_BODY' ? (
            <div className="space-y-2 animate-bounce font-mono">
              <p className="text-4xl font-black text-yellow-400 italic">
                <span>{countdown > 0 ? countdown : 'LISTO'}</span>
              </p>
              <p className="text-[9px] text-white/50 tracking-widest uppercase">
                <span>MANTÉN LA POSICIÓN PARA FINALIZAR CALIBRACIÓN</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[9px] font-mono text-white/30 uppercase tracking-widest">
              <Camera className="w-3.5 h-3.5 animate-pulse" />
              <span>Esperando condiciones óptimas del entorno...</span>
            </div>
          )}
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%',
          height: 'auto',
          minHeight: '350px',
          display: 'block',
          transform: 'scaleX(-1)',
          objectFit: 'cover',
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  )
}

