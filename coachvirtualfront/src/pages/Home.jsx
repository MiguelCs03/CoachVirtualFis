import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp,
  Calendar,
  Target,
  Clock,
  Flame,
  Trophy,
  Plus,
  ChevronRight,
  Activity,
  Dumbbell,
  PlayCircle,
  Sparkles,
  Zap,
  Award,
  TrendingDown,
  Trash2,
  Edit3,
  X,
  Settings,
  Terminal,
  Cpu,
  ArrowRight,
  Database,
} from 'lucide-react'
import { useNotification } from '../context/NotificationContext'
import rutinaService from '../services/RutinaService'
import ejercicioService from '../services/EjercicioService'
import detalleMusculoService from '../services/DetalleMusculoService'
import planService from '../services/PlanService'
import { useSubscription } from '../context/SubscriptionContext'
import dashboardService from '../services/dashboardService'
import PerfilClinicoWizard from '../components/PerfilClinicoWizard'
import api from '../api/api'

const Home = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { refrescarPlan } = useSubscription()
  const { showNotification } = useNotification()

  const [mounted, setMounted] = useState(false)
  const [hoveredBar, setHoveredBar] = useState(null)
  const [chartType, setChartType] = useState('bar')
  const [showWizard, setShowWizard] = useState(false)
  const [rutinas, setRutinas] = useState([])
  const [loadingRutinas, setLoadingRutinas] = useState(true)

  // Estado para modal de creación manual
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [availableExercises, setAvailableExercises] = useState([])
  const [selectedExercises, setSelectedExercises] = useState([])
  const [newRutinaNombre, setNewRutinaNombre] = useState('')
  const [newRutinaDuracion, setNewRutinaDuracion] = useState('45')
  const [newRutinaCategoria, setNewRutinaCategoria] = useState('Gimnasio')

  // Estado para editar rutina
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingRutina, setEditingRutina] = useState(null)

  const [estadisticas, setEstadisticas] = useState({
    entrenamientosSemanales: 0,
    minutosTotal: 0,
    caloriasQuemadas: 0,
    racha: 0,
    precisionPromedio: 0
  })
  
  const [erroresFrecuentes, setErroresFrecuentes] = useState([])
  const [ultimosEntrenamientos, setUltimosEntrenamientos] = useState([])

  const [datosGrafica, setDatosGrafica] = useState([
    { dia: 'LUN', minutos: 0 },
    { dia: 'MAR', minutos: 0 },
    { dia: 'MIÉ', minutos: 0 },
    { dia: 'JUE', minutos: 0 },
    { dia: 'VIE', minutos: 0 },
    { dia: 'SÁB', minutos: 0 },
    { dia: 'DOM', minutos: 0 },
  ])

  const maxMinutos = Math.max(...datosGrafica.map((d) => d.minutos), 1)

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search)
    const paymentSuccess = urlParams.get('payment_success') === 'true'
    const sessionId = urlParams.get('session_id')

    if (paymentSuccess && sessionId) {
      planService
        .verificarSesionStripe(sessionId)
        .then(async (response) => {
          if (response.plan_activated || response.payment_status === 'paid') {
            await refrescarPlan?.()
            showNotification(
              'Plan personalizado activado con éxito. El sistema ha sido actualizado.',
              'success'
            )
            window.history.replaceState({}, document.title, '/')
          }
        })
        .catch((err) => {
          console.error('Error verificando pago:', err)
          showNotification('Error al verificar la transacción. Contacte con soporte.', 'error')
        })
    }
  }, [location.search, refrescarPlan, showNotification])

  useEffect(() => {
    setMounted(true)

    // Verificar si el usuario ya llenó el Perfil Clínico
    api.get('/usuarios/perfil-clinico/').catch((err) => {
      if (err.response?.status === 404) {
        setShowWizard(true)
      }
    })

    ;(async () => {
      try {
        setLoadingRutinas(true)
        const [data, dashboardData] = await Promise.all([
          rutinaService.list(),
          dashboardService.getStats().catch(err => {
            console.error('Error cargando stats de dashboard:', err);
            return null;
          })
        ])
        
        if (dashboardData) {
          if (dashboardData.estadisticas) setEstadisticas(dashboardData.estadisticas)
          if (dashboardData.datosGrafica) setDatosGrafica(dashboardData.datosGrafica)
          if (dashboardData.erroresFrecuentes) setErroresFrecuentes(dashboardData.erroresFrecuentes)
          if (dashboardData.ultimosEntrenamientos) setUltimosEntrenamientos(dashboardData.ultimosEntrenamientos)
        }

        if (Array.isArray(data) && data.length > 0) {
          const normalized = data.map((r) => ({
            id: r.id,
            nombre: r.nombre || r.title || 'PROTOCOLO_S/N',
            categoria: r.categoria || 'GIMNASIO',
            parte: r.parte_cuerpo || r.parte || 'ESTÁNDAR',
            ejercicios: Array.isArray(r.datos_rutina) ? r.datos_rutina.length : r.ejercicios || 0,
            duracion: r.duracion_minutos ? `${r.duracion_minutos} MIN` : r.duracion || '45 MIN',
            progreso: r.progreso ?? 0,
            datos_rutina: r.datos_rutina || r.exercises || [],
          }))
          setRutinas(normalized)
        }
      } catch (err) {
        console.error('Error cargando rutinas:', err)
        showNotification('Fallo de conexión en el banco de datos de rutinas.', 'error')
      } finally {
        setLoadingRutinas(false)
      }
    })()
  }, [showNotification])

  const handleExplorarEjercicios = () => navigate('/catalogo-ejercicios')

  const openCreateModal = async () => {
    setShowCreateModal(true)
    setSelectedExercises([])
    try {
      const [detalles, ejercicios] = await Promise.all([
        detalleMusculoService.getAll().catch(() => []),
        ejercicioService.getAll().catch(() => []),
      ])
      const list = detalles.map((detalle) => {
        const ejercicio =
          ejercicios.find((e) => e.id === detalle.ejercicio) || detalle.ejercicio_data || {}
        return {
          id: detalle.ejercicio,
          detalleId: detalle.id,
          nombre: ejercicio.nombre || `PROTOCOLO_${detalle.ejercicio}`,
          descripcion: `PORCENTAJE_INCIDENCIA: ${detalle.porcentaje}%`,
          url: ejercicio.url || ejercicio.image || '',
          duracion: '15 MIN',
          porcentaje: detalle.porcentaje,
        }
      })
      const uniq = []
      const byId = {}
      for (const e of list) {
        if (!byId[e.id]) {
          byId[e.id] = true
          uniq.push(e)
        }
      }
      setAvailableExercises(uniq)
    } catch (err) {
      showNotification('Error crítico al indexar el banco de ejercicios.', 'error')
    }
  }

  const handleCreateRoutine = async () => {
    if (!newRutinaNombre.trim())
      return showNotification('El identificador de protocolo es requerido.', 'warning')
    if (selectedExercises.length === 0)
      return showNotification('Seleccione al menos una unidad de entrenamiento.', 'warning')

    const payload = {
      nombre: newRutinaNombre.toUpperCase(),
      duracion_minutos: parseInt(newRutinaDuracion) || 45,
      categoria: newRutinaCategoria === 'Gimnasio' ? 'gym' : 'physio',
      parte_cuerpo: selectedExercises[0]?.parte || 'SISTÉMICO',
      datos_rutina: selectedExercises.map((e, idx) => ({
        id: Date.now() + idx,
        ejercicio_id: e.id,
        nombre: e.nombre,
        url: e.url,
        repeticiones: 12,
        series: 3,
        descanso: 60,
      })),
    }

    try {
      const created = await rutinaService.create(payload)
      showNotification('Nuevo protocolo de entrenamiento sincronizado.', 'success')
      setRutinas((prev) => [
        {
          id: created.id || Date.now(),
          nombre: payload.nombre,
          categoria: newRutinaCategoria.toUpperCase(),
          progreso: 0,
          ejercicios: selectedExercises.length,
          duracion: `${payload.duracion_minutos} MIN`,
          datos_rutina: payload.datos_rutina,
        },
        ...prev,
      ])
      setShowCreateModal(false)
      setNewRutinaNombre('')
      setSelectedExercises([])
    } catch (err) {
      showNotification('Error de sincronización con el servidor de rutinas.', 'error')
    }
  }

  const handleIniciarRutina = (id) => {
    const r = rutinas.find((rut) => rut.id === id)
    if (!r) return
    showNotification('Iniciando entorno de entrenamiento interactivo...', 'info')
    navigate(`/rutina/${id}/workout`, { state: { routine: r } })
  }

  const handleDeleteRutina = async (id) => {
    try {
      await rutinaService.delete(id)
      setRutinas((prev) => prev.filter((r) => r.id !== id))
      showNotification('Protocolo eliminado permanentemente.', 'success')
    } catch (err) {
      showNotification('Error al intentar purgar el protocolo.', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Header Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-yellow-400 pl-6 py-2"
        >
          <div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
              TERMINAL <span className="text-yellow-400">OPERATIVA</span>
            </h1>
            <p className="text-white/40 font-mono text-[10px] tracking-[0.4em] mt-2 flex items-center gap-2">
              <Terminal className="w-3 h-3" /> STATUS: V.2.4_ACTIVA | OPERADOR_AUTORIZADO
            </p>
          </div>
          <div className="flex items-center gap-4 text-white/20 font-mono text-[10px] tracking-widest hidden lg:flex">
            <span>LUN</span> <div className="w-4 h-[1px] bg-white/10" />
            <span>MAR</span> <div className="w-4 h-[1px] bg-white/10" />
            <span className="text-yellow-400/60 font-black">MIE</span>{' '}
            <div className="w-4 h-[1px] bg-white/10" />
            <span>JUE</span>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Calendar}
            label="SESIONES / SEMANA"
            value={estadisticas.entrenamientosSemanales}
            trend="+2"
          />
          <StatCard
            icon={Clock}
            label="TIEMPO_TOTAL (MIN)"
            value={estadisticas.minutosTotal}
            trend="OPTIMO"
            color="yellow"
          />
          <StatCard
            icon={Flame}
            label="ENERGÍA_ACTIVA (KCAL)"
            value={estadisticas.caloriasQuemadas}
            trend="NORMAL"
          />
          <StatCard
            icon={Trophy}
            label="RACHA_OPERATIVA"
            value={estadisticas.racha}
            trend="RECORD"
            color="yellow"
          />
        </div>

        {/* Módulo de Dificultades y Precision */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0f0f0f] border border-white/5 p-6 space-y-6"
          >
            <div className="flex items-center gap-3">
              <Target className="w-5 h-5 text-yellow-400" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white/60">PRECISIÓN MEDIA (IA)</h3>
            </div>
            <div className="flex items-end gap-3">
              <span className="text-5xl font-black italic tracking-tighter">{estadisticas.precisionPromedio}%</span>
            </div>
            <div className="w-full h-1 bg-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${estadisticas.precisionPromedio}%` }}
                className="h-full bg-yellow-400" 
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-2 bg-[#0f0f0f] border border-white/5 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <Activity className="w-5 h-5 text-red-500" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white/60">ERRORES POSTURALES FRECUENTES (ÚLTIMOS 7 DÍAS)</h3>
            </div>
            {erroresFrecuentes.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-4">
                {erroresFrecuentes.map((err, idx) => (
                  <div key={idx} className="bg-white/[0.02] border border-white/5 p-4 flex flex-col gap-2">
                    <span className="text-2xl font-black text-red-500">{err.cantidad}x</span>
                    <span className="text-[10px] font-mono tracking-tighter text-white/70 leading-tight uppercase">{err.error}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-20 text-[10px] font-mono tracking-widest text-white/20 uppercase">
                NO HAY ERRORES REGISTRADOS AÚN.
              </div>
            )}
          </motion.div>
        </div>

        {/* Módulo de Inteligencia y Logs */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* AI Insight */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#0f0f0f] border-l-4 border-l-yellow-400 p-6 flex flex-col justify-between group relative overflow-hidden"
          >
            <div className="absolute -right-4 -bottom-4 opacity-5 pointer-events-none">
              <Cpu className="w-48 h-48 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60">EVALUACIÓN FISIOTERAPÉUTICA (IA)</h3>
              </div>
              {erroresFrecuentes.length > 0 ? (
                <div className="space-y-4 relative z-10">
                  <p className="text-sm font-mono text-white/80 leading-relaxed uppercase">
                    SE HA DETECTADO UNA TENDENCIA POSTURAL: <span className="text-yellow-400 font-bold">"{erroresFrecuentes[0].error}"</span>. 
                    PARA UNA REHABILITACIÓN EFECTIVA Y EVITAR LESIONES, ENFÓQUESE EN LA ESTABILIDAD Y DISMINUYA LA VELOCIDAD DE EJECUCIÓN EN SUS PRÓXIMAS TERAPIAS.
                  </p>
                  <div className="inline-block border border-yellow-400/30 bg-yellow-400/10 text-yellow-400 px-3 py-1 text-[9px] font-black tracking-widest uppercase">
                    ACCIÓN SUGERIDA: CORRECCIÓN BIOMECÁNICA
                  </div>
                </div>
              ) : (
                <div className="space-y-4 relative z-10">
                  <p className="text-sm font-mono text-green-400 leading-relaxed uppercase">
                    SU DESEMPEÑO BIOMECÁNICO ES EXCELENTE. SUS MOVIMIENTOS FAVORECEN UNA ÓPTIMA REHABILITACIÓN.
                  </p>
                  <div className="inline-block border border-green-500/30 bg-green-500/10 text-green-500 px-3 py-1 text-[9px] font-black tracking-widest uppercase">
                    ESTADO: SALUD POSTURAL ÓPTIMA
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity Log */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 p-6"
          >
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-white/40" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white/60">HISTORIAL DE SESIONES Y TERAPIAS</h3>
              </div>
            </div>
            {ultimosEntrenamientos.length > 0 ? (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                {ultimosEntrenamientos.map((entrenamiento, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white/[0.02] border border-white/5 hover:border-white/20 transition-colors gap-3">
                    <div className="flex items-center gap-4">
                      <div className={`w-2 h-2 rounded-full ${entrenamiento.completado ? 'bg-green-500' : 'bg-yellow-400'}`} />
                      <div>
                        <p className="text-xs font-black uppercase text-white tracking-widest">{entrenamiento.ejercicio}</p>
                        <p className="text-[9px] font-mono text-white/40">{entrenamiento.fecha}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest">
                      <span className="text-white/60">REPS: <span className="text-white">{entrenamiento.repeticiones}</span></span>
                      <span className="text-white/60">PRECISIÓN: <span className={entrenamiento.precision >= 80 ? 'text-green-400' : 'text-yellow-400'}>{entrenamiento.precision}%</span></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 space-y-3">
                <Activity className="w-6 h-6 text-white/10" />
                <span className="text-[10px] font-mono tracking-widest text-white/20 uppercase">
                  AÚN NO HAY SESIONES REGISTRADAS. INICIE SU REHABILITACIÓN O ENTRENAMIENTO.
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Main Section: Graph + Explorer */}
        <div className="grid lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 bg-[#0d0d0d] border border-white/5 p-8 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <Activity className="w-32 h-32" />
            </div>

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-6 bg-yellow-400" />
                <h2 className="text-lg font-black uppercase tracking-widest">FLUJO DE SESIONES</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setChartType('bar')}
                  className={cx(
                    'px-3 py-1 font-mono text-[9px] tracking-widest border transition-all rounded-none uppercase',
                    chartType === 'bar' ? 'bg-yellow-400 border-yellow-400 text-black font-black' : 'bg-transparent border-white/10 text-white/50 hover:border-white/20'
                  )}
                >
                  BARRAS
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={cx(
                    'px-3 py-1 font-mono text-[9px] tracking-widest border transition-all rounded-none uppercase',
                    chartType === 'line' ? 'bg-yellow-400 border-yellow-400 text-black font-black' : 'bg-transparent border-white/10 text-white/50 hover:border-white/20'
                  )}
                >
                  LÍNEAS
                </button>
              </div>
            </div>

            {chartType === 'line' ? (
              <div className="w-full h-40 flex items-center justify-center relative select-none">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 600 160" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  <line x1="0" y1="40" x2="600" y2="40" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="0" y1="80" x2="600" y2="80" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="0" y1="120" x2="600" y2="120" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="0" y1="160" x2="600" y2="160" stroke="rgba(255,255,255,0.1)" />

                  {/* Draw the Area under the line */}
                  <path
                    d={`
                      M 0 160
                      ${datosGrafica.map((d, idx) => {
                        const x = (idx * 600) / 6;
                        const y = 160 - ((d.minutos / maxMinutos) * 120 + 10);
                        return `L ${x} ${y}`;
                      }).join(' ')}
                      L 600 160
                      Z
                    `}
                    fill="url(#chartGradient)"
                  />

                  {/* Draw the Stroke Path */}
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1 }}
                    d={`
                      ${datosGrafica.map((d, idx) => {
                        const x = (idx * 600) / 6;
                        const y = 160 - ((d.minutos / maxMinutos) * 120 + 10);
                        return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                    `}
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="3"
                  />

                  {/* Data Points */}
                  {datosGrafica.map((d, idx) => {
                    const x = (idx * 600) / 6;
                    const y = 160 - ((d.minutos / maxMinutos) * 120 + 10);
                    return (
                      <g key={idx} className="cursor-crosshair group">
                        <circle
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#000"
                          stroke="#facc15"
                          strokeWidth="2"
                        />
                        <text
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fill="#facc15"
                          className="font-mono text-[9px] font-black"
                        >
                          {d.minutos}m
                        </text>
                        {/* Day label */}
                        <text
                          x={x}
                          y="155"
                          textAnchor="middle"
                          fill="rgba(255,255,255,0.4)"
                          className="font-mono text-[8px]"
                        >
                          {d.dia}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              <div className="flex items-end justify-between h-48 gap-3">
                {datosGrafica.map((dato, i) => (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-2"
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                  >
                    <div className="relative w-full flex items-end justify-center h-40">
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(dato.minutos / maxMinutos) * 100}%` }}
                        transition={{ delay: i * 0.1, duration: 0.8 }}
                        className={cx(
                          'w-full transition-all cursor-crosshair border-t border-x border-white/10',
                          hoveredBar === i
                            ? 'bg-yellow-400 shadow-[0_0_20px_rgba(255,230,0,0.3)]'
                            : 'bg-white/[0.03]'
                        )}
                      />
                    </div>
                    <span
                      className={cx(
                        'text-[10px] font-mono tracking-tighter',
                        hoveredBar === i ? 'text-yellow-400' : 'text-white/40'
                      )}
                    >
                      {dato.dia}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-yellow-400 p-8 flex flex-col justify-between group cursor-pointer relative overflow-hidden"
            onClick={handleExplorarEjercicios}
          >
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform">
              <Dumbbell className="w-48 h-48 text-black" />
            </div>
            <div>
              <Plus className="w-8 h-8 text-black mb-6" />
              <h3 className="text-3xl font-black italic uppercase italic tracking-tighter text-black leading-none mb-4">
                EXPLORAR
                <br />
                NUEVAS UNIDADES
              </h3>
              <p className="text-black/60 text-xs font-bold font-mono tracking-tighter">
                ACCESO AL BANCO DE DATOS BIOMECÁNICOS (+50 MÓDULOS)
              </p>
            </div>
            <button className="flex items-center gap-3 bg-black text-white px-6 py-4 mt-8 self-start font-black text-xs uppercase tracking-widest group-hover:gap-6 transition-all">
              INICIAR BÚSQUEDA <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>

        {/* Section Rutinas */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-1.5 h-6 bg-white" />
              <h2 className="text-xl font-black uppercase tracking-widest">
                BIBLIOTECA DE PROTOCOLOS
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={openCreateModal}
                className="bg-white/5 border border-white/10 px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
              >
                ENTRADA MANUAL
              </button>
              <button
                onClick={() => navigate('/rutinas/crear-ia')}
                className="bg-yellow-400 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-black hover:bg-white transition-all flex items-center gap-2"
              >
                SINC. INTELIGENTE <Sparkles className="w-3 h-3" />
              </button>
            </div>
          </div>

          <AnimatePresence>
            {loadingRutinas ? (
              <div className="flex items-center gap-3 font-mono text-white/40 text-xs uppercase py-20 px-4">
                <div className="w-2 h-2 bg-yellow-400 animate-ping" /> CARGANDO DATOS DE
                PROTOCOLOS...
              </div>
            ) : rutinas.length === 0 ? (
              <div className="border border-white/5 bg-[#0d0d0d] p-20 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-white/5 flex items-center justify-center border border-white/10">
                  <Zap className="w-10 h-10 text-white/20" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-black italic uppercase italic tracking-tighter">
                    SIN PROTOCOLOS ASIGNADOS
                  </h3>
                  <p className="text-white/40 text-[10px] font-mono tracking-widest">
                    INICIE UNA SINCRONIZACIÓN O CARGA MANUAL PARA COMENZAR EL ENTRENAMIENTO.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {rutinas.map((r, i) => (
                  <RoutineCard
                    key={r.id}
                    rutina={r}
                    onStart={() => handleIniciarRutina(r.id)}
                    onDelete={() => handleDeleteRutina(r.id)}
                    onEdit={() => {
                      /* Logic for edit mod */
                    }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL CREACIÓN (ADAPTADO) */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f0f0f] border border-white/10 w-full max-w-4xl p-1 shadow-[20px_20px_0px_rgba(255,230,0,0.1)]"
            >
              <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-3xl font-black italic uppercase italic tracking-tighter leading-none">
                      NUEVA CARGA
                    </h2>
                    <span className="text-[9px] text-white/40 uppercase tracking-[0.4em] font-mono">
                      ID_PROTOCOL_INIT
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 text-white/20 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <IndustrialInput
                      label="NOMBRE_PROTOCOLO"
                      value={newRutinaNombre}
                      onChange={(e) => setNewRutinaNombre(e.target.value)}
                      placeholder="EJ: UPPER_BODY_FORCE"
                    />
                    <IndustrialInput
                      label="TIEMPO_BASE (MIN)"
                      type="number"
                      value={newRutinaDuracion}
                      onChange={(e) => setNewRutinaDuracion(e.target.value)}
                    />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-white/40 tracking-widest uppercase">
                        CATEGORÍA
                      </label>
                      <select
                        value={newRutinaCategoria}
                        onChange={(e) => setNewRutinaCategoria(e.target.value)}
                        className="w-full bg-white/[0.03] border-l-2 border-white/20 p-4 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all appearance-none"
                      >
                        <option value="Gimnasio">GYM_HIIT</option>
                        <option value="Fisioterapia">PHYSIO_RECOVER</option>
                      </select>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-4">
                    <div className="flex justify-between items-center text-white/40 font-mono text-[9px] tracking-widest uppercase">
                      <span>BANCO DE UNIDADES ({availableExercises.length})</span>
                      <span>SELECCIONADOS: {selectedExercises.length}</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2 pt-1 pb-4">
                      {availableExercises.map((ex) => (
                        <ExerciseSelectItem
                          key={ex.id}
                          ex={ex}
                          isSelected={selectedExercises.some((s) => s.id === ex.id)}
                          onToggle={() => {
                            if (selectedExercises.some((s) => s.id === ex.id)) {
                              setSelectedExercises((prev) => prev.filter((s) => s.id !== ex.id))
                            } else {
                              setSelectedExercises((prev) => [...prev, ex])
                            }
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-white/5">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={handleCreateRoutine}
                    className="bg-yellow-400 text-black px-10 py-5 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all"
                  >
                    CONFIRMAR SINCRONIZACIÓN
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWizard && (
          <PerfilClinicoWizard onComplete={() => setShowWizard(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className={cx(
      'bg-[#0d0d0d] border border-white/5 p-6 space-y-4 relative overflow-hidden group',
      color === 'yellow' ? 'border-l-4 border-l-yellow-400' : ''
    )}
  >
    <div className="flex items-center justify-between relative z-10">
      <div
        className={cx(
          'p-3 rounded-none',
          color === 'yellow' ? 'bg-yellow-400 text-black' : 'bg-white/5 text-white/40'
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-mono text-white/20 tracking-tighter">{trend}</span>
    </div>
    <div className="space-y-1 relative z-10">
      <p className="text-[9px] font-black text-white/30 tracking-[0.2em] leading-none uppercase">
        {label}
      </p>
      <p className="text-3xl font-black italic uppercase tracking-tighter text-white">{value}</p>
    </div>
    {/* Background deco */}
    {color === 'yellow' && (
      <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-400/5 blur-3xl rounded-full" />
    )}
  </motion.div>
)

const RoutineCard = ({ rutina, onStart, onDelete, onEdit }) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-[#0f0f0f] border border-white/10 group relative p-1 shadow-[10px_10px_0px_rgba(0,0,0,0.3)] hover:shadow-[15px_15px_0px_rgba(255,230,0,0.1)] transition-all"
  >
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span
            className={cx(
              'text-[8px] font-black px-2 py-0.5 tracking-[0.2em] uppercase',
              rutina.categoria === 'PHYSIO'
                ? 'bg-blue-500/10 text-blue-500'
                : 'bg-yellow-400/10 text-yellow-400'
            )}
          >
            PROTOCOLO_{rutina.categoria}
          </span>
          <h3 className="text-xl font-black italic uppercase italic tracking-tighter leading-none pt-1">
            {rutina.nombre}
          </h3>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-all flex gap-1">
          <button
            onClick={onDelete}
            className="p-1.5 text-white/20 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/[0.03] p-3 border border-white/5">
          <p className="text-[8px] font-black text-white/40 tracking-widest uppercase">MÓDULOS</p>
          <p className="text-sm font-mono text-white pt-1">
            {rutina.ejercicios} <span className="text-[9px] text-white/20">UNIT.</span>
          </p>
        </div>
        <div className="bg-white/[0.03] p-3 border border-white/5">
          <p className="text-[8px] font-black text-white/40 tracking-widest uppercase">ESTIMADO</p>
          <p className="text-sm font-mono text-yellow-400 pt-1">{rutina.duracion}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center text-[9px] font-black text-white/40 tracking-widest uppercase">
          <span>PROGRESO DE REHABILITACIÓN</span>
          <span className="text-yellow-400">{rutina.progreso}%</span>
        </div>
        <div className="h-1 bg-white/5 w-full relative overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rutina.progreso}%` }}
            className="h-full bg-yellow-400"
          />
        </div>
      </div>

      <button
        onClick={onStart}
        className="w-full bg-white text-black py-4 font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-yellow-400 transition-all active:scale-[0.98]"
      >
        INICIAR SINCRONIZACIÓN <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  </motion.div>
)

const ExerciseSelectItem = ({ ex, isSelected, onToggle }) => (
  <div
    onClick={onToggle}
    className={cx(
      'flex items-center gap-3 p-3 border transition-all cursor-pointer',
      isSelected
        ? 'bg-yellow-400/10 border-yellow-400 shadow-[0_0_10px_rgba(255,230,0,0.1)]'
        : 'bg-white/[0.02] border-white/5 hover:border-white/20'
    )}
  >
    <div
      className={cx(
        'w-4 h-4 border flex items-center justify-center',
        isSelected ? 'bg-yellow-400 border-yellow-400' : 'bg-transparent border-white/20'
      )}
    >
      {isSelected && <Zap className="w-2.5 h-2.5 text-black" />}
    </div>
    <div className="flex-1 min-w-0">
      <p
        className={cx(
          'text-[10px] font-black uppercase tracking-tight truncate',
          isSelected ? 'text-yellow-400' : 'text-white'
        )}
      >
        {ex.nombre}
      </p>
      <p className="text-[8px] font-mono text-white/40 truncate">{ex.descripcion}</p>
    </div>
    {ex.url && (
      <img src={ex.url} alt="" className="w-10 h-8 object-cover filter grayscale opacity-50" />
    )}
  </div>
)

const IndustrialInput = ({ label, ...props }) => (
  <div className="space-y-1">
    {label && (
      <label className="text-white/40 font-black text-[10px] tracking-widest uppercase ml-1">
        {label}
      </label>
    )}
    <input
      {...props}
      className={`w-full bg-white/[0.03] border-l-2 border-white/20 p-4 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all placeholder:text-white/10 ${props.className || ''}`}
    />
  </div>
)

const cx = (...c) => c.filter(Boolean).join(' ')

export default Home
