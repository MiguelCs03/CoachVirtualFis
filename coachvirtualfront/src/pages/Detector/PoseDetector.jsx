import { useEffect, useRef, useState, useCallback } from 'react';
import { PoseLandmarker, FilesetResolver, DrawingUtils } from '@mediapipe/tasks-vision';

export default function PoseDetector({ onPoseDetected }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const poseLandmarkerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const onPoseDetectedRef = useRef(onPoseDetected);

  // Actualizar la referencia cuando cambia el callback
  useEffect(() => {
    onPoseDetectedRef.current = onPoseDetected;
  }, [onPoseDetected]);

  useEffect(() => {
    let stream = null;

    const initializePoseDetector = async () => {
      try {
        setIsLoading(true);
        
        // Initialize MediaPipe - usar npm package directamente
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm'
        );
        
        const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
            delegate: 'GPU'
          },
          runningMode: 'VIDEO',
          numPoses: 1
        });
        
        poseLandmarkerRef.current = poseLandmarker;

        // Access camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 1280, height: 720 }
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener('loadeddata', startDetection);
        }

        setIsLoading(false);
      } catch (err) {
        setError('No se pudo cargar el modelo o los archivos WASM. Verifica tu conexión o intenta nuevamente.');
        setIsLoading(false);
      }
    };

    const startDetection = () => {
      if (videoRef.current && canvasRef.current) {
        detectPose();
      }
    };

    const detectPose = async () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      if (!video || !canvas || !poseLandmarkerRef.current) return;

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      const drawingUtils = new DrawingUtils(ctx);

      const detect = async () => {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const startTimeMs = performance.now();
          const results = poseLandmarkerRef.current.detectForVideo(video, startTimeMs);

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Draw pose landmarks
          if (results.landmarks && results.landmarks.length > 0) {
            for (const landmarks of results.landmarks) {
              drawingUtils.drawLandmarks(landmarks, {
                radius: 5,
                color: '#00FF00',
                fillColor: '#FF0000'
              });
              drawingUtils.drawConnectors(
                landmarks,
                PoseLandmarker.POSE_CONNECTIONS,
                { color: '#00FF00', lineWidth: 2 }
              );
            }

            // Call callback with pose data
            if (onPoseDetectedRef.current) {
              onPoseDetectedRef.current(results.landmarks[0]);
            }
          }
        }

        animationFrameRef.current = requestAnimationFrame(detect);
      };

      detect();
    };

    initializePoseDetector();

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (poseLandmarkerRef.current) {
        poseLandmarkerRef.current.close();
      }
    };
  }, []); // Sin dependencias para evitar re-inicializaciones

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-lg">Cargando detector de poses...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-auto"
        style={{ transform: 'scaleX(-1)' }}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-auto"
        style={{ transform: 'scaleX(-1)' }}
      />
    </div>
  );
}
