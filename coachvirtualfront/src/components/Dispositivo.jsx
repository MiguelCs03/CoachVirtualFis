import React, { useEffect, useState } from 'react'
import { getGoogleFitStats, startStatsPolling } from '../services/dispositivoService'
import { Activity, Zap, RefreshCw, Smartphone, Cpu, ShieldAlert } from 'lucide-react'

/**
 * COMPONENTE DISPOSITIVO (ESTILO INDUSTRIAL)
 * Monitoreo remoto de constantes biométricas en tiempo real.
 */
function Dispositivo() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState(null)
  const [updatedAt, setUpdatedAt] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    // CARGA INICIAL DESDE CACHÉ LOCAL
    try {
      const cached = localStorage.getItem('gv_stats')
      const cachedAt = localStorage.getItem('gv_updated')
      if (cached) {
        setStats(JSON.parse(cached))
        if (cachedAt) setUpdatedAt(new Date(parseInt(cachedAt, 10)).toLocaleTimeString())
      }
    } catch {}

    const apply = (data) => {
      setStats(data)
      const now = Date.now()
      setUpdatedAt(new Date(now).toLocaleTimeString())
      try {
        localStorage.setItem('gv_stats', JSON.stringify(data))
        localStorage.setItem('gv_updated', String(now))
      } catch {}
    }

    const onErr = (e) => setError('ERROR_SYNC_DEVICE: Fallo en la conexión')

    // DISPARO DE SINCRONIZACIÓN INICIAL
    ;(async () => {
      try {
        const d = await getGoogleFitStats()
        apply(d)
      } catch {
        /* Error silenciado, el polling lo manejará */
      }
    })()

    // POLLING DE TELEMETRÍA (Intervalo de 10s para modo industrial)
    let stop = startStatsPolling(apply, onErr, 10000)
    return () => stop && stop()
  }, [])

  const refreshNow = async () => {
    setBusy(true)
    try {
      const d = await getGoogleFitStats()
      const now = Date.now()
      setStats(d)
      setUpdatedAt(new Date(now).toLocaleTimeString())
      localStorage.setItem('gv_stats', JSON.stringify(d))
      localStorage.setItem('gv_updated', String(now))
      setError(null)
    } catch {
      setError('RECONECTANDO_DISPOSITIVO...')
    }
    setBusy(false)
  }

  const goal = 10000
  const pct = Math.min(100, Math.round(((stats?.steps || 0) / goal) * 100))

  return (
    <div className="fixed top-24 right-6 w-80 bg-[#0d0d0d] border border-white/10 shadow-[20px_20px_0px_rgba(255,230,0,0.03)] p-6 z-[60] font-mono">
      {/* Header del Dispositivo */}
      <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
        <div className="flex items-center gap-3">
          <Smartphone className="w-4 h-4 text-yellow-400" />
          <h2 className="text-[10px] font-black tracking-[0.3em] text-white/40 uppercase">
            TELEMETRÍA_REMOTA
          </h2>
        </div>
        <button
          onClick={refreshNow}
          disabled={busy}
          className={`p-2 border transition-all ${busy ? 'border-yellow-400/20 text-yellow-400 animate-spin' : 'border-white/10 text-white/40 hover:text-white hover:border-yellow-400/50'}`}
          title="Sincronizar ahora"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <ShieldAlert className="w-3 h-3 text-red-500" />
          <span className="text-[8px] font-black text-red-500 tracking-widest uppercase">
            {error}
          </span>
        </div>
      )}

      {stats ? (
        <div className="space-y-6">
          {/* Módulo de Pasos (Operativo) */}
          <div className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-[9px] text-white/30 tracking-widest uppercase italic">
                UNIDADES_DESPLAZAMIENTO
              </span>
              <span className="text-xl font-black text-white italic tracking-tighter">
                {stats.steps?.toLocaleString?.() || stats.steps}
              </span>
            </div>

            <div className="relative h-1 w-full bg-white/5 overflow-hidden">
              <div
                className="absolute h-full bg-yellow-400 shadow-[0_0_10px_rgba(255,230,0,0.5)] transition-all duration-1000"
                style={{ width: pct + '%' }}
              />
            </div>

            <div className="flex justify-between text-[8px] font-black tracking-widest text-white/10 uppercase">
              <span>MGR: {goal.toLocaleString()}</span>
              <span className={pct >= 100 ? 'text-yellow-400' : ''}>{pct}%_COMPLETADO</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            {/* Calorías (Consumo Energético) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/20">
                <Zap className="w-3 h-3" />
                <span className="text-[7px] font-black tracking-widest uppercase">
                  ENERGÍA_KCAL
                </span>
              </div>
              <div className="text-lg font-black text-orange-500 italic tracking-tighter">
                {stats.calories?.toLocaleString?.() || stats.calories}
              </div>
            </div>

            {/* Frecuencia Cardíaca (BPM) */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white/20">
                <Activity className="w-3 h-3" />
                <span className="text-[7px] font-black tracking-widest uppercase">PULSO_BPM</span>
              </div>
              <div className="text-lg font-black text-red-500 italic tracking-tighter animate-pulse">
                {stats.heartRate || '--'} <span className="text-[10px] opacity-20">SYS</span>
              </div>
            </div>
          </div>

          {/* Footer del Módulo */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cpu className="w-3 h-3 text-white/10" />
              <span className="text-[7px] font-black text-white/10 tracking-widest uppercase italic">
                SYNC_TIME: {updatedAt || '--:--'}
              </span>
            </div>
            <div className="w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="h-1 w-full bg-white/5 animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-8 bg-white/5 animate-pulse" />
            <div className="h-8 bg-white/5 animate-pulse" />
          </div>
          <p className="text-[8px] font-black text-white/10 tracking-widest uppercase text-center mt-4">
            BUSCANDO_CANALES_DATOS...
          </p>
        </div>
      )}
    </div>
  )
}

export default Dispositivo
