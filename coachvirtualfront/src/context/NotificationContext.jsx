import React, { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Zap,
  ShieldCheck,
  Activity,
} from 'lucide-react'

const NotificationContext = createContext()

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

const iconMap = {
  success: <CheckCircle2 className="w-5 h-5 text-yellow-400" />,
  error: <XCircle className="w-5 h-5 text-red-500" />,
  warning: <AlertTriangle className="w-5 h-5 text-orange-400" />,
  info: <Info className="w-5 h-5 text-blue-400" />,
}

const borderMap = {
  success: 'border-yellow-400',
  error: 'border-red-500',
  warning: 'border-orange-400',
  info: 'border-blue-400',
}

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now()
    setNotifications((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, duration)
  }, [])

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {/* Container de Notificaciones */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-4 w-full max-w-sm pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ x: 100, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: 100, opacity: 0, scale: 0.9 }}
              className={`pointer-events-auto relative overflow-hidden bg-[#0f0f0f] border-l-4 ${borderMap[n.type]} p-5 shadow-[10px_10px_0px_rgba(0,0,0,0.5)] flex items-start gap-4`}
            >
              {/* Fondo decorativo industrial */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent pointer-events-none" />

              <div className="mt-1 flex-shrink-0">{iconMap[n.type]}</div>

              <div className="flex-1 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  Sistema v.2.4 // {n.type}
                </p>
                <p className="text-white font-mono text-xs leading-relaxed">{n.message}</p>
              </div>

              <button
                onClick={() => removeNotification(n.id)}
                className="text-white/20 hover:text-white transition-colors"
                aria-label="Cerrar notificación"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Barra de progreso visual (opcional) */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 4, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-[1px] ${borderMap[n.type].replace('border-', 'bg-')}`}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  )
}
