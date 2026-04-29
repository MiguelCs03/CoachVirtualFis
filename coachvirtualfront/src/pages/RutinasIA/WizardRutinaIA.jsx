import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Loader2, 
  Target, 
  Activity, 
  Dumbbell, 
  Zap, 
  Brain, 
  Terminal, 
  Cpu, 
  Clock, 
  Shield, 
  Check,
  X,
  Plus
} from 'lucide-react';
import { generarRutinaConIA, guardarRutinaGenerada } from '../../services/IA/rutinaIAService';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../context/NotificationContext';

export default function WizardRutinaIA() {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [paso, setPaso] = useState(1);
    const [generando, setGenerando] = useState(false);
    const [rutinaGenerada, setRutinaGenerada] = useState(null);

    const [respuestas, setRespuestas] = useState({
        objetivo: '',
        nivel: '',
        diasSemana: 4,
        duracion: 45,
        areas: [],
        limitaciones: ''
    });

    const handleNext = () => {
        if (paso < 5) setPaso(paso + 1);
        else generarRutina();
    };

    const handleBack = () => {
        if (paso > 1) setPaso(paso - 1);
    };

    const actualizar = (campo, valor) => {
        setRespuestas(prev => ({ ...prev, [campo]: valor }));
    };

    const toggleArea = (area) => {
        setRespuestas(prev => ({
            ...prev,
            areas: prev.areas.includes(area)
                ? prev.areas.filter(a => a !== area)
                : [...prev.areas, area]
        }));
    };

    const generarRutina = async () => {
        setGenerando(true);
        try {
            const resultado = await generarRutinaConIA(respuestas);
            if (resultado.success) {
                setRutinaGenerada(resultado.rutina);
                setPaso(6);
                showNotification('Sincronización de IA completada con éxito.', 'success');
            } else {
                showNotification('Fallo parcial en el motor de IA. Usando protocolo base.', 'warning');
                setRutinaGenerada(resultado.fallback);
                setPaso(6);
            }
        } catch (error) {
            showNotification('Error crítico de red en el motor de IA.', 'error');
        } finally {
            setGenerando(false);
        }
    };

    const guardarRutina = async () => {
        try {
            await guardarRutinaGenerada(rutinaGenerada);
            showNotification('Protocolo guardado en el servidor central.', 'success');
            navigate('/home');
        } catch (error) {
            showNotification('Error al intentar guardar el protocolo.', 'error');
        }
    };

    const puedeAvanzar = () => {
        switch (paso) {
            case 1: return respuestas.objetivo !== '';
            case 2: return respuestas.nivel !== '';
            case 3: return respuestas.diasSemana > 0;
            case 4: return respuestas.duracion > 0;
            default: return true;
        }
    };

    if (paso === 6 && rutinaGenerada) {
        return (
            <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-10">
                    <div className="border-l-4 border-yellow-400 pl-8">
                       <p className="text-yellow-400 font-mono text-[10px] tracking-[0.4em] mb-2 uppercase flex items-center gap-2"><Sparkles className="w-3 h-3" /> PROTOCOLO_GENERADO_IA</p>
                       <h1 className="text-5xl font-black italic uppercase italic tracking-tighter">{rutinaGenerada.nombre}</h1>
                    </div>

                    <div className="bg-[#0f0f0f] border border-white/5 p-1 shadow-[20px_20px_0px_rgba(255,230,0,0.05)]">
                        <div className="p-8 space-y-8">
                           <p className="text-white/40 font-mono text-xs uppercase leading-relaxed tracking-tighter">{rutinaGenerada.descripcion}</p>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
                              <ResultStat label="FRECUENCIA" value={`${rutinaGenerada.diasSemana} DÍAS/SEM`} />
                              <ResultStat label="DURACIÓN_EST" value={`${rutinaGenerada.duracion} MIN`} />
                              <ResultStat label="VOLUMEN" value={`${rutinaGenerada.dias.reduce((sum, d) => sum + d.ejercicios.length, 0)} UNIDADES`} />
                           </div>

                           <div className="space-y-6">
                              {rutinaGenerada.dias.map((dia, idx) => (
                                <div key={idx} className="bg-white/[0.02] border border-white/5 p-6">
                                   <h3 className="text-xs font-black uppercase tracking-widest text-yellow-400 mb-4 flex items-center gap-2">
                                      <div className="w-1 h-3 bg-yellow-400" /> {dia.nombre}
                                   </h3>
                                   <div className="grid gap-2">
                                      {dia.ejercicios.map((ej, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                                            <div className="flex-1 min-w-0">
                                               <p className="text-[10px] font-black uppercase tracking-tight truncate">{ej.nombre}</p>
                                               <p className="text-[8px] font-mono text-white/20 uppercase">{ej.series}X{ej.repeticiones} | {ej.descanso || '60S DESCANSO'}</p>
                                            </div>
                                            <Zap className="w-3 h-3 text-white/10" />
                                        </div>
                                      ))}
                                   </div>
                                </div>
                              ))}
                           </div>

                           <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/5">
                              <button onClick={guardarRutina} className="flex-1 bg-yellow-400 text-black py-5 font-black uppercase tracking-[0.3em] text-[10px] hover:bg-white transition-all">CONFIRMAR Y CARGAR PROTOCOLO</button>
                              <button onClick={() => { setPaso(1); setRutinaGenerada(null); }} className="px-10 py-5 border border-white/10 text-white/40 hover:text-white transition-all text-[10px] font-black tracking-widest uppercase">REGENERAR</button>
                           </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
            <div className="max-w-3xl mx-auto space-y-12">
                
                {/* Header Industrial */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 text-[9px] font-black uppercase tracking-[0.4em] text-yellow-400">
                        <Cpu className="w-4 h-4" /> ENGINE: GPT-4O_CORE
                    </div>
                    <h1 className="text-5xl font-black italic uppercase italic tracking-tighter">SISTEMA <span className="text-yellow-400">GENERATIVO</span></h1>
                    <p className="text-white/20 font-mono text-[9px] tracking-[0.3em] uppercase max-w-lg mx-auto leading-relaxed">CONFIGURE LOS PARÁMETROS OPERATIVOS PARA QUE LA UNIDAD IA SINCRONICE SU PROTOCOLO DE ENTRENAMIENTO.</p>
                </div>

                {/* Progress bar Industrial */}
                <div className="space-y-4 px-4 overflow-hidden">
                    <div className="flex justify-between items-end font-mono text-[9px] text-white/20 tracking-[0.2em] uppercase">
                        <span>PROTOCOLO_PASO_0{paso}</span>
                        <span>{Math.round((paso/5)*100)}%_SYNC</span>
                    </div>
                    <div className="w-full bg-white/5 h-0.5 relative">
                        <motion.div animate={{ width: `${(paso/5)*100}%` }} className="absolute left-0 top-0 h-full bg-yellow-400 shadow-[0_0_10px_rgba(255,230,0,0.5)]" />
                    </div>
                </div>

                {/* Card del wizard */}
                <div className="bg-[#0f0f0f] border border-white/10 p-1 shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
                    <div className="p-10">
                    {generando ? (
                        <div className="text-center py-20 space-y-8">
                            <div className="relative w-20 h-20 mx-auto">
                               <Loader2 className="w-20 h-20 text-yellow-400 animate-spin absolute inset-0" />
                               <Brain className="w-10 h-10 text-white absolute inset-0 m-auto animate-pulse" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">PROCESANDO MATRIZ</h3>
                                <p className="text-white/20 font-mono text-[9px] tracking-widest uppercase animate-shimmer">CALCULANDO_OPTIMIZACIÓN_BIOMECÁNICA...</p>
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence mode="wait">
                            <motion.div key={paso} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                                
                                {paso === 1 && (
                                    <div className="space-y-10">
                                        <StepTitle num="01" text="OBJETIVO PRINCIPAL" />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {[
                                                { valor: 'Ganar músculo', icon: Dumbbell, desc: 'HIPERTROFIA' },
                                                { valor: 'Perder peso', icon: Zap, desc: 'DEFINICIÓN' },
                                                { valor: 'Fisioterapia', icon: Activity, desc: 'RECOVERY' },
                                                { valor: 'Flexibilidad', icon: Target, desc: 'MOVILIDAD' },
                                                { valor: 'Fuerza', icon: Shield, desc: 'POWER' },
                                                { valor: 'Resistencia', icon: Clock, desc: 'ENDURANCE' },
                                            ].map((obj) => (
                                                <OptionCard 
                                                    key={obj.valor}
                                                    icon={obj.icon}
                                                    title={obj.valor}
                                                    desc={obj.desc}
                                                    isActive={respuestas.objetivo === obj.valor}
                                                    onClick={() => actualizar('objetivo', obj.valor)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {paso === 2 && (
                                    <div className="space-y-10">
                                        <StepTitle num="02" text="NIVEL DE EXPERIENCIA" />
                                        <div className="space-y-3">
                                            {[
                                                { valor: 'Principiante', desc: 'SISTEMA_BASE < 6 MESES', icon: Activity },
                                                { valor: 'Intermedio', desc: 'SISTEMA_ESTÁNDAR 0.5-2 AÑOS', icon: Cpu },
                                                { valor: 'Avanzado', desc: 'SISTEMA_EXPERTO > 2 AÑOS', icon: Zap },
                                            ].map((niv) => (
                                                <OptionCard 
                                                    key={niv.valor}
                                                    icon={niv.icon}
                                                    title={niv.valor}
                                                    desc={niv.desc}
                                                    isActive={respuestas.nivel === niv.valor}
                                                    onClick={() => actualizar('nivel', niv.valor)}
                                                    row
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {paso === 3 && (
                                    <div className="space-y-10">
                                        <StepTitle num="03" text="FRECUENCIA SEMANAL" />
                                        <div className="py-10 space-y-8">
                                            <div className="text-center">
                                                <span className="text-8xl font-black italic uppercase italic tracking-tighter text-yellow-400 font-mono">{respuestas.diasSemana}</span>
                                                <span className="text-xs font-black text-white/20 tracking-widest ml-4 uppercase">SESIONES</span>
                                            </div>
                                            <div className="relative px-10">
                                               <input type="range" min="3" max="6" value={respuestas.diasSemana} onChange={(e) => actualizar('diasSemana', parseInt(e.target.value))} className="w-full h-1 bg-white/5 appearance-none cursor-crosshair accent-yellow-400" />
                                               <div className="flex justify-between font-mono text-[8px] text-white/20 mt-4"><span>MN_03</span><span>MX_06</span></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {paso === 4 && (
                                    <div className="space-y-10">
                                        <StepTitle num="04" text="DURACIÓN POR SESIÓN" />
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { valor: 30, label: '30 MIN', desc: 'EXPRESS_UNIT' },
                                                { valor: 45, label: '45 MIN', desc: 'BALANCED_UNIT' },
                                                { valor: 60, label: '60 MIN', desc: 'HEAVY_UNIT' },
                                                { valor: 75, label: '+75 MIN', desc: 'ELITE_UNIT' },
                                            ].map((dur) => (
                                                <OptionCard 
                                                    key={dur.valor}
                                                    icon={Clock}
                                                    title={dur.label}
                                                    desc={dur.desc}
                                                    isActive={respuestas.duracion === dur.valor}
                                                    onClick={() => actualizar('duracion', dur.valor)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {paso === 5 && (
                                    <div className="space-y-10">
                                        <StepTitle num="05" text="PARÁMETROS ADICIONALES" />
                                        <div className="space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black text-white/20 tracking-widest uppercase ml-1">ENFOQUE_MUSCULAR (OPCIONAL)</label>
                                                <div className="grid grid-cols-3 gap-2">
                                                    {['Piernas', 'Pecho', 'Espalda', 'Brazos', 'Abdomen', 'Hombros'].map((area) => (
                                                        <button
                                                            key={area}
                                                            onClick={() => toggleArea(area)}
                                                            className={`py-3 px-2 border text-[9px] font-black tracking-widest uppercase transition-all ${respuestas.areas.includes(area) ? 'bg-yellow-400 border-yellow-400 text-black' : 'bg-transparent border-white/5 text-white/40 hover:border-white/20'}`}
                                                        >
                                                            {area}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black text-white/20 tracking-widest uppercase ml-1">LIMITACIONES / LESIONES</label>
                                                <textarea
                                                    value={respuestas.limitaciones}
                                                    onChange={(e) => actualizar('limitaciones', e.target.value)}
                                                    placeholder="DESCRIPCIÓN_LIMITACIONES_SISTEMA..."
                                                    className="w-full bg-white/[0.03] border-l-2 border-white/20 p-5 text-white font-mono text-[10px] focus:border-yellow-400 outline-none transition-all placeholder:text-white/10 uppercase"
                                                    rows="3"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-4 mt-12 pt-8 border-t border-white/5">
                                    {paso > 1 && (
                                        <button onClick={handleBack} className="px-8 py-4 border border-white/10 font-black text-[9px] text-white/40 uppercase tracking-widest hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                            <ChevronLeft className="w-4 h-4" /> RETROCEDER
                                        </button>
                                    )}
                                    <button
                                        onClick={handleNext}
                                        disabled={!puedeAvanzar()}
                                        className={`flex-1 py-5 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-4 transition-all ${puedeAvanzar() ? 'bg-white text-black hover:bg-yellow-400' : 'bg-white/5 text-white/10 cursor-not-allowed border border-white/5'}`}
                                    >
                                        {paso === 5 ? (
                                            <>SINCRONIZAR IA <Sparkles className="w-4 h-4" /></>
                                        ) : (
                                            <>CONTINUAR <ChevronRight className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const StepTitle = ({ num, text }) => (
    <div className="flex items-center gap-4">
        <span className="text-3xl font-black italic uppercase italic tracking-tighter text-yellow-400/20 font-mono">{num}</span>
        <h2 className="text-xl font-black italic uppercase italic tracking-tighter text-white">{text}</h2>
    </div>
);

const OptionCard = ({ icon: Icon, title, desc, isActive, onClick, row }) => (
    <button
        onClick={onClick}
        className={cx(
            "p-6 border transition-all text-left flex gap-5 group items-center",
            isActive ? "bg-yellow-400 border-yellow-400 text-black shadow-[10px_10px_0px_rgba(255,230,0,0.1)]" : "bg-white/[0.02] border-white/5 hover:border-white/10",
            row ? "w-full" : "flex-col md:flex-row flex-1"
        )}
    >
        <div className={cx("p-3 border", isActive ? "bg-black text-yellow-400 border-black" : "bg-white/5 text-white/20 border-white/5 group-hover:border-white/20")}>
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <div className={cx("font-black uppercase text-[10px] tracking-widest", isActive ? "text-black" : "text-white")}>{title}</div>
            <div className={cx("text-[8px] font-mono mt-1 uppercase", isActive ? "text-black/60" : "text-white/20")}>{desc}</div>
        </div>
    </button>
);

const ResultStat = ({ label, value }) => (
    <div className="bg-white/[0.03] p-6 border border-white/5 flex flex-col items-center justify-center text-center">
        <p className="text-[8px] font-black text-white/20 tracking-widest uppercase mb-1">{label}</p>
        <p className="text-lg font-black italic uppercase italic tracking-tighter text-white">{value}</p>
    </div>
);

const cx = (...c) => c.filter(Boolean).join(" ");
