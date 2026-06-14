import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Terminal } from 'lucide-react'
import BicepsCurl from './BicepsCurl'
import Squats from './Squats'
import Flexiones from './Flexiones'
import RotacionTronco from './RotacionTronco'
import Plancha from './Plancha'

export default function EjerciciosPage() {
  const location = useLocation()
  const [selectedExercise, setSelectedExercise] = useState('biceps')

  useEffect(() => {
    if (location.state?.initialExercise) {
      setSelectedExercise(location.state.initialExercise)
    }
  }, [location.state])

  const exercises = [
    {
      id: 'biceps',
      name: 'Curl de Bíceps',
      icon: '💪',
      color: 'indigo',
      description: 'Fortalece los bíceps',
    },
    {
      id: 'squats',
      name: 'Sentadillas',
      icon: '🦵',
      color: 'emerald',
      description: 'Fortalece piernas y glúteos',
    },
    {
      id: 'flexiones',
      name: 'Flexiones de Pecho',
      icon: '🏋️',
      color: 'orange',
      description: 'Fortalece pecho y tríceps',
    },
    {
      id: 'plancha',
      name: 'Plancha',
      icon: '⏱️',
      color: 'teal',
      description: 'Resistencia de core',
    },
    {
      id: 'rotacion',
      name: 'Rotación de Tronco',
      icon: '🔄',
      color: 'purple',
      description: 'Movilidad de columna (Fisioterapia)',
    },
  ]

  const renderSelectedExercise = () => {
    switch (selectedExercise) {
      case 'biceps':
        return <BicepsCurl />
      case 'squats':
        return <Squats />
      case 'flexiones':
        return <Flexiones />
      case 'plancha':
        return <Plancha />
      case 'rotacion':
        return <RotacionTronco />
      default:
        return <BicepsCurl />
    }
  }

  return (
    <div className="relative min-h-screen bg-[#050505] text-white">
      {/* Selector flotante superior */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-black/95 border border-white/10 rounded-none p-4 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.85)] relative overflow-hidden">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-yellow-400" />
          
          <div>
            <label className="block text-[10px] font-black text-white/40 tracking-widest uppercase mb-3 flex items-center gap-2 font-mono">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" /> [MODO_PRÁCTICA_AMATEUR] SELECCIONA UNIDAD
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono">
              {exercises.map((exercise) => {
                const isActive = selectedExercise === exercise.id
                return (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    className={`p-2.5 border transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer rounded-none uppercase ${
                      isActive
                        ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.15)] font-bold'
                        : 'bg-white/[0.01] border-white/5 text-white/50 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span className="text-xl">{exercise.icon}</span>
                    <span className="text-[8px] tracking-wider truncate max-w-full font-bold">{exercise.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de volver */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link to="/catalogo-ejercicios">
          <button className="bg-[#0d0d0d] border border-white/10 hover:border-yellow-400 hover:text-yellow-400 text-white font-mono text-[9px] font-black uppercase tracking-widest py-3 px-6 rounded-none shadow-[10px_10px_0px_rgba(0,0,0,0.4)] transition-all transform hover:scale-105 flex items-center gap-1.5 cursor-pointer">
            <span>&lt; VOLVER AL CATÁLOGO</span>
          </button>
        </Link>
      </div>

      {/* Renderizar ejercicio seleccionado */}
      <div className="pt-36">{renderSelectedExercise()}</div>
    </div>
  )
}
