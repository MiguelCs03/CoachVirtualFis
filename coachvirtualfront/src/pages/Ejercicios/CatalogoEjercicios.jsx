import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Dumbbell, Activity, ShieldCheck, HelpCircle, Terminal, Eye, Sparkles, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../api/api'

const cx = (...c) => c.filter(Boolean).join(' ')

export default function CatalogoEjercicios() {
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState([])
  const [filteredExercises, setFilteredExercises] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedMuscleArea, setSelectedMuscleArea] = useState('TODOS')

  // Obtener todos los ejercicios desde el endpoint disponible
  const fetchExercises = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/ejercicios-disponibles/')
      // extraemos todos de la respuesta
      const allExercises = data.todos || []
      setExercises(allExercises)
      setFilteredExercises(allExercises)
    } catch (err) {
      console.error('Error cargando catálogo de ejercicios:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExercises()
  }, [])

  // Filtrado y búsqueda en tiempo real
  useEffect(() => {
    let result = exercises

    // Filtro por músculo / área
    if (selectedMuscleArea !== 'TODOS') {
      result = result.filter(ex => {
        const musculo = (ex.musculo || '').toUpperCase()
        const tipo = (ex.tipo || '').toUpperCase()
        
        if (selectedMuscleArea === 'BRAZOS') {
          return musculo.includes('BRAZO') || musculo.includes('BÍCEPS') || musculo.includes('TRÍCEPS') || musculo.includes('HOMBRO')
        }
        if (selectedMuscleArea === 'ESPALDA') {
          return musculo.includes('ESPALDA') || musculo.includes('DORSAL') || musculo.includes('REMO')
        }
        if (selectedMuscleArea === 'PIERNAS') {
          return musculo.includes('PIERNA') || musculo.includes('RODILLA') || musculo.includes('GLÚTEO') || musculo.includes('PUNTAS') || musculo.includes('TALÓN') || musculo.includes('SENTADILLA')
        }
        if (selectedMuscleArea === 'PECTORALES') {
          return musculo.includes('PECTORAL') || musculo.includes('PECHO')
        }
        return false
      })
    }

    // Búsqueda por término de texto
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      result = result.filter(ex => 
        ex.nombre.toLowerCase().includes(term) || 
        (ex.musculo || '').toLowerCase().includes(term)
      )
    }

    setFilteredExercises(result)
  }, [searchTerm, selectedMuscleArea, exercises])

  // Áreas musculares a predefinir
  const areas = ['TODOS', 'BRAZOS', 'ESPALDA', 'PIERNAS', 'PECTORALES']

  // Descripciones por defecto atractivas según el tipo de ejercicio
  const getExerciseTip = (ex) => {
    const name = ex.nombre.toLowerCase()
    if (name.includes('biceps') || name.includes('bíceps')) {
      return 'Mantenga los codos pegados a las costillas y evite balancear el tronco para un aislamiento total.'
    }
    if (name.includes('flexiones') || name.includes('pushup')) {
      return 'Mantenga el core activo y el cuerpo alineado de la cabeza a los talones durante toda la ejecución.'
    }
    if (name.includes('sentadillas') || name.includes('squat')) {
      return 'Empuje las rodillas hacia afuera y baje la cadera cuidando de no levantar los talones.'
    }
    if (name.includes('plancha') || name.includes('plank')) {
      return 'Alinee los antebrazos bajo los hombros y presione el suelo para estabilizar las escápulas.'
    }
    if (name.includes('remo')) {
      return 'Enfoque la tracción en llevar los codos hacia atrás rozando el abdomen sin encoger los hombros.'
    }
    return 'Mantenga una velocidad de movimiento controlada y asegure la técnica guiada en tiempo real.'
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header de la página */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-yellow-400 pl-6 py-2">
          <div>
            <div className="flex items-center gap-2 text-white/40 font-mono text-[9px] uppercase tracking-widest">
              <Link to="/home" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> PANEL
              </Link>
              <span>/</span>
              <span>CATÁLOGO DE EJERCICIOS</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mt-2">
              CATÁLOGO DE <span className="text-yellow-400">EJERCICIOS</span>
            </h1>
            <p className="text-white/40 font-mono text-[10px] tracking-[0.4em] mt-2 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" /> BANCO DE DATOS DE UNIDADES MOTORAS
            </p>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-[#0d0d0d] border border-white/5 p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Buscador de texto */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="BUSCAR EJERCICIO (EJ: BÍCEPS)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border-l-2 border-white/20 p-4 pl-12 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all placeholder:text-white/10 uppercase"
              />
              <Search className="w-4 h-4 text-white/30 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Filtros por áreas musculares */}
            <div className="flex flex-wrap gap-2 pt-2 md:pt-0">
              {areas.map((area) => (
                <button
                  key={area}
                  onClick={() => setSelectedMuscleArea(area)}
                  className={cx(
                    'px-5 py-3 font-mono text-[9px] tracking-widest border transition-all rounded-none uppercase font-bold',
                    selectedMuscleArea === area
                      ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_15px_rgba(255,230,0,0.15)]'
                      : 'bg-transparent border-white/5 text-white/50 hover:border-white/20'
                  )}
                >
                  {area}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de ejercicios filtrados */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex items-center gap-3 font-mono text-white/40 text-xs uppercase py-20 px-4">
              <div className="w-2 h-2 bg-yellow-400 animate-ping" /> CONECTANDO AL BANCO DE DATOS DE EJERCICIOS...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="border border-white/5 bg-[#0d0d0d] p-20 flex flex-col items-center text-center space-y-4">
              <Dumbbell className="w-10 h-10 text-white/25" />
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">SIN COINCIDENCIAS</h3>
                <p className="text-white/40 text-[9px] font-mono tracking-widest uppercase">No se han encontrado ejercicios de acuerdo al criterio ingresado.</p>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredExercises.map((ex) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={ex.id}
                    className="bg-[#0f0f0f] border border-white/10 group p-1 hover:border-yellow-400/50 hover:shadow-[15px_15px_0px_rgba(255,230,0,0.03)] transition-all flex flex-col justify-between"
                  >
                    <div className="p-6 space-y-6">
                      
                      {/* Cabecera */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1 min-w-0">
                          <span className="text-[7px] font-black px-2 py-0.5 tracking-[0.2em] uppercase bg-white/5 text-white/60">
                            {ex.tipo || 'GIMNASIO'}
                          </span>
                          <h3 className="text-lg font-black italic uppercase tracking-tighter leading-none pt-1 truncate text-white group-hover:text-yellow-400 transition-colors">
                            {ex.nombre}
                          </h3>
                        </div>
                        <span className="text-[8px] font-mono px-2 py-1 border border-white/5 text-white/40 rounded-none whitespace-nowrap uppercase">
                          {ex.musculo || 'S/N'}
                        </span>
                      </div>

                      {/* Imagen referencial */}
                      <div className="w-full h-32 bg-white/[0.02] border border-white/5 overflow-hidden relative flex items-center justify-center">
                        {ex.url ? (
                          <img
                            src={ex.url}
                            alt={ex.nombre}
                            className="w-full h-full object-cover filter grayscale opacity-40 group-hover:grayscale-0 group-hover:opacity-80 transition-all duration-500"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-white/10 gap-2">
                            <Dumbbell className="w-8 h-8" />
                            <span className="text-[8px] font-mono tracking-widest">IMAGEN_REFERENCIA_N/A</span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 border border-yellow-400/30 bg-yellow-400/10 px-2 py-0.5 text-[8px] font-black text-yellow-400 tracking-wider uppercase">
                          INCIDENCIA: {ex.porcentaje || '80%'}
                        </div>
                      </div>

                      {/* Tips Técnicos */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[8px] font-black tracking-widest text-white/30 uppercase">
                          <Sparkles className="w-3 h-3 text-yellow-400" /> CORRECCIÓN SUGERIDA (IA)
                        </div>
                        <p className="text-[10px] font-mono text-white/60 leading-relaxed uppercase">
                          {getExerciseTip(ex)}
                        </p>
                      </div>

                    </div>

                    <div className="px-6 pb-6 pt-2">
                      <div className="flex items-center gap-2 text-[9px] font-mono tracking-widest text-white/30 uppercase">
                        <ShieldCheck className="w-4 h-4 text-green-400" /> SINOPSIS BIOMÉTRICA ACTIVA
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
