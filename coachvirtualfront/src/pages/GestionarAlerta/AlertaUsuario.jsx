import React, { useEffect, useState } from "react";
import { AlertaService } from "../../services/AlertaService";
import NotificationService from "../../services/NotificationService";
import api from "../../api/api";
import { useAuth } from "../../auth/useAuth";
import { 
  Bell, 
  RefreshCw, 
  Clock, 
  AlertCircle, 
  Inbox, 
  Terminal, 
  Cpu, 
  ShieldCheck, 
  Target, 
  ChevronRight,
  Database,
  ArrowLeft
} from 'lucide-react';
import { useNavigate } from "react-router-dom";

/**
 * PÁGINA DE NOTIFICACIONES (CENTRO DE DATOS INDUSTRIAL)
 * Historial de alertas y logs de actividad del usuario.
 */
const fmtDateTime = (iso) => {
  if (!iso) return "SIN_REGISTRO";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString().toUpperCase();
};

// Limpieza de caracteres no permitidos para terminal industrial
const cleanMessage = (msg) => {
  if (!msg) return "ERROR_MENSAJE_VACÍO";
  return msg.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim().toUpperCase();
};

const candidateUrls = (uid) => [
  "/mis-alertas/",
  `/alertas/?usuario=${uid}`,
  "/alertas/?mine=1",
];

export default function AlertaUsuario() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const uid = user?.id;

  const setSorted = (arr) => {
    // FILTRADO DE LOGS VÁLIDOS
    const unread = (arr || []).filter(a => !a.leida);
    const sorted = [...unread].sort((a, b) => {
      const da = new Date(a.created_at).getTime() || 0;
      const db = new Date(b.created_at).getTime() || 0;
      if (db !== da) return db - da;
      return (b.id || 0) - (a.id || 0);
    });
    setItems(sorted);
  };

  const load = async () => {
    if (!uid) return;
    setLoading(true);
    setErr(null);
    try {
      try {
        const mine = await AlertaService.listMine();
        if (Array.isArray(mine)) {
          setSorted(mine);
          setLoading(false);
          return;
        }
      } catch { }

      let fetched = null;
      for (const url of candidateUrls(uid)) {
        try {
          const { data } = await api.get(url);
          if (Array.isArray(data)) {
            fetched = data;
            break;
          }
        } catch { }
      }
      if (!fetched) {
        const all = await AlertaService.list();
        fetched = (all || []).filter((a) => {
          const id = typeof a.usuario === "object" ? a.usuario?.id : a.usuario;
          return String(id) === String(uid);
        });
      }
      setSorted(fetched);
    } catch (e) {
      setErr("ERROR_FETCH_LOGS: Falló la descarga de paquetes de datos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    NotificationService.markAllAsRead();
  }, [uid]);

  const handleBack = () => {
    navigate(-1);
  };

  if (!uid) {
    return (
      <main className="min-h-screen p-12 bg-[#050505] flex items-center justify-center font-mono">
        <div className="flex items-center gap-3 text-white/20">
           <RefreshCw className="w-5 h-5 animate-spin" />
           <span className="text-[10px] font-black tracking-widest uppercase">AUTENTICANDO_MÓDULO...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8 lg:p-16 bg-[#050505] text-white font-sans selection:bg-yellow-400 selection:text-black pt-24">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header Superior del Centro de Datos */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between border-b border-white/5 pb-10">
          <div className="space-y-4">
            <button onClick={handleBack} className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest mb-4">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETROCEDER_SISTEMA
            </button>
            <div className="flex items-center gap-6">
               <div className="w-16 h-16 border border-white/5 bg-white/[0.02] flex items-center justify-center relative">
                  <Bell className="w-8 h-8 text-yellow-400/40" />
                  <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 animate-pulse"></div>
               </div>
               <div className="space-y-1 border-l-4 border-yellow-400 pl-6">
                  <span className="text-yellow-400 font-mono text-[9px] tracking-[0.4em] uppercase">CENTRO_DE_DATOS_OPERATIVO</span>
                  <h1 className="text-5xl font-black italic uppercase italic tracking-tighter leading-none">LOGS DE <span className="text-yellow-400">ACTIVIDAD</span></h1>
               </div>
            </div>
          </div>
          
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-4 px-6 py-3 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-yellow-400 hover:border-yellow-400/50 hover:bg-yellow-400/5 transition-all disabled:opacity-20 group"
          >
            <RefreshCw className={cx("w-4 h-4 transition-transform group-hover:rotate-180 duration-500", loading ? 'animate-spin' : '')} />
            SINCRONIZAR_RED
          </button>
        </div>

        {/* Módulo de Logs Principal */}
        <section className="bg-[#0f0f0f] border border-white/5 shadow-2xl overflow-hidden relative">
          
          {/* Decorativo Superior Terminal */}
          <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-8">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
             </div>
             <div className="flex items-center gap-4 text-[8px] font-mono font-black text-white/10 tracking-widest">
                <span>DATOS_MÓDULO: MIS_ALERTASV1.2</span>
                <Database className="w-3 h-3" />
             </div>
          </div>

          {loading ? (
            <div className="p-24 flex flex-col items-center gap-8 bg-black/40">
               <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent animate-spin" />
               <p className="text-[10px] font-mono font-black tracking-[0.5em] text-white/20 uppercase">DECODIFICANDO_LOGS_SISTEMA...</p>
            </div>
          ) : err ? (
            <div className="p-16 flex flex-col items-center gap-6 bg-red-500/5 text-center">
               <AlertCircle className="w-12 h-12 text-red-500/40" />
               <div className="space-y-2">
                  <h4 className="text-xs font-black text-red-500 tracking-[0.3em] uppercase">ERROR_DE_COMUNICACIÓN</h4>
                  <p className="text-[10px] font-mono text-red-400/60 uppercase">{err}</p>
               </div>
               <button onClick={load} className="mt-4 px-8 py-2 border border-red-500/50 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">REINTENTAR_COM_SYNC</button>
            </div>
          ) : items.length === 0 ? (
            <div className="p-32 text-center space-y-8 bg-black/20">
               <Inbox className="w-20 h-20 mx-auto text-white/[0.03] animate-bounce" />
               <div className="space-y-2">
                  <p className="text-[11px] font-mono font-black text-white/20 tracking-[0.5em] uppercase leading-relaxed">LOGS_VACÍOS:<br/>EL SISTEMA NO HA GENERADO ALERTAS OPERATIVAS HASTA EL MOMENTO.</p>
               </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/5">
              {items.map((a, idx) => (
                <li key={a.id} className="p-10 hover:bg-white/[0.02] transition-all group relative overflow-hidden">
                  
                  {/* Indicador de posición industrial */}
                  <div className="absolute top-10 left-4 text-[8px] font-mono font-black text-white/10 transform -rotate-90 origin-left">
                     ENTRY_//0{idx + 1}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pl-12 pr-4">
                     <div className="space-y-4 max-w-2xl">
                        <div className="flex items-center gap-3">
                           <ShieldCheck className="w-4 h-4 text-yellow-400/40" />
                           <h3 className="text-lg font-black italic uppercase italic tracking-tighter text-white/80 group-hover:text-yellow-400 transition-colors">
                             {cleanMessage(a.mensaje)}
                           </h3>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/[0.02]">
                           <div className="flex items-center gap-3">
                              <Clock className="w-3 h-3 text-white/20" />
                              <span className="text-[10px] font-mono font-black tracking-widest text-white/20 uppercase">
                                TIMESTAMP: <span className="text-white/40">{fmtDateTime(a.created_at)}</span>
                              </span>
                           </div>
                           
                           {a.fecha && (
                             <div className="flex items-center gap-3">
                                <Target className="w-3 h-3 text-red-500/40" />
                                <span className="text-[10px] font-mono font-black tracking-widest text-red-500/40 uppercase italic">
                                   FECHA_LÍMITE_SISTEMA: {fmtDateTime(a.fecha)}
                                </span>
                             </div>
                           )}
                        </div>
                     </div>

                     <div className="hidden md:flex flex-col items-end gap-2">
                        <span className="text-[8px] font-black tracking-widest text-white/10 uppercase italic">STATUS: UNREAD</span>
                        <div className="p-2 border border-white/5 bg-white/[0.01] group-hover:border-yellow-400/20 group-hover:text-yellow-400 transition-all">
                           <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                     </div>
                  </div>

                  {/* Decorativo fondo hover */}
                  <div className="absolute right-0 bottom-0 w-32 h-32 bg-yellow-400/[0.02] rounded-full blur-3xl group-hover:bg-yellow-400/[0.05] transition-all"></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Footer info Operativa Terminal */}
        <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[9px] font-mono text-white/5 uppercase tracking-[0.4em]">
           <div className="flex items-center gap-6">
              <span>SISTEMA: V-COACH_BIOS_CORE</span>
              <span>ESTADO: {items.length} LOGS_SIN_PROCESAR</span>
           </div>
           <div className="flex items-center gap-4">
              <ShieldCheck className="w-3 h-3" />
              <span>LOGS DE ACCESO NIVEL 4 SEGURO</span>
           </div>
        </div>
      </div>
    </main>
  );
}

const cx = (...c) => c.filter(Boolean).join(" ");
