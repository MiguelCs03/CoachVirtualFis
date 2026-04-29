import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Activity, 
  ChevronRight, 
  Play, 
  X, 
  Shield, 
  Zap, 
  Clock, 
  Terminal, 
  Cpu, 
  ShieldAlert,
  Target
} from 'lucide-react';
import YogaPoseDetector from '../../../Yoga/YogaPoseDetector';

/**
 * COMPONENTES AUXILIARES
 */
const cx = (...c) => c.filter(Boolean).join(" ");

const SmartphoneIcon = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
);

const InstructionItem = ({ number, text }) => (
  <div className="flex gap-6 items-start group">
    <span className="text-[10px] font-black text-yellow-400/40 group-hover:text-yellow-400 font-mono transition-colors">{number}</span>
    <p className="text-[11px] font-mono text-white/60 uppercase leading-relaxed tracking-tight group-hover:text-white transition-colors">{text}</p>
  </div>
);

/**
 * VISTA DE RUTINA: REMO SENTADO EN POLEA BAJA (PROTOCOLO INDUSTRIAL)
 * Versión simplificada para trazado y control excéntrico.
 */
export default function RemoSentadoPoleaBaja() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const passedImage = location?.state?.imageUrl || null;
  const passedNombre = location?.state?.nombre || 'Remo sentado en polea baja';

  const handleBack = () => {
    navigate(-1);
  };

  // --- VISTA PREVIA INDUSTRIAL ---
  if (!started) {
    return (
      <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
        <div className="max-w-4xl mx-auto space-y-12">
          
          <button onClick={handleBack} className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> CANCELAR_OPERACIÓN
          </button>

          <div className="grid lg:grid-cols-2 gap-12 bg-[#0f0f0f] border border-white/5 overflow-hidden shadow-2xl relative">
            
            {/* Visual del Protocolo */}
            <div className="relative h-full min-h-[400px] bg-black">
                {passedImage ? (
                  <img src={passedImage} alt={passedNombre} className="w-full h-full object-cover filter grayscale contrast-125 brightness-50" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/5"><Target className="w-24 h-24" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f0f] via-transparent to-transparent"></div>
                
                <div className="absolute bottom-8 left-8 border border-yellow-400/20 bg-black/60 px-4 py-2 flex items-center gap-3">
                    <Shield className="w-4 h-4 text-yellow-400" />
                    <span className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">MÓDULO_POSTURAL_SYNC</span>
                </div>
            </div>

            {/* Configuración Operativa */}
            <div className="p-12 space-y-10 flex flex-col justify-between">
              <div className="space-y-8">
                 <div className="space-y-3">
                    <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 tracking-[0.4em]">
                       <Cpu className="w-3 h-3 text-yellow-400" /> PROTOCOLO_ESPALDA
                    </div>
                    <h1 className="text-4xl font-black italic uppercase italic tracking-tighter leading-none">{passedNombre}</h1>
                    <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase italic">ENFOCADO EN EL TRAZADO Y CONTROL DE LA FASE EXCÉNTRICA.</p>
                 </div>

                 <div className="space-y-6 pt-10 border-t border-white/5 list-none">
                    <InstructionItem number="01" text="Controle la bajada progresiva del maneral." />
                    <InstructionItem number="02" text="Sincronice el torso con el plano vertical." />
                    <InstructionItem number="03" text="Respiración cíclica controlada por el sistema." />
                 </div>
              </div>

              <button onClick={() => setStarted(true)} className="w-full bg-white text-black hover:bg-yellow-400 font-black py-6 transition-all flex items-center justify-center gap-4 uppercase text-[12px] tracking-[0.4em] group">
                ACCEDER_A_TERMINAL <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TERMINAL ACTIVO ---
  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans selection:bg-yellow-400 selection:text-black pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-8">
          <div className="space-y-2">
              <div className="flex items-center gap-4">
                 <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                 <h2 className="text-3xl font-black italic uppercase italic tracking-tighter text-white">{passedNombre}</h2>
              </div>
              <div className="text-[9px] font-mono tracking-widest text-white/20 uppercase pl-6">ID_SISTEMA: POLE_LOW_v1</div>
          </div>
          <button onClick={() => setStarted(false)} className="px-8 py-3 bg-red-500/5 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
            <X className="w-4 h-4" /> ABORTAR_SESIÓN
          </button>
        </div>

        <div className="bg-[#0f0f0f] border border-white/5 shadow-2xl relative overflow-hidden">
          <YogaPoseDetector onPoseDetected={() => {}} />
          
          {/* HUD Status Terminal */}
          <div className="absolute top-8 right-8 flex flex-col gap-3">
             <div className="bg-black/80 border border-white/10 px-4 py-2 flex items-center gap-3">
                <SmartphoneIcon className="w-3 h-3 text-white/40" />
                <span className="text-[8px] font-black tracking-widest text-white/40 uppercase">V-LINK: CONECTADO</span>
             </div>
             <div className="bg-black/80 border border-yellow-400/20 px-4 py-2 flex items-center gap-3">
                <Cpu className="w-3 h-3 text-yellow-400" />
                <span className="text-[8px] font-black tracking-widest text-yellow-400 uppercase italic">PROC: BIOMETRÍA_ACTIVA</span>
             </div>
          </div>

          <div className="absolute bottom-8 left-8 p-3 opacity-10">
              <Terminal className="w-24 h-24" />
          </div>
        </div>

        {/* Footer info Terminal */}
        <div className="pt-8 flex justify-between items-center text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">
           <span>SISTEMA: V-COACH_CORE_v5.0</span>
           <span>STATUS: STREAMING_IA_UDP</span>
        </div>
      </div>
    </div>
  );
}
