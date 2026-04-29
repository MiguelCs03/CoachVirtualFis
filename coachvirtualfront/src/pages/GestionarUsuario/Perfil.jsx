import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Settings, 
  Calendar, 
  Activity, 
  Shield, 
  Clock, 
  Loader2, 
  Edit3, 
  Save, 
  X, 
  Zap, 
  ArrowLeft,
  Terminal,
  Cpu
} from "lucide-react";
import { fetchMyProfile, updateUser } from "../../services/UsuarioService";
import { useNotification } from "../../context/NotificationContext";
import { useNavigate } from "react-router-dom";

// ========= Helpers de Formateo =========
// Formatea una fecha para que sea compatible con inputs HTML y lectura legible
function formatDate(d) {
  if (!d) return "";
  const date = new Date(d);
  if (isNaN(date.getTime())) return String(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

// Retorna la etiqueta de género cargada por el usuario de forma legible
function labelGenero(v) {
  if (!v) return "";
  const s = String(v).trim().toUpperCase();
  if (s === "M" || s === "MASCULINO") return "Masculino";
  if (s === "F" || s === "FEMENINO") return "Femenino";
  return "Otro";
}

// ========= Componente de Perfil Industrial =========
export default function Perfil() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado para la edición de campos
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    fecha_nacimiento: "",
    genero: "",
    altura: "",
    peso: "",
  });
  const [saving, setSaving] = useState(false);

  // ======= CARGA DE DATOS DEL PERFIL =======
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchMyProfile();
        if (mounted) setUser(data);
      } catch (err) {
        setError(
          err?.response?.data?.detail ||
            err?.message ||
            "FALLO_SYNC: No se pudo cargar el perfil del operador."
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // ======= DERIVADOS PARA LA INTERFAZ (UI) =======
  // Prepara los datos del perfil para ser mostrados en el sistema industrial
  const ui = useMemo(() => {
    if (!user) return null;

    const email = user.email || "";
    const fechaNacimientoRaw = user.fecha_nacimiento || user.fechaNacimiento || "";
    const generoRaw = user.genero || "";
    const alturaRaw = user.altura ?? "";
    const pesoRaw = user.peso ?? "";
    const planActualRaw = user.plan_actual || "";
    const fechaPlanRaw = user.fecha_expiracion_plan || "";
    const tienePlanActivoRaw = !!user.tiene_plan_activo;
    const puedeEntrenarRaw = !!user.puede_entrenar;

    // Generar avatar por defecto si no existe uno en el perfil
    const avatar =
      user.avatar ||
      user.foto ||
      user.foto_perfil ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(email || "U")}&background=ffe600&color=000&bold=true`;

    return {
      id: user.id ?? user.pk ?? null,
      avatar,
      email: email || "SIN_SINCRONIZAR",
      fechaNacimiento: formatDate(fechaNacimientoRaw) || "N/A",
      genero: labelGenero(generoRaw) || "N/A",
      altura: alturaRaw ? `${alturaRaw} m` : "N/A",
      peso: pesoRaw ? `${pesoRaw} kg` : "N/A",

      // campos de suscripción operativa
      planActual: planActualRaw || "FREE_TERMINAL",
      fechaExpiracionPlan: fechaPlanRaw ? formatDate(fechaPlanRaw) : "SIN_EXPIRACIÓN",
      tienePlanActivo: tienePlanActivoRaw,
      puedeEntrenar: puedeEntrenarRaw,

      editable: {
        fecha_nacimiento: formatDate(fechaNacimientoRaw) || "",
        genero: typeof generoRaw === "string" ? generoRaw : "",
        altura: alturaRaw ?? "",
        peso: pesoRaw ?? "",
      },
    };
  }, [user]);

  // Precargar formulario industrial al activar el modo de edición
  useEffect(() => {
    if (isEditing && ui?.editable) {
      setForm({
        fecha_nacimiento: ui.editable.fecha_nacimiento || "",
        genero: ui.editable.genero || "",
        altura: ui.editable.altura ?? "",
        peso: ui.editable.peso ?? "",
      });
    }
  }, [isEditing, ui]);

  // ======= GUARDADO DE CAMBIOS (ACTUALIZACIÓN TERMINAL) =======
  async function saveChanges(e) {
    e?.preventDefault?.();
    setSaving(true);

    if (!ui?.id) {
      showNotification("ERROR: No se detectó ID_OPERADOR válido.", "error");
      setSaving(false);
      return;
    }

    const updates = {
      fecha_nacimiento: form.fecha_nacimiento || null,
      genero: form.genero || null,
      altura: (form.altura ?? "").toString().trim() || null,
      peso: (form.peso ?? "").toString().trim() || null,
    };

    try {
      const data = await updateUser(ui.id, updates, { mergeWith: user, sanitize: true });
      setUser(data);
      showNotification("SISTEMA_DENTRO_DE_LOS_PARÁMETROS: Perfil actualizado.", "success");
      setIsEditing(false);
    } catch (err) {
      showNotification("FALLO_ACTUALIZACIÓN_BIOS: Verifique los datos ingresados.", "error");
    } finally {
      setSaving(false);
    }
  }

  // ======= INTERFAZ DEL PERFIL =======
  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans selection:bg-yellow-400 selection:text-black">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header de Perfil Industrial */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-white/5 pb-10">
          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
            <div className="relative group">
                {/* Visual del Operador */}
                <div className="w-32 h-32 md:w-40 md:h-40 bg-[#0f0f0f] border border-white/10 p-1 group-hover:border-yellow-400/50 transition-all shadow-[10px_10px_0px_rgba(255,230,0,0.05)]">
                   <img 
                      src={ui?.avatar} 
                      alt="Operador" 
                      className="w-full h-full object-cover filter grayscale group-hover:grayscale-0 transition-all duration-500"
                   />
                </div>
                <div className="absolute -top-4 -left-4 border border-yellow-400/20 bg-black/60 px-3 py-1 flex items-center gap-2">
                   <Cpu className="w-3 h-3 text-yellow-400" />
                   <span className="text-[8px] font-black tracking-widest text-yellow-400">OPERADOR_BIO</span>
                </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-yellow-400 font-mono text-[10px] tracking-[0.4em] uppercase">ARCHIVO_OPERATIVO_SISTEMA</p>
                <h1 className="text-4xl md:text-6xl font-black italic uppercase italic tracking-tighter leading-none">{ui?.email.split('@')[0]}</h1>
              </div>
              <div className="flex items-center gap-4 text-white/40 text-[9px] font-black tracking-[0.2em] uppercase">
                <span className="flex items-center gap-2 border border-white/10 px-3 py-1 bg-white/[0.02]"><Mail className="w-3 h-3" /> {ui?.email}</span>
                <span className="flex items-center gap-2 border border-yellow-400/20 px-3 py-1 bg-yellow-400/5 text-yellow-400">ID://{ui?.id}</span>
              </div>
            </div>
          </div>

          <button 
            onClick={() => setIsEditing(!isEditing)} 
            className={`px-8 py-4 font-black uppercase tracking-[0.3em] text-[10px] transition-all flex items-center gap-3 ${isEditing ? 'bg-red-500 text-white hover:bg-black' : 'bg-white text-black hover:bg-yellow-400'}`}
          >
           {isEditing ? <><X className="w-4 h-4" /> CANCELAR_MOD</> : <><Edit3 className="w-4 h-4" /> EDITAR_PERFIL</>}
          </button>
        </div>

        {/* Contenido Principal / Formulario Industrial */}
        <div className="grid lg:grid-cols-3 gap-12">
           
           {/* Panel de Status Operativo */}
           <div className="space-y-6">
              <div className="bg-[#0f0f0f] border border-white/5 p-8 space-y-8">
                <div className="space-y-2">
                   <p className="text-[8px] font-black text-white/20 tracking-[0.3em] uppercase">SISTEMA_DASHBOARD</p>
                   <h3 className="text-xs font-black italic uppercase italic tracking-tighter text-yellow-400">STATUS DE OPERATIVIDAD</h3>
                </div>

                <div className="space-y-4">
                   <StatusItem icon={Shield} label="PLAN_ACTUAL" value={ui?.planActual.toUpperCase()} active />
                   <StatusItem icon={Calendar} label="VENCIMIENTO" value={ui?.fechaExpiracionPlan.toUpperCase()} />
                   <StatusItem icon={Zap} label="ESTADO_ENTRENO" value={ui?.puedeEntrenar ? "OPERATIVO_SINC" : "LIMITADO_BIOS"} color={ui?.puedeEntrenar ? "yellow" : "red"} />
                </div>

                <div className="pt-8 border-t border-white/5 space-y-4">
                   <p className="text-[8px] font-mono text-white/20 leading-relaxed uppercase tracking-tighter">EL STATUS_OPERATIVO DEFINE LOS LÍMITES DE PROCESAMIENTO BIOMECÁNICO Y ACCESO A MÓDULOS_IA DEL SISTEMA V-COACH.</p>
                   <button onClick={() => navigate('/planes')} className="w-full border border-white/10 py-3 text-[9px] font-black uppercase tracking-widest hover:border-yellow-400 hover:text-yellow-400 transition-all">MEJORAR_SISTEMA</button>
                </div>
              </div>
           </div>

           {/* Detalle del Bio-perfil / Formulario */}
           <div className="lg:col-span-2 space-y-8">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4 text-white/20">
                   <Loader2 className="w-10 h-10 animate-spin" />
                   <span className="text-[9px] font-mono tracking-widest uppercase">SYNC_PERFIL...</span>
                </div>
              ) : error ? (
                <div className="bg-red-500/10 border-l-2 border-red-500 p-8 space-y-4">
                   <Terminal className="w-8 h-8 text-red-500" />
                   <p className="text-xs font-black uppercase text-red-500">{error}</p>
                </div>
              ) : (
                <form onSubmit={saveChanges} className="bg-[#0f0f0f] border border-white/5 p-12 space-y-12">
                  <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                    
                    {/* Campos de Sistema Industrial */}
                    <div className="space-y-10">
                       <StepSection title="01_BIOMETRÍA_BASE">
                          {isEditing ? (
                            <div className="space-y-6">
                              <InputField label="FECHA_NACIMIENTO" type="date" value={form.fecha_nacimiento} onChange={v => setForm(s => ({ ...s, fecha_nacimiento: v }))} disableEmoji />
                              <SelectField label="GÉNERO_SISTEMA" value={form.genero} onChange={v => setForm(s => ({ ...s, genero: v }))} options={[
                                { value: "Masculino", label: "MASCULINO" },
                                { value: "Femenino", label: "FEMENINO" },
                                { value: "Otro", label: "OTRO_OPERADOR" },
                              ]} />
                            </div>
                          ) : (
                            <div className="space-y-6">
                              <DataValue label="NACIMIENTO" value={ui?.fechaNacimiento} icon={Calendar} />
                              <DataValue label="GÉNERO" value={ui?.genero.toUpperCase()} icon={Activity} />
                            </div>
                          )}
                       </StepSection>
                    </div>

                    <div className="space-y-10">
                       <StepSection title="02_PARÁMETROS_FÍSICOS">
                          {isEditing ? (
                            <div className="space-y-6">
                               <InputField label="ALTURA_ESTÁNDAR (M)" type="text" value={form.altura} onChange={v => setForm(s => ({ ...s, altura: v }))} placeholder="EJ: 1.85" />
                               <InputField label="MASA_CORPORAL (KG)" type="text" value={form.peso} onChange={v => setForm(s => ({ ...s, peso: v }))} placeholder="EJ: 75.0" />
                            </div>
                          ) : (
                            <div className="space-y-6">
                               <DataValue label="ALTURA_SYNC" value={ui?.altura} icon={Settings} />
                               <DataValue label="MASA_MÉTRICA" value={ui?.peso} icon={Zap} />
                            </div>
                          )}
                       </StepSection>
                    </div>
                  </div>

                  <AnimatePresence>
                    {isEditing && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pt-10 border-t border-white/5 flex gap-4">
                        <button type="submit" disabled={saving} className="flex-1 bg-yellow-400 text-black py-5 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white transition-all flex items-center justify-center gap-3">
                           {saving ? <Loader2 className="w-4 h-4 animate-spin text-black" /> : <Save className="w-4 h-4" />} GUARDAR_MATRIZ_DATOS
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              )}
           </div>
        </div>

        {/* Footer info Operativa */}
        <div className="pt-12 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">
          <span>©2026_BIOMETRY_ENGINE_V1.0</span>
          <span>ESTADO_SISTEMA: EN_ESPERA</span>
        </div>
      </div>
    </div>
  );
}

// ========= Subcomponentes de UI Industrial =========
const StepSection = ({ title, children }) => (
  <div className="space-y-6">
     <h4 className="text-[10px] font-black italic uppercase italic tracking-tighter text-white/60 mb-8 border-b border-white/5 pb-2">{title}</h4>
     {children}
  </div>
);

const DataValue = ({ label, value, icon: Icon }) => (
  <div className="flex gap-5 group items-center">
     <div className="p-3 bg-white/[0.03] border border-white/5 text-white/20 group-hover:border-yellow-400/50 group-hover:text-yellow-400 transition-all">
        <Icon className="w-4 h-4" />
     </div>
     <div>
        <p className="text-[8px] font-black text-white/20 tracking-widest uppercase mb-1">{label}</p>
        <p className="text-[11px] font-mono text-white/80 uppercase">{value}</p>
     </div>
  </div>
);

const StatusItem = ({ icon: Icon, label, value, active, color }) => (
  <div className="flex items-center gap-4">
     <div className={`p-2 border ${active ? 'border-yellow-400/20 text-yellow-400' : 'border-white/5 text-white/20'}`}>
        <Icon className="w-3 h-3" />
     </div>
     <div className="flex-1">
        <p className="text-[7px] font-black text-white/20 tracking-widest uppercase leading-none mb-1">{label}</p>
        <p className={`text-[9px] font-mono uppercase ${color === 'yellow' ? 'text-yellow-400' : color === 'red' ? 'text-red-500' : 'text-white/60'}`}>{value}</p>
     </div>
  </div>
);

const InputField = ({ label, type, value, onChange, placeholder }) => (
  <div className="space-y-2">
     <label className="text-[9px] font-black text-white/30 tracking-widest uppercase ml-1">{label}</label>
     <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder}
        className="w-full bg-[#0d0d0d] border-l-2 border-white/10 p-4 text-white font-mono text-[10px] focus:border-yellow-400 outline-none transition-all placeholder:text-white/5 uppercase"
     />
  </div>
);

const SelectField = ({ label, value, onChange, options }) => (
  <div className="space-y-2">
     <label className="text-[9px] font-black text-white/30 tracking-widest uppercase ml-1">{label}</label>
     <select 
        value={value} 
        onChange={e => onChange(e.target.value)}
        className="w-full bg-[#0d0d0d] border-l-2 border-white/10 p-4 text-white font-mono text-[10px] focus:border-yellow-400 outline-none transition-all uppercase"
     >
        <option value="">SELECCIONAR_ENTRADA</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
     </select>
  </div>
);
