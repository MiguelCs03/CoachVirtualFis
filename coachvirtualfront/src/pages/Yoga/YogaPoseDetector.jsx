import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import { getPoseLandmarker, isMediaPipePreloaded, preloadMediaPipe } from '../../services/IA/mediaPipePreloader';

export default function YogaPoseDetector({ onPoseDetected, highlightedAngles = [] }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const poseLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const onPoseDetectedRef = useRef(onPoseDetected);
  const highlightedAnglesRef = useRef(highlightedAngles);
  const smoothedLandmarksRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
    highlightedAnglesRef.current = highlightedAngles;
  }, [onPoseDetected, highlightedAngles]);

  // Suavizado de landmarks
  const smoothLandmarks = useCallback((newLandmarks, smoothingFactor = 0.2) => {
    if (!smoothedLandmarksRef.current) {
      smoothedLandmarksRef.current = newLandmarks;
      return newLandmarks;
    }
    const smoothed = newLandmarks.map((landmark, idx) => {
      const prev = smoothedLandmarksRef.current[idx];
      if (!prev) return landmark;
      return {
        x: prev.x * smoothingFactor + landmark.x * (1 - smoothingFactor),
        y: prev.y * smoothingFactor + landmark.y * (1 - smoothingFactor),
        z: prev.z * smoothingFactor + landmark.z * (1 - smoothingFactor),
        visibility: landmark.visibility
      };
    });
    smoothedLandmarksRef.current = smoothed;
    return smoothed;
  }, []);

  // Cleanup
  const cleanup = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    smoothedLandmarksRef.current = null;
  }, []);

  // INICIALIZACIÓN PARALELA: Cámara y Modelo al mismo tiempo
  useEffect(() => {
    isMountedRef.current = true;

    // 1. CARGAR CÁMARA (INMEDIATO)
    const initCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('Navegador no soporta cámara');
        }

        // Intentar configuración rápida primero
        const configs = [
          { width: 640, height: 480, facingMode: 'user' },
          { facingMode: 'user' },
          true
        ];

        let stream = null;
        for (const config of configs) {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: config, audio: false });
            break;
          } catch (e) { continue; }
        }

        if (!stream) throw new Error('No se pudo acceder a la cámara');
        if (!isMountedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            if (isMountedRef.current) setCameraReady(true);
          };
        }
      } catch (err) {
        if (isMountedRef.current) {
          if (err.name === 'NotAllowedError') {
            setError('Permite el acceso a la cámara');
          } else if (err.name === 'NotFoundError') {
            setError('No se encontró cámara');
          } else {
            setError('Error de cámara: ' + err.message);
          }
        }
      }
    };

    // 2. CARGAR MODELO (EN PARALELO)
    const initModel = async () => {
      try {
        let poseLandmarker;

        if (isMediaPipePreloaded()) {
          console.log('⚡ MediaPipe precargado');
          poseLandmarker = await getPoseLandmarker();
        } else {
          console.log('📦 Cargando MediaPipe...');
          const result = await preloadMediaPipe();
          poseLandmarker = result.poseLandmarker;
        }

        if (!isMountedRef.current) return;
        poseLandmarkerRef.current = poseLandmarker;
        setModelReady(true);
        console.log('✅ Modelo listo');
      } catch (err) {
        console.error('Error modelo:', err);
        // Fallback directo
        try {
          const vision = await FilesetResolver.forVisionTasks(
            'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
          );
          poseLandmarkerRef.current = await PoseLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
              delegate: 'GPU'
            },
            runningMode: 'VIDEO',
            numPoses: 1
          });
          if (isMountedRef.current) setModelReady(true);
        } catch (e) {
          console.error('Fallback falló:', e);
        }
      }
    };

    // Ejecutar ambos en PARALELO
    Promise.all([initCamera(), initModel()]);

    return () => {
      isMountedRef.current = false;
      cleanup();
    };
  }, [cleanup]);

  // DETECCIÓN: Comienza cuando AMBOS están listos
  useEffect(() => {
    if (!cameraReady || !modelReady) return;
    if (!videoRef.current || !canvasRef.current || !poseLandmarkerRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const detect = () => {
      if (!isMountedRef.current || !poseLandmarkerRef.current) return;

      if (video.readyState >= 2) {
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;

        try {
          const results = poseLandmarkerRef.current.detectForVideo(video, performance.now());
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          if (results.landmarks?.[0]) {
            const landmarks = smoothLandmarks(results.landmarks[0]);
            const w = canvas.width, h = canvas.height;
            const points = landmarks.map(l => ({ x: l.x * w, y: l.y * h, z: l.z, visibility: l.visibility }));
            const highlighted = highlightedAnglesRef.current || [];

            // Dibujar conexiones
            const drawLine = (p1, p2, color = '#00FF00') => {
              if (!p1 || !p2) return;
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = color;
              ctx.lineWidth = 6;
              ctx.lineCap = 'round';
              ctx.stroke();
            };

            const drawConnection = (indices, isValid = null) => {
              const color = isValid === null ? '#00FF00' : isValid ? 'green' : 'red';
              for (let i = 0; i < indices.length - 1; i++) {
                drawLine(points[indices[i]], points[indices[i + 1]], color);
              }
            };

            highlighted.forEach(({ indices, isValid }) => drawConnection(indices, isValid));

            if (highlighted.length === 0) {
              [[11, 13, 15], [12, 14, 16], [11, 12], [11, 23], [12, 24], [23, 24], [23, 25, 27], [24, 26, 28]]
                .forEach(c => drawConnection(c));
            }

            // Dibujar puntos
            [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28].forEach(idx => {
              if (points[idx] && landmarks[idx].visibility > 0.5) {
                ctx.beginPath();
                ctx.arc(points[idx].x, points[idx].y, 6, 0, Math.PI * 2);
                ctx.fillStyle = '#AAFF00';
                ctx.fill();
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            });

            // Dibujar ángulos
            highlighted.forEach(({ indices, angle, isValid }) => {
              if (angle !== undefined && indices.length >= 3) {
                const mp = points[indices[1]];
                if (mp && landmarks[indices[1]].visibility > 0.5) {
                  ctx.font = 'bold 24px Arial';
                  ctx.fillStyle = isValid ? '#00FF00' : '#FF0000';
                  ctx.strokeStyle = '#000';
                  ctx.lineWidth = 3;
                  ctx.strokeText(`${Math.round(angle)}°`, mp.x + 10, mp.y + 30);
                  ctx.fillText(`${Math.round(angle)}°`, mp.x + 10, mp.y + 30);
                }
              }
            });

            onPoseDetectedRef.current?.(results.landmarks[0]);
          }
        } catch (e) {
          // Silenciar errores de detección
        }
      }

      animationFrameRef.current = requestAnimationFrame(detect);
    };

    detect();
    return () => { if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current); };
  }, [cameraReady, modelReady, smoothLandmarks]);

  // ERROR
  if (error) {
    return (
      <div className="flex items-center justify-center p-6 bg-red-900/50 rounded-xl min-h-[350px]">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white font-semibold mb-2">Error</p>
          <p className="text-red-200 text-sm mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" /><span>Reintentar</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{ minHeight: '350px', background: 'linear-gradient(135deg, #1e3a5f 0%, #2d1b4e 50%, #1a1a2e 100%)' }}
    >
      {/* Indicador de estado */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        {cameraReady && modelReady ? (
          <div className="flex items-center gap-1.5 bg-green-600/90 text-white text-xs px-2.5 py-1 rounded-full">
            <Zap className="w-3.5 h-3.5" /><span>Activo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-yellow-600/90 text-white text-xs px-2.5 py-1 rounded-full animate-pulse">
            <Camera className="w-3.5 h-3.5" /><span>{cameraReady ? 'Preparando IA...' : 'Conectando...'}</span>
          </div>
        )}
      </div>

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
          objectFit: 'cover'
        }}
      />

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
