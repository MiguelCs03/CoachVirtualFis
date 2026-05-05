import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dumbbell,
  Heart,
  Activity,
  Loader2,
  Zap,
  ArrowRight,
  ChevronRight,
  Shield,
  Target,
  Terminal,
} from 'lucide-react'
import tipoService from '../../services/TipoService'
import { useNotification } from '../../context/NotificationContext'

export default function CategoriaEjercicios() {
  const navigate = useNavigate()
  const { showNotification } = useNotification()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const iconMapping = {
    gimnasio: Dumbbell,
    fisioterapia: Activity,
    default: Target,
  }

  useEffect(() => {
    fetchCategorias()
  }, [])

  const fetchCategorias = async () => {
    try {
      setLoading(true)
      setError(null)
      const tipos = await tipoService.listActivos()
      const categoriasFormateadas = tipos.map((tipo, index) => {
        const nombreLower = tipo.nombre.toLowerCase()
        const icon = iconMapping[nombreLower] || iconMapping['default']
        return {
          id: tipo.id,
          nombre: tipo.nombre.toUpperCase(),
          descripcion: (tipo.descripcion || `UNIDAD_ENTRENAMIENTO_${tipo.nombre}`).toUpperCase(),
          icon: icon,
        }
      })
      setCategorias(categoriasFormateadas)
    } catch (err) {
      setError('ERROR_FALLO_INDEXACIÓN_DATOS')
      showNotification('Fallo al recuperar categorías del núcleo central.', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectCategoria = (categoriaId) => {
    navigate(`/ejercicios/parte-cuerpo?categoria=${categoriaId}`)
  }

  return (
    <div className="min-h-screen bg-[#050505] py-20 px-6 font-sans text-white">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header Seccion */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="border-l-4 border-yellow-400 pl-8"
        >
          <div className="flex items-center gap-2 text-yellow-400 font-mono text-[10px] tracking-[0.5em] mb-4">
            <Terminal className="w-3 h-3" />
            <span>SISTEMA_CATEGORIZACIÓN_UNIDADES</span>
          </div>
          <h1 className="text-6xl font-black italic uppercase italic tracking-tighter leading-none">
            DIRECTORIO DE <span className="text-yellow-400">ACTIVIDAD</span>
          </h1>
          <p className="text-white/40 font-mono text-xs tracking-widest mt-4">
            SELECCIONE EL MÓDULO OPERATIVO PARA INICIAR EL FILTRADO BIOMECÁNICO.
          </p>
        </motion.div>

        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col justify-center items-center py-32 space-y-6"
            >
              <Loader2 className="w-16 h-16 text-yellow-400 animate-spin" />
              <span className="text-[10px] font-mono tracking-[0.4em] text-white/20">
                ACCEDIENDO AL BANCO DE DATOS...
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error state */}
        {error && !loading && (
          <div className="bg-red-500/5 border border-red-500/20 p-12 text-center space-y-6">
            <p className="text-red-500 font-mono text-sm tracking-widest">{error}</p>
            <button
              onClick={fetchCategorias}
              className="px-10 py-4 bg-red-500 text-white font-black text-xs uppercase tracking-[0.3em] hover:bg-white hover:text-red-500 transition-all"
            >
              REINTENTAR SINCRONIZACIÓN
            </button>
          </div>
        )}

        {/* Cards de categorías */}
        {!loading && !error && (
          <div className="grid md:grid-cols-2 gap-8">
            {categorias.map((categoria, i) => {
              const Icon = categoria.icon
              return (
                <motion.button
                  key={categoria.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  onClick={() => handleSelectCategoria(categoria.id)}
                  className="group relative bg-[#0f0f0f] border border-white/10 p-1 shadow-[15px_15px_0px_rgba(255,230,0,0.05)] hover:shadow-[15px_15px_0px_rgba(255,230,0,0.2)] transition-all overflow-hidden text-left"
                >
                  <div className="p-10 space-y-8 relative z-10">
                    <div className="flex justify-between items-start">
                      <div className="p-5 bg-white/[0.03] border border-white/5 group-hover:bg-yellow-400 group-hover:text-black transition-all">
                        <Icon className="w-10 h-10" />
                      </div>
                      <Zap className="w-4 h-4 text-white/10 group-hover:text-yellow-400 transition-colors" />
                    </div>

                    <div className="space-y-4">
                      <h2 className="text-3xl font-black italic uppercase italic tracking-tighter">
                        {categoria.nombre}
                      </h2>
                      <p className="text-white/40 font-mono text-xs leading-relaxed uppercase tracking-tighter">
                        {categoria.descripcion}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 text-yellow-400/40 font-black text-[10px] tracking-[0.3em] group-hover:text-yellow-400 transition-colors">
                      <span>INICIAR PROTOCOLO</span>
                      <div className="flex-1 h-[1px] bg-white/5 group-hover:bg-yellow-400/20 transition-all" />
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>

                  {/* Background decal */}
                  <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Icon className="w-64 h-64 rotate-[-15deg] transition-transform group-hover:scale-110" />
                  </div>
                </motion.button>
              )
            })}
          </div>
        )}

        {/* Footer info */}
        <div className="pt-20 border-t border-white/5 flex flex-col items-center gap-6">
          <Shield className="w-8 h-8 text-white/10" />
          <p className="text-white/20 font-mono text-[9px] tracking-[0.5em] uppercase text-center max-w-lg leading-relaxed">
            TIPS: SELECCIONE LA UNIDAD DE TRABAJO BASADO EN SU OBJETIVO DE RENDIMIENTO U
            OPTIMIZACIÓN FISIOLÓGICA.
          </p>
        </div>
      </div>
    </div>
  )
}
