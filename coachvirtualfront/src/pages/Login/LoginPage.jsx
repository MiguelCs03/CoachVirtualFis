import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Dumbbell, 
  Timer, 
  Zap, 
  Activity, 
  ChevronRight, 
  ShieldCheck, 
  Lock, 
  UserPlus,
  ArrowRightLeft,
  Settings,
  Target
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import IniciarSesion from "./IniciarSesion";
import Register from "./Register";

/**
 * COMPONENTE 3D: DISCO DE PESAS DINÁMICO
 * El objeto reacciona al modo (Login/Registro) cambiando su escala y rotación.
 */
const DiscoGimnasio3D = ({ mode }) => {
  const containerRef = useRef();
  const groupRef = useRef();

  useEffect(() => {
    let scene, camera, renderer, group;
    const container = containerRef.current;

    const init = () => {
      scene = new window.THREE.Scene();
      camera = new window.THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;

      renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(window.devicePixelRatio);
      container.appendChild(renderer.domElement);

      group = new window.THREE.Group();
      groupRef.current = group;

      // Cuerpo del Disco
      const plateGeo = new window.THREE.CylinderGeometry(2, 2, 0.4, 32);
      const plateMat = new window.THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.7,
        metalness: 0.3
      });
      const plate = new window.THREE.Mesh(plateGeo, plateMat);
      plate.rotation.x = Math.PI / 2;
      group.add(plate);

      // Centro de Acero
      const hubGeo = new window.THREE.CylinderGeometry(0.5, 0.5, 0.45, 32);
      const hubMat = new window.THREE.MeshStandardMaterial({ 
        color: 0xaaaaaa, 
        metalness: 1, 
        roughness: 0.2 
      });
      const hub = new window.THREE.Mesh(hubGeo, hubMat);
      hub.rotation.x = Math.PI / 2;
      group.add(hub);

      scene.add(group);

      // Iluminación Industrial (Sombras fuertes y reflejos amarillos)
      const light1 = new window.THREE.PointLight(0xffe600, 2, 50);
      light1.position.set(5, 5, 5);
      scene.add(light1);

      const light2 = new window.THREE.PointLight(0xffffff, 1, 50);
      light2.position.set(-5, -5, 5);
      scene.add(light2);

      const ambient = new window.THREE.AmbientLight(0xffffff, 0.1);
      scene.add(ambient);
    };

    const animate = () => {
      requestAnimationFrame(animate);
      if (groupRef.current) {
        groupRef.current.rotation.y += 0.005;
        // El objeto se inclina según el mouse o el estado
        groupRef.current.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
      }
      renderer.render(scene, camera);
    };

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = () => { init(); animate(); };
    document.head.appendChild(script);

    const handleResize = () => {
      if (!camera || !renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (container) container.innerHTML = '';
    };
  }, []);

  // Animación del objeto 3D basada en el modo
  useEffect(() => {
    if (groupRef.current) {
      const targetScale = mode === "login" ? 1 : 0.7;
      const targetX = mode === "login" ? -1.5 : 2;
      
      // Aplicamos un efecto visual de movimiento
      motionValue(groupRef.current.scale, "x", targetScale);
      motionValue(groupRef.current.scale, "y", targetScale);
      motionValue(groupRef.current.scale, "z", targetScale);
      motionValue(groupRef.current.position, "x", targetX);
    }
  }, [mode]);

  const motionValue = (obj, prop, target) => {
    obj[prop] = target; // Simplificado para este ejemplo
  };

  return <div ref={containerRef} className="fixed inset-0 z-0 bg-[#050505]" />;
};

const LoginPage = () => {
  const { signIn } = useAuth();
  const [mode, setMode] = useState("login");

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-black font-sans">
      {/* Fondo 3D Reactivo */}
      <DiscoGimnasio3D mode={mode} />

      {/* Capa de atmósfera industrial */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-transparent to-black opacity-80" />

      {/* Contenedor Principal Creativo */}
      <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col md:flex-row items-center gap-12">
        
        {/* Lado A: Info / Branding (Flotante y Dinámico) */}
        <motion.div 
          animate={{ 
            x: mode === "login" ? 0 : 50,
            opacity: mode === "login" ? 1 : 0.3,
            scale: mode === "login" ? 1 : 0.9
          }}
          className="flex-1 space-y-8 text-center md:text-left"
        >
          <div className="inline-flex items-center gap-4 bg-yellow-400 p-2 pr-6 mb-4">
            <div className="w-12 h-12 bg-black flex items-center justify-center">
              <Dumbbell className="text-yellow-400 w-7 h-7" />
            </div>
            <span className="text-xl font-black text-black uppercase tracking-tighter italic">V-Coach System</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-6xl lg:text-8xl font-black text-white leading-none uppercase italic tracking-tighter">
              FORJA TU <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-white">PODER</span>
            </h1>
            <p className="text-gray-500 font-bold uppercase tracking-[0.3em] text-[10px] flex items-center justify-center md:justify-start gap-3">
              <Zap className="w-4 h-4 text-yellow-400" /> Rendimiento & Fisioterapia
            </p>
          </div>

          <div className="flex gap-8 justify-center md:justify-start text-white/20">
            <div className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Hiit</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Physio</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest">Focus</span>
            </div>
          </div>
        </motion.div>

        {/* Lado B: El Formulario (La "Placa de Acero") */}
        <motion.div 
          layout
          initial={false}
          animate={{ 
            x: mode === "login" ? 0 : -20,
            y: mode === "login" ? 0 : 20,
          }}
          className="w-full max-w-md bg-[#0f0f0f] border border-white/10 p-1 rounded-none shadow-[20px_20px_0px_rgba(255,230,0,0.1)] relative"
        >
          {/* Detalles decorativos industriales */}
          <div className="absolute -top-3 -right-3 w-10 h-10 border-t-2 border-r-2 border-yellow-400" />
          <div className="absolute -bottom-3 -left-3 w-10 h-10 border-b-2 border-l-2 border-white/20" />
          
          <div className="p-8 md:p-12 space-y-8 bg-gradient-to-b from-white/[0.02] to-transparent">
            {/* Header Interno */}
            <div className="flex justify-between items-end mb-4 border-b border-white/5 pb-6">
              <div>
                <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">
                  {mode === "login" ? "Acceso" : "Unirse"}
                </h2>
                <span className="text-[9px] text-gray-500 uppercase tracking-[0.4em] font-bold">Terminal v.2.4</span>
              </div>
              <Settings className="w-5 h-5 text-white/10 animate-spin-slow" />
            </div>

            {/* Selector de modo Estilo "Palanca" */}
            <div className="relative flex bg-black p-1 border border-white/5 mb-4">
              <motion.div 
                animate={{ x: mode === "login" ? "0%" : "100%" }}
                className="absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-yellow-400"
              />
              <button 
                onClick={() => setMode("login")}
                className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${mode === "login" ? "text-black" : "text-white/40"}`}
              >
                Atleta Existente
              </button>
              <button 
                onClick={() => setMode("register")}
                className={`relative z-10 flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${mode === "register" ? "text-black" : "text-white/40"}`}
              >
                Nuevo Recluta
              </button>
            </div>

            {/* Contenido Dinámico */}
            <AnimatePresence mode="wait">
              <motion.div
                key={mode}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {mode === "login" ? (
                  <IniciarSesion signIn={signIn} onSuccess={() => {}} />
                ) : (
                  <Register signIn={signIn} onSuccess={() => setMode("login")} onSwitchToLogin={() => setMode("login")} />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Enlace de cambio rápido */}
            <button 
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="w-full group text-[10px] font-bold text-gray-500 hover:text-yellow-400 uppercase tracking-widest flex items-center justify-center gap-4 transition-colors pt-4"
            >
              <div className="h-[1px] flex-1 bg-white/5 group-hover:bg-yellow-400/20" />
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-3 h-3" />
                {mode === "login" ? "Crear cuenta nueva" : "Ya tengo acceso"}
              </div>
              <div className="h-[1px] flex-1 bg-white/5 group-hover:bg-yellow-400/20" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Marcas de agua y datos técnicos */}
      <div className="fixed bottom-8 left-8 hidden lg:block">
        <div className="flex items-center gap-4 text-white/5 font-mono text-[10px] tracking-[1em] uppercase">
          <span>Resistencia</span>
          <div className="w-12 h-[1px] bg-white/5" />
          <span>Recuperación</span>
          <div className="w-12 h-[1px] bg-white/5" />
          <span>Resultados</span>
        </div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 10s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
