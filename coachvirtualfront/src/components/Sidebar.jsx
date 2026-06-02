import React, { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { useSubscription } from '../context/SubscriptionContext'
import {
  Home,
  UserCircle2,
  Cpu,
  Users,
  Bell,
  Settings,
  LogOut,
  Dumbbell,
  Crown,
  Activity,
  ClipboardList,
  ListChecks,
  PlayCircle,
  Brain,
  ChevronDown,
  ChevronRight,
  Flower2,
  CreditCard,
  Wallet,
  History,
  Shield,
  Zap,
  Target,
  Terminal,
} from 'lucide-react'

const cx = (...c) => c.filter(Boolean).join(' ')

// Badge de plan con estilo industrial
function PlanBadge({ planActual, PLANES }) {
  const planNombre = planActual?.plan_nombre || planActual?.nombre || null
  const planKey = (planActual?.plan || planActual?.plan_actual || 'gratis').toLowerCase()

  const isPremium = planKey === 'premium' || planKey === 'estrella' || planKey === 'basico'
  const displayName = (planNombre || (planKey === 'gratis' ? 'ESTÁNDAR' : planKey)).toUpperCase()

  return (
    <div
      className={cx(
        'mx-4 mb-6 p-4 border-l-2 relative overflow-hidden group transition-all',
        isPremium
          ? 'border-yellow-400 bg-yellow-400/5 shadow-[5px_5px_0px_rgba(255,230,0,0.05)]'
          : 'border-white/20 bg-white/5'
      )}
    >
      <div className="flex items-center gap-3 relative z-10">
        <div
          className={cx(
            'w-8 h-8 flex items-center justify-center rounded-none',
            isPremium ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white/40'
          )}
        >
          {isPremium ? <Zap className="w-5 h-5 fill-current" /> : <Terminal className="w-4 h-4" />}
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black text-white/40 tracking-[0.2em] leading-none">
            STATUS DE OPERATIVIDAD
          </span>
          <span
            className={cx(
              'text-xs font-mono tracking-widest mt-1',
              isPremium ? 'text-yellow-400' : 'text-white'
            )}
          >
            {displayName}
          </span>
        </div>
      </div>
      {/* Glow para premium */}
      {isPremium && (
        <div className="absolute top-0 right-0 w-12 h-12 bg-yellow-400/10 blur-2xl rounded-full" />
      )}
    </div>
  )
}

export default function Sidebar({ open, onClose, closeOnNavigate = false }) {
  const { isSuper } = useAuth()
  const { planActual, PLANES } = useSubscription()
  const location = useLocation()
  const [muscleOpen, setMuscleOpen] = useState(false)
  const [pagosOpen, setPagosOpen] = useState(false)

  useEffect(() => {
    if (closeOnNavigate && onClose) onClose()
  }, [location.pathname, closeOnNavigate, onClose])

  const principal = useMemo(
    () => [
      { to: '/home', label: 'PANEL PRINCIPAL', icon: Home },
      { to: '/perfil', label: 'DATOS DEL ATLETA', icon: UserCircle2 },
      { to: '/catalogo-ejercicios', label: 'CATÁLOGO DE EJERCICIOS', icon: Dumbbell },
      { to: '/historial-sesiones', label: 'HISTORIAL DE SESIONES', icon: History },
      { to: '/planes', label: 'CENTRO DE MEJORAS', icon: Crown },
      { to: '/mis-alertas', label: 'CENTRO DE DATOS', icon: Bell },
    ],
    []
  )

  const admin = useMemo(
    () =>
      isSuper
        ? [
            { to: '/usuarios', label: 'GESTIÓN DE USUARIOS', icon: Users },
            { to: '/alertas', label: 'NOTIFICACIONES SISTEMA', icon: Bell },
          ]
        : [],
    [isSuper]
  )

  const pagosPackage = useMemo(
    () =>
      isSuper
        ? [
            { to: '/tipos-plan', label: 'CONFIG. DE PLANES', icon: Crown },
            { to: '/planes-admin', label: 'BASE SUSCRIPCIONES', icon: CreditCard },
            { to: '/historial-pagos', label: 'REGISTRO CONTABLE', icon: History },
            { to: '/metodos-pago', label: 'CANALES DE PAGO', icon: Wallet },
          ]
        : [],
    [isSuper]
  )

  const musclePackage = useMemo(
    () =>
      isSuper
        ? [
            { to: '/tipo', label: 'CATALOGACIÓN', icon: ClipboardList },
            { to: '/musculos', label: 'BIOMECÁNICA ATM', icon: Dumbbell },
            { to: '/banca-de-ejercicios', label: 'DEPÓSITO MOTOR', icon: Activity },
            { to: '/detalles-musculo', label: 'MAPEO MUSCULAR', icon: ListChecks },
            { to: '/ejercicios-asignados', label: 'PROTOCOLO ASIGNADO', icon: PlayCircle },
          ]
        : [],
    [isSuper]
  )

  return (
    <aside
      className={cx(
        'fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-[#0d0d0d] text-white z-40',
        'transition-transform duration-300 flex flex-col border-r border-white/10',
        'overflow-y-auto custom-scrollbar',
        open ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      <header className="px-6 py-4 flex items-center gap-3 border-b border-white/5 sticky top-0 bg-[#0d0d0d] z-20">
        <Target className="w-4 h-4 text-yellow-400" />
        <h2 className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white/60">
          SISTEMA INTEGRAL
        </h2>
      </header>

      <div className="mt-6">
        <PlanBadge planActual={planActual} PLANES={PLANES} />
      </div>

      <nav className="flex-1 px-4 pb-10 space-y-6">
        <div className="space-y-4">
          <SectionTitle>MÓDULOS BASE</SectionTitle>
          <ul className="space-y-1">
            {principal.map((i) => (
              <li key={i.to}>
                <NavItem to={i.to} icon={i.icon}>
                  {i.label}
                </NavItem>
              </li>
            ))}
          </ul>
        </div>

        {admin.length > 0 && (
          <div className="space-y-4">
            <SectionTitle>ADMINISTRACIÓN DE RED</SectionTitle>
            <ul className="space-y-1">
              {admin.map((i) => (
                <li key={i.to}>
                  <NavItem to={i.to} icon={i.icon}>
                    {i.label}
                  </NavItem>
                </li>
              ))}

              {pagosPackage.length > 0 && (
                <li>
                  <button
                    onClick={() => setPagosOpen(!pagosOpen)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 font-mono text-[10px] tracking-widest uppercase hover:bg-white/[0.03] transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Wallet className="w-4 h-4 text-white/40 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-white/60 group-hover:text-white transition-colors">
                        TESORERÍA
                      </span>
                    </span>
                    {pagosOpen ? (
                      <ChevronDown className="w-3 h-3 text-white/20" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white/20" />
                    )}
                  </button>
                  {pagosOpen && (
                    <ul className="mt-1 ml-4 border-l border-white/5 space-y-1">
                      {pagosPackage.map((i) => (
                        <li key={i.to}>
                          <NavItem to={i.to} icon={i.icon} sub>
                            {i.label}
                          </NavItem>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}

              {musclePackage.length > 0 && (
                <li>
                  <button
                    onClick={() => setMuscleOpen(!muscleOpen)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-3 font-mono text-[10px] tracking-widest uppercase hover:bg-white/[0.03] transition-all group"
                  >
                    <span className="flex items-center gap-3">
                      <Dumbbell className="w-4 h-4 text-white/40 group-hover:text-yellow-400 transition-colors" />
                      <span className="text-white/60 group-hover:text-white transition-colors">
                        INGENIERÍA
                      </span>
                    </span>
                    {muscleOpen ? (
                      <ChevronDown className="w-3 h-3 text-white/20" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-white/20" />
                    )}
                  </button>
                  {muscleOpen && (
                    <ul className="mt-1 ml-4 border-l border-white/5 space-y-1">
                      {musclePackage.map((i) => (
                        <li key={i.to}>
                          <NavItem to={i.to} icon={i.icon} sub>
                            {i.label}
                          </NavItem>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="pt-4 border-t border-white/5">
          <SectionTitle>SISTEMA</SectionTitle>
          <ul className="mt-4 space-y-1">
            <li>
              <NavItem to="/configuracion" icon={Settings}>
                AJUSTES
              </NavItem>
            </li>
            <li>
              <button
                onClick={() => {
                  /* handle logout if needed or just use Header */
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-mono tracking-widest text-red-500/60 hover:text-red-500 hover:bg-red-500/5 transition-all"
              >
                <LogOut className="w-4 h-4" />
                DESCONECTAR
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,230,0,0.1); }
      `}</style>
    </aside>
  )
}

function SectionTitle({ children }) {
  return (
    <div className="px-4 text-[9px] font-black uppercase tracking-[0.3em] text-white/20">
      {children}
    </div>
  )
}

function NavItem({ to, icon: Icon, children, sub = false }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cx(
          'group flex items-center gap-3 px-4 py-3 transition-all relative',
          isActive
            ? 'text-yellow-400 bg-yellow-400/5 font-bold'
            : 'text-white/40 hover:text-white hover:bg-white/[0.03]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-yellow-400 shadow-[2px_0_10px_rgba(255,230,0,0.5)]" />
          )}
          {Icon && (
            <Icon
              className={cx(
                'w-4 h-4 shrink-0 transition-colors',
                isActive ? 'text-yellow-400' : 'group-hover:text-white'
              )}
            />
          )}
          <span className="font-mono text-[10px] tracking-widest uppercase">{children}</span>
        </>
      )}
    </NavLink>
  )
}
