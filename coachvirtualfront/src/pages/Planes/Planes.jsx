import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSubscription } from '../../context/SubscriptionContext'
import { useAuth } from '../../auth/useAuth'
import planService from '../../services/planService'
import api from '../../api/api'
import {
  Crown,
  Check,
  X,
  Clock,
  CreditCard,
  Flame,
  Star,
  Lock,
  Sparkles,
  Terminal,
  Zap,
  Shield,
  ArrowRight,
  ChevronRight,
  Info,
  Activity,
  Cpu,
} from 'lucide-react'
import { useNotification } from '../../context/NotificationContext'

/**
 * PÁGINA DE PLANES INDUSTRIAL
 * Permite seleccionar el módulo de suscripción operativa (Gratis, Básico, Premium).
 */
export default function Planes() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const { isAuthenticated } = useAuth()
  const { planActual, refrescarPlan } = useSubscription()
  const [loading, setLoading] = useState(null)
  const [loadingPlanes, setLoadingPlanes] = useState(true)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [diasRestantes, setDiasRestantes] = useState(null)
  const [planes, setPlanes] = useState([])

  // CARGA DE PROTOCOLOS DE PLANES ACTUALES
  useEffect(() => {
    const cargarPlanes = async () => {
      try {
        setLoadingPlanes(true)
        const response = await api.get('/suscripciones/tipos-plan/')
        setPlanes(response.data.planes || [])
      } catch (err) {
        console.error('Error cargando planes:', err)
        // Fallback en caso de fallo en el servidor de suscripciones
        setPlanes([
          {
            id: 1,
            clave: 'gratis',
            nombre: 'FREE_TERMINAL',
            precio: 0,
            icono: '🆓',
            color: 'border-white/10',
            minutos_por_dia: 15,
            feedback_voz: false,
            analisis_angulos: false,
            historial_dias: 0,
            con_anuncios: true,
            popular: false,
          },
          {
            id: 2,
            clave: 'basico',
            nombre: 'BASIC_UNIT',
            precio: 25,
            icono: '⭐',
            color: 'border-yellow-400/20',
            minutos_por_dia: 60,
            feedback_voz: true,
            analisis_angulos: false,
            historial_dias: 7,
            con_anuncios: true,
            popular: true,
          },
          {
            id: 3,
            clave: 'premium',
            nombre: 'PREMIUM_ELITE',
            precio: 49,
            icono: '👑',
            color: 'border-yellow-400',
            minutos_por_dia: -1,
            feedback_voz: true,
            analisis_angulos: true,
            historial_dias: -1,
            con_anuncios: false,
            popular: false,
          },
        ])
      } finally {
        setLoadingPlanes(false)
      }
    }
    cargarPlanes()
  }, [])

  // SINCRONIZACIÓN DE TIEMPO RESTANTE
  useEffect(() => {
    if (planActual?.fecha_expiracion) {
      const expiracion = new Date(planActual.fecha_expiracion)
      const hoy = new Date()
      const diferencia = Math.ceil((expiracion - hoy) / (1000 * 60 * 60 * 24))
      setDiasRestantes(diferencia > 0 ? diferencia : 0)
    }
  }, [planActual])

  // VERIFICACIÓN DE RESPUESTA DE PASARELA DE PAGO (STRIPE)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const paymentSuccess = urlParams.get('success') === 'true'
    const sessionId = urlParams.get('session_id')

    if (paymentSuccess && sessionId) {
      verificarPagoStripe(sessionId)
    }

    if (paymentSuccess) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  const verificarPagoStripe = async (sessionId) => {
    try {
      const response = await planService.verificarSesionStripe(sessionId)
      if (response.plan_activated || response.payment_status === 'paid') {
        await refrescarPlan?.()
        showNotification('MEJORA_COMPLETADA: Módulo activado con éxito.', 'success')
        navigate('/')
      }
    } catch (err) {
      showNotification('ERROR_PAGO: Fallo en la comunicación con la pasarela.', 'error')
    }
  }

  const handlePagarStripe = async (planClave) => {
    if (planClave === 'gratis') return
    if (!isAuthenticated) {
      showNotification('AUTENTICACIÓN_REQUERIDA: Inicie sesión para continuar.', 'warning')
      setTimeout(() => navigate('/login'), 2000)
      return
    }

    setLoading(planClave)
    try {
      const response = await planService.iniciarPagoStripe(planClave)
      if (response?.url) window.location.href = response.url
    } catch (err) {
      showNotification('ERROR_PASARELA: Error al iniciar el protocolo de pago.', 'error')
      setLoading(null)
    }
  }

  const currentPlanKey = planActual?.plan_actual || 'gratis'

  if (loadingPlanes) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent animate-spin"></div>
        <p className="text-[10px] font-mono tracking-[0.5em] text-white/20 uppercase">
          CARGANDO_SUSCRIPCIONES_BIOS
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header con estética de Centro de Operaciones */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 text-[9px] font-black uppercase tracking-[0.4em] text-yellow-400">
            <Crown className="w-4 h-4" /> MÓDULOS DE MEJORA OPERATIVA
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase italic tracking-tighter block leading-tight">
            ELIGE TU <span className="text-yellow-400">PLAN</span>
          </h1>
          <p className="text-white/20 font-mono text-[9px] tracking-[0.3em] uppercase max-w-lg mx-auto leading-relaxed">
            SINCRONICE SU NIVEL DE PROCESAMIENTO BIOMECÁNICO PARA DESBLOQUEAR MÓDULOS AVANZADOS DE
            ENTRENAMIENTO.
          </p>
        </div>

        {/* Dashboard de Plan Actual Industrial */}
        <div className="flex flex-col items-center">
          <div className="bg-[#0f0f0f] border border-white/5 p-8 flex flex-col items-center text-center space-y-4 shadow-[15px_15px_0px_rgba(255,230,0,0.05)] w-full max-w-md">
            <p className="text-[8px] font-black text-white/20 tracking-[0.4em] uppercase">
              ARCHIVO_ACTIVO_DEL_ATLETA
            </p>
            <h3 className="text-2xl font-black italic uppercase italic tracking-tighter text-white">
              {(
                planes.find((p) => p.clave === currentPlanKey)?.nombre || 'FREE_TERMINAL'
              ).toUpperCase()}
            </h3>
            <div className="flex items-center gap-4 pt-4 border-t border-white/5 w-full justify-center">
              {diasRestantes !== null && currentPlanKey !== 'gratis' && (
                <div className="flex items-center gap-2 text-yellow-400 text-[10px] font-mono font-black tracking-widest uppercase">
                  <Clock className="w-4 h-4" /> {diasRestantes} DÍAS_RESTANTES
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Grid de módulos de Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 max-w-6xl mx-auto">
          {planes.map((plan, idx) => {
            const isCurrentPlan = currentPlanKey === plan.clave
            const isLoading = loading === plan.clave
            const isGratis = plan.precio === 0

            return (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={plan.id}
                className={cx(
                  'group bg-[#0f0f0f] border flex flex-col hover:border-yellow-400/50 transition-all duration-500 relative overflow-hidden',
                  plan.popular
                    ? 'border-yellow-400'
                    : isCurrentPlan
                      ? 'border-green-500/40'
                      : 'border-white/5'
                )}
              >
                {/* Indicador de popularidad industrial */}
                {plan.popular && (
                  <div className="absolute top-0 left-0 bg-yellow-400 text-black px-4 py-1 text-[8px] font-black italic tracking-widest flex items-center gap-2 uppercase">
                    <Flame className="w-3 h-3" /> MÓDULO_POPULAR
                  </div>
                )}

                {/* Status de plan activo en esquina */}
                {isCurrentPlan && (
                  <div className="absolute top-0 right-0 bg-green-500 text-white px-4 py-1 flex items-center gap-2 text-[8px] font-black tracking-widest uppercase italic">
                    <Check className="w-3 h-3" /> ACTIVO
                  </div>
                )}

                <div className="p-10 space-y-10 flex-1 flex flex-col justify-between">
                  {/* Visual & Precio */}
                  <div className="space-y-6 text-center">
                    <div className="text-6xl group-hover:scale-110 transition-transform duration-500">
                      {plan.icono}
                    </div>
                    <div>
                      <h3 className="text-2xl font-black italic uppercase italic tracking-tighter text-white">
                        {plan.nombre.toUpperCase()}
                      </h3>
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-1">
                        SYST_MODULE_{plan.id}
                      </p>
                    </div>
                    <div className="inline-block p-4 bg-white/[0.02] border border-white/5">
                      <span className="text-4xl font-black italic uppercase italic tracking-tighter text-yellow-400">
                        {plan.precio === 0 ? 'GRATIS' : `BS.${plan.precio}`}
                      </span>
                      {plan.precio > 0 && (
                        <span className="text-white/20 font-mono text-[9px] ml-2">/MENSUAL</span>
                      )}
                    </div>
                  </div>

                  {/* Lista de Características del Sistema */}
                  <div className="space-y-4">
                    <p className="text-[8px] font-black text-white/20 tracking-widest uppercase mb-4 border-b border-white/5 pb-2">
                      CARACTERÍSTICAS_TÉCNICAS
                    </p>
                    <ul className="space-y-3">
                      <FeatureItem
                        active={true}
                        text={
                          plan.minutos_por_dia === -1
                            ? 'TIEMPO_ILIMITADO_CORE'
                            : `${plan.minutos_por_dia}_MIN_DIARIOS`
                        }
                      />
                      <FeatureItem active={plan.feedback_voz} text="RETROALIMENTACIÓN_VOZ_IA" />
                      <FeatureItem active={plan.analisis_angulos} text="ANÁLISIS_CINEMÁTICO_ANG" />
                      <FeatureItem
                        active={!plan.con_anuncios}
                        text={
                          plan.con_anuncios
                            ? 'PUBLICIDAD_SISTEMA_ACTIVA'
                            : 'PROTOCOLOS_SIN_INTERRUPCIÓN'
                        }
                      />
                    </ul>
                  </div>

                  {/* Acciones del Módulo */}
                  <div className="pt-6">
                    {isCurrentPlan ? (
                      <button
                        disabled
                        className="w-full bg-green-500/10 border border-green-500/20 text-green-500 py-4 font-black uppercase text-[10px] tracking-widest italic cursor-not-allowed"
                      >
                        ✓ SINCRONIZADO
                      </button>
                    ) : (
                      <button
                        onClick={() => handlePagarStripe(plan.clave)}
                        disabled={isLoading || isGratis}
                        className={cx(
                          'w-full py-5 font-black uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 transition-all',
                          isGratis
                            ? 'bg-white/[0.05] text-white/20 cursor-not-allowed'
                            : 'bg-white text-black hover:bg-yellow-400 shadow-sm'
                        )}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> CONECTANDO_PASARELA...
                          </>
                        ) : isGratis ? (
                          'NIVEL_BASE_INICIADO'
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" /> ACTIVAR_PASARELA
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer de Seguridad y Protocolos */}
        <div className="pt-16 border-t border-white/5 grid md:grid-cols-3 gap-8 text-center md:text-left">
          <FooterBadge icon={Activity} text="ACCESO TOTAL A MÓDULOS DE FISIOTERAPIA Y GIMNASIO" />
          <FooterBadge icon={Lock} text="PROTOCOLOS DE SEGURIDAD ACTIVADOS POR STRIPE" />
          <FooterBadge icon={Cpu} text="POSIBILIDAD DE ABORTO DE SUSCRIPCIÓN EN CUALQUIER CICLO" />
        </div>

        <div className="text-center font-mono text-[8px] text-white/5 uppercase tracking-[0.5em] pt-8">
          SYSTEM_VCOACH_PLANS_ARCHIVE_VER_2.1_SYNC_VALID
        </div>
      </div>
    </div>
  )
}

// COMPONENTES SUBORDINADOS DE INTERFAZ
const FeatureItem = ({ active, text }) => (
  <li className="flex items-center gap-3 group/item">
    <div
      className={cx(
        'w-5 h-5 border flex items-center justify-center',
        active
          ? 'border-yellow-400/30 text-yellow-400 bg-yellow-400/5'
          : 'border-white/5 text-white/10'
      )}
    >
      {active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
    </div>
    <span
      className={cx(
        'text-[9px] font-mono tracking-tighter uppercase',
        active ? 'text-white/80' : 'text-white/10'
      )}
    >
      {text}
    </span>
  </li>
)

const FooterBadge = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-4 justify-center md:justify-start group">
    <div className="p-3 border border-white/5 bg-white/[0.02] text-white/20 group-hover:border-yellow-400/20 group-hover:text-yellow-400 transition-all">
      <Icon className="w-4 h-4" />
    </div>
    <span className="text-[9px] font-black tracking-widest text-white/40 uppercase max-w-[180px] leading-relaxed">
      {text}
    </span>
  </div>
)

const cx = (...c) => c.filter(Boolean).join(' ')
