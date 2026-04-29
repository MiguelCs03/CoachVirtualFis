import { useState } from 'react';
import { Link } from 'react-router-dom';
import BicepsCurl from './BicepsCurl';
import Squats from './Squats';
import Flexiones from './Flexiones';
import RotacionTronco from './RotacionTronco';
import Plancha from './Plancha';

export default function EjerciciosPage() {
  const [selectedExercise, setSelectedExercise] = useState('biceps');

  const exercises = [
    { 
      id: 'biceps', 
      name: 'Curl de Bíceps', 
      icon: '💪',
      color: 'indigo',
      description: 'Fortalece los bíceps'
    },
    { 
      id: 'squats', 
      name: 'Sentadillas', 
      icon: '🦵',
      color: 'emerald',
      description: 'Fortalece piernas y glúteos'
    },
    { 
      id: 'flexiones', 
      name: 'Flexiones de Pecho', 
      icon: '🏋️',
      color: 'orange',
      description: 'Fortalece pecho y tríceps'
    },
    { 
      id: 'plancha', 
      name: 'Plancha', 
      icon: '⏱️',
      color: 'teal',
      description: 'Resistencia de core'
    },
    { 
      id: 'rotacion', 
      name: 'Rotación de Tronco', 
      icon: '🔄',
      color: 'purple',
      description: 'Movilidad de columna (Fisioterapia)'
    }
  ];

  const renderSelectedExercise = () => {
    switch (selectedExercise) {
      case 'biceps':
        return <BicepsCurl />;
      case 'squats':
        return <Squats />;
      case 'flexiones':
        return <Flexiones />;
      case 'plancha':
        return <Plancha />;
      case 'rotacion':
        return <RotacionTronco />;
      default:
        return <BicepsCurl />;
    }
  };

  return (
    <div className="relative">
      {/* Selector flotante superior */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <div className="bg-white rounded-xl shadow-2xl p-4 backdrop-blur-sm bg-opacity-95">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏋️ Selecciona el Ejercicio
            </label>
            <div className="grid grid-cols-2 gap-3">
              {exercises.map((exercise) => {
                const isActive = selectedExercise === exercise.id;
                const bgColor = isActive 
                  ? exercise.color === 'indigo' ? 'bg-indigo-50 border-indigo-600'
                  : exercise.color === 'emerald' ? 'bg-emerald-50 border-emerald-600'
                  : exercise.color === 'orange' ? 'bg-orange-50 border-orange-600'
                  : exercise.color === 'teal' ? 'bg-teal-50 border-teal-600'
                  : exercise.color === 'purple' ? 'bg-purple-50 border-purple-600'
                  : 'bg-gray-50 border-gray-600'
                  : 'border-gray-200 hover:border-gray-400';
                
                return (
                  <button
                    key={exercise.id}
                    onClick={() => setSelectedExercise(exercise.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${bgColor}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-3xl">{exercise.icon}</div>
                      <div>
                        <div className="font-semibold">{exercise.name}</div>
                        <div className="text-xs text-gray-600">{exercise.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Botón de volver */}
      <div className="fixed bottom-6 right-6 z-50">
        <Link to="/">
          <button className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-3 px-6 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2">
            <span>←</span>
            <span>Volver al Inicio</span>
          </button>
        </Link>
      </div>

      {/* Renderizar ejercicio seleccionado */}
      <div className="mt-24">
        {renderSelectedExercise()}
      </div>
    </div>
  );
}
