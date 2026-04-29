import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  User,
  Activity,
  Footprints,
  Zap,
  Brain,
  Loader2,
  Terminal,
  Cpu,
  Shield,
  Target,
  ChevronRight
} from "lucide-react";
import MusculoService from "../../services/MusculoService";
import TipoService from "../../services/TipoService";

/**
 * PÁGINA DE SELECCIÓN DE PARTE DEL CUERPO INDUSTRIAL
 * Permite al usuario filtrar el catálogo de ejercicios según la zona muscular.
 */
export default function ParteCuerpo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoria = searchParams.get("categoria");

  const [selectedCategoria, setSelectedCategoria] = useState("");
  const [partesCuerpo, setPartesCuerpo] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mapeo dinámico de iconos por nombre de músculo para el terminal
  const iconMapping = {
    brazos: Activity,
    piernas: Footprints,
    espalda: User,
    cintura: Zap,
    cabeza: Brain,
    default: Activity,
  };

  // SINCRONIZACIÓN DE MÚSCULOS DESDE EL BACKEND
  const fetchPartesCuerpo = async () => {
    try {
      setLoading(true);
      setError(null);

      const categoriaId = parseInt(categoria, 10);

      // 1) Obtener el nombre de la categoría del servidor
      const tipos = await TipoService.getAll();
      const tipoActual = tipos.find((t) => t.id === categoriaId);
      if (tipoActual) {
        setSelectedCategoria(tipoActual.nombre);
      }

      // 2) Obtener TODOS los músculos disponibles
      const musculosAll = await MusculoService.getAll();

      // Helper para extraer ID de tipo compatible con diferentes estructuras de datos
      const getTipoId = (m) => {
        if (m.tipo !== undefined && m.tipo !== null) return parseInt(m.tipo, 10);
        if (m.tipo && typeof m.tipo === "object" && m.tipo.id) return parseInt(m.tipo.id, 10);
        if (m.tipo_data && m.tipo_data.id) return parseInt(m.tipo_data.id, 10);
        return null;
      };

      // 3) Filtrado en frontend por categoría del terminal
      const musculosFiltrados = musculosAll.filter(
        (m) => getTipoId(m) === categoriaId
      );

      // 4) Transformación a formato de tarjetas industriales
      const partesFormateadas = musculosFiltrados.map((musculo, index) => {
        const nombreLower = musculo.nombre.toLowerCase();
        const icon = iconMapping[nombreLower] || iconMapping["default"];

        return {
          id: musculo.id,
          nombre: musculo.nombre,
          descripcion: `SISTEMA_UNIT: ${musculo.nombre.toUpperCase()}`,
          icon,
          url: musculo.url,
        };
      });

      setPartesCuerpo(partesFormateadas);
    } catch (err) {
      console.error("Error al cargar partes del cuerpo:", err);
      setError("ERROR_SYNC_BIOS: Fallo en la descarga de módulos biológicos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!categoria) {
      navigate("/ejercicios/categoria");
      return;
    }
    fetchPartesCuerpo();
  }, [categoria, navigate]);

  const handleSelectParte = (parteId) => {
    navigate(`/ejercicios/seleccion?categoria=${categoria}&parte=${parteId}`);
  };

  const handleBack = () => {
    navigate("/ejercicios/categoria");
  };

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Botón de retroceso Industrial */}
        <button onClick={handleBack} className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> RETROCEDER_MÓDULO
        </button>

        {/* Header de Selección de Zona Muscular (Terminal Style) */}
        <div className="space-y-4 border-l-4 border-yellow-400 pl-8">
           <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 tracking-[0.4em]">
              <Cpu className="w-3 h-3 text-yellow-400" /> {selectedCategoria.toUpperCase() || "CARGANDO_BIOS..."}
           </div>
           <h1 className="text-5xl font-black italic uppercase italic tracking-tighter leading-none">SELECCIONE LA <span className="text-yellow-400">ZONA_MUSCULAR</span></h1>
           <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase max-w-lg">FILTRE EL PROTOCOLO DE ENTRENAMIENTO POR UNIDAD BIOMECÁNICA ACTIVA.</p>
        </div>

        {/* Barra de Progresión Operativa */}
        <div className="flex gap-1 h-1 w-full bg-white/5 overflow-hidden">
            <div className="w-full bg-yellow-400 animate-pulse transition-all duration-1000" style={{ width: '40%' }}></div>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="py-24 flex flex-col items-center gap-6">
             <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent animate-spin" />
             <span className="text-[10px] font-mono tracking-[0.5em] text-white/20 uppercase">DESC_UNIDADES_BIOMÉTRICAS...</span>
          </div>
        )}

        {/* Mensaje de error a nivel de terminal */}
        {error && !loading && (
          <div className="bg-red-500/5 border-l-2 border-red-500 p-8 space-y-4">
            <h3 className="text-red-500 font-black uppercase text-xs tracking-widest flex items-center gap-3"><Shield className="w-4 h-4" /> REPORTE_DE_FALLO_OPERATIVO</h3>
            <p className="text-red-400 font-mono text-[10px] uppercase tracking-tight">{error}</p>
            <button onClick={fetchPartesCuerpo} className="px-6 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest">REINTENTAR_SYNC</button>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && partesCuerpo.length === 0 && (
          <div className="bg-[#0f0f0f] border border-white/5 p-16 text-center space-y-6">
            <Terminal className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/40 font-mono text-[10px] uppercase tracking-widest">ERROR_DE_MÓDULO: NO HAY UNIDADES ACTIVAS PARA ESTA CATEGORÍA.</p>
          </div>
        )}

        {/* Grid de partes del cuerpo (Industrial Layout) */}
        {!loading && !error && partesCuerpo.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {partesCuerpo.map((parte, idx) => {
              const Icon = parte.icon;

              return (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={parte.id}
                  onClick={() => handleSelectParte(parte.id)}
                  className="group relative bg-[#0f0f0f] border border-white/5 hover:border-yellow-400/50 transition-all shadow-sm overflow-hidden"
                >
                  {/* Visual del Módulo Muscular */}
                  <div className="relative h-56 w-full bg-black flex items-center justify-center overflow-hidden">
                    {parte.url ? (
                      <img
                        src={parte.url}
                        alt={parte.nombre}
                        loading="lazy"
                        className="h-full w-full object-cover filter grayscale brightness-50 contrast-125 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-110 transition-all duration-700"
                      />
                    ) : (
                      <div className="p-8 bg-white/[0.02] border border-white/5 group-hover:border-yellow-400/30 transition-all">
                        <Icon className="w-12 h-12 text-white/10 group-hover:text-yellow-400 transition-colors" />
                      </div>
                    )}

                    {/* Overlay Industrial de Identificación */}
                    <div className="absolute top-4 left-4 border border-yellow-400/20 bg-black/60 px-3 py-1 flex items-center gap-2">
                       <span className="text-[8px] font-black tracking-widest text-yellow-400">UNIT://0{idx + 1}</span>
                    </div>

                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                       <h3 className="text-2xl font-black italic uppercase italic tracking-tighter text-white drop-shadow-lg group-hover:text-yellow-400 transition-colors">
                         {parte.nombre}
                       </h3>
                       <div className="p-2 border border-white/10 bg-black/40 backdrop-blur-md group-hover:border-yellow-400/50 transition-all">
                          <Icon className="w-4 h-4 text-white/60 group-hover:text-yellow-400" />
                       </div>
                    </div>
                  </div>

                  {/* Detalle Operativo de la Tarjeta */}
                  <div className="p-8 space-y-4">
                    <p className="text-[9px] font-mono text-white/40 uppercase tracking-tight leading-relaxed">
                      ACTIVA EL PROTOCOLO DE ENTRENAMIENTO ESPECÍFICO PARA LA ZONA DE {parte.nombre.toUpperCase()}.
                    </p>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                       <span className="text-[8px] font-black text-white/20 tracking-[0.3em] uppercase italic group-hover:text-yellow-400/40 transition-colors">EXPLORAR_CATÁLOGO</span>
                       <ChevronRight className="w-4 h-4 text-white/10 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>

                  {/* Decorativo lateral - Selector de Status */}
                  <div className="absolute top-0 right-0 w-[2px] h-0 bg-yellow-400 group-hover:h-full transition-all duration-500"></div>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Footer info Operativa */}
        <div className="pt-16 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-white/5 uppercase tracking-[0.4em]">
          <span>STATUS: SESIÓN_BIOMÉTRICA_PENDIENTE</span>
          <span>©2026_V-COACH_ARCHITECTURE_v1.2</span>
        </div>
      </div>
    </div>
  );
}
