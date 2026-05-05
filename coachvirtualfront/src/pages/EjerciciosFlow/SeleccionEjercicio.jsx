import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Clock,
  Target,
  TrendingUp,
  Loader2,
  Zap,
  Shield,
  Activity,
  Terminal,
  Cpu,
  ChevronRight,
  Info,
} from 'lucide-react'
import detalleMusculoService from '../../services/detalleMusculoService'
import ejercicioService from '../../services/EjercicioService'
import tipoService from '../../services/tipoService'
import musculoService from '../../services/musculoService'

/**
 * VISTA DE SELECCCIÓN DE EJERCICIO INDUSTRIAL
 * Permite al usuario elegir un ejercicio específico dentro de una categoría y músculo.
 */
export default function SeleccionEjercicio() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const categoria = searchParams.get('categoria') // id tipo
  const parte = searchParams.get('parte') // id musculo

  const [breadcrumb, setBreadcrumb] = useState({ categoria: '', parte: '' })
  const [ejercicios, setEjercicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!categoria || !parte) {
      navigate('/ejercicios/categoria')
    } else {
      fetchEjercicios()
    }
  }, [categoria, parte, navigate])

  // Obtiene los ejercicios filtrados por categoría y músculo desde el backend
  const fetchEjercicios = async () => {
    try {
      setLoading(true)
      setError(null)

      // Obtener el nombre de la categoría y parte desde el backend
      const [tipos, musculos] = await Promise.all([tipoService.getAll(), musculoService.getAll()])

      const tipoActual = tipos.find((t) => t.id === parseInt(categoria))
      const musculoActual = musculos.find((m) => m.id === parseInt(parte))

      setBreadcrumb({
        categoria: tipoActual?.nombre || 'Categoría',
        parte: musculoActual?.nombre || 'Parte',
      })

      // Obtener todos los detalles y ejercicios
      const [detalles, ejerciciosData] = await Promise.all([
        detalleMusculoService.getAll(),
        ejercicioService.getAll(),
      ])

      const categoriaId = parseInt(categoria)
      const parteId = parseInt(parte)

      // Filtrar por músculo y por tipo (que viene desde el músculo)
      const ejerciciosFiltrados = detalles
        .filter((detalle) => {
          const musculoOk = detalle.musculo === parteId
          const tipoIdDetalle =
            detalle?.tipo?.id ?? detalle?.musculo_data?.tipo ?? detalle?.musculo_data?.tipo_data?.id

          const tipoOk = tipoIdDetalle === categoriaId
          return musculoOk && tipoOk
        })
        .map((detalle) => {
          const ejercicioId = detalle.ejercicio

          // Buscar el ejercicio completo por ID
          const ejercicioCompleto =
            ejerciciosData.find((ej) => ej.id === ejercicioId) || detalle?.ejercicio_data

          return {
            id: ejercicioId,
            detalleId: detalle.id,
            nombre: ejercicioCompleto?.nombre || `Ejercicio ${ejercicioId}`,
            descripcion: `Porcentaje de trabajo: ${detalle.porcentaje}%`,
            porcentaje: detalle.porcentaje,
            url: ejercicioCompleto?.url || '',
            duracion: '15 min',
            dificultad: getDificultadByPorcentaje(detalle.porcentaje),
            calorias: calcularCalorias(detalle.porcentaje),
          }
        })

      setEjercicios(ejerciciosFiltrados)
    } catch (err) {
      console.error('Error al cargar ejercicios:', err)
      setError('ERROR_FALLO_CONEXIÓN: No se pudieron sincronizar los datos del terminal.')
    } finally {
      setLoading(false)
    }
  }

  // Determinar dificultad basada en el porcentaje
  const getDificultadByPorcentaje = (porcentaje) => {
    const percent = parseInt(porcentaje)
    if (percent < 50) return 'Principiante'
    if (percent < 75) return 'Intermedio'
    return 'Avanzado'
  }

  // Calcular calorías aproximadas basadas en el porcentaje
  const calcularCalorias = (porcentaje) => {
    const percent = parseInt(porcentaje)
    const calorias = Math.round((percent / 100) * 200)
    return `${calorias} kcal`
  }

  // Maneja la navegación inteligente a la página específica de cada ejercicio
  const handleSelectEjercicio = (ejercicio) => {
    const nombreNorm = ejercicio.nombre
      .toLowerCase()
      .trim()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')

    const parteNombre = (breadcrumb.parte || '').toLowerCase()
    const isPectoral =
      parteNombre.includes('pecho') ||
      parteNombre.includes('pectoral') ||
      parteNombre.includes('pectorales')
    const isAbdominal =
      parteNombre.includes('abdominal') ||
      parteNombre.includes('abdomen') ||
      parteNombre.includes('abdominales')
    const isFisioterapia =
      (breadcrumb.categoria || '').toLowerCase().includes('fisio') ||
      (breadcrumb.categoria || '').toLowerCase().includes('fisioterapia')

    // Lógica de ruteo para fisioterapia
    if (isFisioterapia) {
      if (isAbdominal) {
        if (nombreNorm.includes('crunch') || nombreNorm.includes('invers')) {
          navigate('/categoria/fisioterapia/abdominales/crunch-inverso', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (
          (nombreNorm.includes('elev') || nombreNorm.includes('elevacion')) &&
          (nombreNorm.includes('pierna') || nombreNorm.includes('piernas'))
        ) {
          navigate('/categoria/fisioterapia/abdominales/elevacion-piernas', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
      }
      if (
        nombreNorm.includes('piern') ||
        nombreNorm.includes('glute') ||
        nombreNorm.includes('puente') ||
        nombreNorm.includes('sentad') ||
        nombreNorm.includes('talon') ||
        nombreNorm.includes('punta')
      ) {
        if (nombreNorm.includes('extension') || nombreNorm.includes('exten')) {
          navigate('/categoria/fisioterapia/rodilla/extension-piernas-atras', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('sentad')) {
          navigate('/categoria/fisioterapia/pierna/sentadillas', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (
          nombreNorm.includes('glute') ||
          (nombreNorm.includes('elev') && nombreNorm.includes('glute'))
        ) {
          navigate('/categoria/fisioterapia/pierna/elevacion-gluteos-suelo', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('puente')) {
          navigate('/categoria/fisioterapia/pierna/puente-gluteos', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('corta') && nombreNorm.includes('pierna')) {
          navigate('/categoria/fisioterapia/pierna/elevacion-corta-piernas', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('punta')) {
          navigate('/categoria/fisioterapia/pierna/elevacion-puntas-sentado', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('talon')) {
          navigate('/categoria/fisioterapia/pierna/elevacion-talones-sentado', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
      }
      if (nombreNorm.includes('rodill')) {
        if (nombreNorm.includes('flex') && nombreNorm.includes('pierna')) {
          navigate('/categoria/fisioterapia/rodilla/flexion-corta-pierna', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('flex') && nombreNorm.includes('rodill')) {
          navigate('/categoria/fisioterapia/rodilla/flexion-corta-pierna-rodilla', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('sentad')) {
          navigate('/categoria/fisioterapia/rodilla/sentadillas', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('elev') && nombreNorm.includes('rodill')) {
          navigate('/categoria/fisioterapia/rodilla/elevacion-rodillas', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
      }
      if (nombreNorm.includes('aducc')) {
        navigate('/categoria/fisioterapia/brazos/aduccion-hombros', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
        return
      }
      if (nombreNorm.includes('espald') || nombreNorm.includes('back')) {
        if (nombreNorm.includes('recta')) {
          navigate('/categoria/fisioterapia/espalda/espalda-recta', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('later') || nombreNorm.includes('cintura')) {
          navigate('/categoria/fisioterapia/espalda/estiramiento-laterales-cintura', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('inclin')) {
          navigate('/categoria/fisioterapia/espalda/inclinacion-lateral-tronco', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
        if (nombreNorm.includes('rot')) {
          navigate('/categoria/fisioterapia/espalda/rotacion-tronco-sentado', {
            state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
          })
          return
        }
      }
      if (nombreNorm.includes('yoga')) {
        navigate('/categoria/fisioterapia/espalda/estiramiento-yoga', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
        return
      }
    }

    // Gimnasio: Mapeos comunes
    if (nombreNorm.includes('bicep') || nombreNorm.includes('curl')) {
      navigate('/categoria/gimnasio/brazos/biceps-curl', {
        state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
      })
      return
    }
    if (nombreNorm.includes('flexion')) {
      if (isPectoral)
        navigate('/categoria/gimnasio/pectorales/flexiones', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
      else
        navigate('/categoria/gimnasio/brazos/flexiones', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
      return
    }
    if (nombreNorm.includes('press') && nombreNorm.includes('banca')) {
      if (isPectoral)
        navigate('/categoria/gimnasio/pectorales/press-banca', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
      else
        navigate('/categoria/gimnasio/brazos/press-banca', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
      return
    }
    if (nombreNorm.includes('remo')) {
      if (nombreNorm.includes('maquina')) {
        navigate('/categoria/gimnasio/espalda/remo-sentado-maquina', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
        return
      }
      if (nombreNorm.includes('mancuerna')) {
        navigate('/categoria/gimnasio/espalda/remo-con-mancuernas', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
        return
      }
      if (nombreNorm.includes('polea') && nombreNorm.includes('baja')) {
        navigate('/categoria/gimnasio/espalda/remo-sentado-polea-baja', {
          state: { imageUrl: ejercicio.url, nombre: ejercicio.nombre },
        })
        return
      }
    }

    // Fallback: usar página universal
    navigate(`/workout/exercise/${ejercicio.id}`, {
      state: {
        imageUrl: ejercicio.url,
        nombre: ejercicio.nombre,
        porcentaje: ejercicio.porcentaje,
      },
    })
  }

  const handleBack = () => {
    navigate(`/ejercicios/parte-cuerpo?categoria=${categoria}`)
  }

  return (
    <div className="min-h-screen bg-[#050505] p-6 lg:p-12 text-white font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Botón de retroceso Industrial */}
        <button
          onClick={handleBack}
          className="group flex items-center gap-3 text-white/40 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />{' '}
          RETROCEDER_MÓDULO
        </button>

        {/* Header con estilo Terminal */}
        <div className="space-y-4 border-l-4 border-yellow-400 pl-8">
          <div className="flex items-center gap-3 font-mono text-[9px] text-white/20 tracking-[0.4em]">
            <Cpu className="w-3 h-3 text-yellow-400" /> {breadcrumb.categoria.toUpperCase()} /{' '}
            {breadcrumb.parte.toUpperCase()}
          </div>
          <h1 className="text-5xl font-black italic uppercase italic tracking-tighter">
            PROTOCOLO DE <span className="text-yellow-400">{breadcrumb.parte}</span>
          </h1>
          <p className="text-white/40 font-mono text-[10px] tracking-widest uppercase">
            FILTRADO: SELECCIONE EL MÓDULO OPERATIVO PARA INICIAR EL PROCESAMIENTO BIOMECÁNICO.
          </p>
        </div>

        {/* Estado de carga */}
        {loading && (
          <div className="py-20 flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-yellow-400 border-t-transparent animate-spin" />
            <span className="text-[9px] font-mono tracking-[0.5em] text-white/20 animate-pulse">
              CARGANDO_BIOS...
            </span>
          </div>
        )}

        {/* Mensaje de error a nivel de terminal */}
        {error && !loading && (
          <div className="bg-red-500/5 border-l-2 border-red-500 p-8 space-y-4">
            <p className="text-red-400 font-mono text-xs uppercase tracking-tight">{error}</p>
            <button
              onClick={fetchEjercicios}
              className="px-6 py-2 border border-red-500/50 text-red-500 hover:bg-red-500 hover:text-white transition-all text-xs font-black uppercase tracking-widest"
            >
              REINTENTAR_SYNC
            </button>
          </div>
        )}

        {/* Estado vacío */}
        {!loading && !error && ejercicios.length === 0 && (
          <div className="bg-white/[0.02] border border-white/5 p-12 text-center space-y-4">
            <Info className="w-12 h-12 text-white/10 mx-auto" />
            <p className="text-white/40 font-mono text-xs uppercase tracking-widest">
              NULA_DISPONIBILIDAD: NO HAY MÓDULOS ACTIVOS PARA ESTA CONFIGURACIÓN.
            </p>
          </div>
        )}

        {/* Grid de ejercicios Industrial */}
        {!loading && !error && ejercicios.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1">
            {ejercicios.map((ejercicio, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                key={ejercicio.detalleId}
                className="group bg-[#0f0f0f] border border-white/5 flex flex-col hover:border-yellow-400/30 transition-all shadow-sm"
              >
                {/* Visual del ejercicio - Grayscale por defecto, color al hover */}
                <div className="h-48 relative overflow-hidden bg-black/40">
                  {ejercicio.url ? (
                    <img
                      src={ejercicio.url}
                      alt={ejercicio.nombre}
                      className="w-full h-full object-cover filter grayscale brightness-50 contrast-125 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10">
                      <Activity className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 border border-yellow-400/20 bg-black/60 px-2 py-1 flex items-center gap-2">
                    <span className="text-[8px] font-black tracking-widest text-yellow-400">
                      0{idx + 1}
                    </span>
                  </div>
                </div>

                {/* Contenido Industrial */}
                <div className="p-6 space-y-6 flex-1 flex flex-col">
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-lg font-black italic uppercase italic tracking-tighter text-white group-hover:text-yellow-400 transition-colors">
                        {ejercicio.nombre}
                      </h3>
                      <p className="text-[10px] font-mono text-white/40 uppercase tracking-tight mt-1">
                        {ejercicio.descripcion}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">
                          TIEMPO_EST
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <Clock className="w-3 h-3 text-yellow-400" />{' '}
                          {ejercicio.duracion.toUpperCase()}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">
                          QUEMA_CAL
                        </span>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <Zap className="w-3 h-3 text-yellow-400" />{' '}
                          {ejercicio.calorias.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                      <span className="text-[8px] font-black text-white/20 tracking-widest uppercase">
                        NIVEL_REQUERIDO
                      </span>
                      <span
                        className={cx(
                          'text-[9px] font-black uppercase tracking-widest px-2 py-1 border',
                          ejercicio.dificultad === 'Principiante'
                            ? 'border-green-500/20 text-green-500'
                            : ejercicio.dificultad === 'Intermedio'
                              ? 'border-yellow-400/20 text-yellow-400'
                              : 'border-red-500/20 text-red-500'
                        )}
                      >
                        {ejercicio.dificultad}
                      </span>
                    </div>
                  </div>

                  {/* Botón de acción - Terminal style */}
                  <button
                    onClick={() => handleSelectEjercicio(ejercicio)}
                    className="w-full bg-white text-black hover:bg-yellow-400 font-black py-4 transition-all flex items-center justify-center gap-3 uppercase text-[10px] tracking-[0.3em] group/btn"
                  >
                    INICIAR{' '}
                    <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Footer info Operativa */}
        <div className="pt-12 border-t border-white/5 flex justify-between items-center text-[9px] font-mono text-white/10 uppercase tracking-[0.4em]">
          <span>STATUS: SESIÓN_ACTIVA</span>
          <span>©2026 V-COACH TERMINAL</span>
        </div>
      </div>
    </div>
  )
}

const cx = (...c) => c.filter(Boolean).join(' ')
