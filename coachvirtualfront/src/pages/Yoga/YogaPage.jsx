import { useState } from 'react';
import { Link } from 'react-router-dom';
import Tadasana from './Tadasana';
import Trikonasana from './Trikonasana';
import Virabhadrasana from './Virabhadrasana';

export default function YogaPage() {
  const [selectedPose, setSelectedPose] = useState('tadasana');
  const [timer, setTimer] = useState(10);

  const poses = [
    { 
      id: 'tadasana', 
      name: 'Tadasana', 
      label: 'Postura de la Montaña',
      icon: '🧘‍♀️',
      color: 'purple'
    },
    { 
      id: 'trikonasana', 
      name: 'Trikonasana', 
      label: 'Postura del Triángulo',
      icon: '🔺',
      color: 'blue'
    },
    { 
      id: 'virabhadrasana', 
      name: 'Virabhadrasana', 
      label: 'Postura del Guerrero',
      icon: '⚔️',
      color: 'orange'
    }
  ];

  const timerOptions = [
    { value: 10, label: '10 segundos' },
    { value: 20, label: '20 segundos' },
    { value: 30, label: '30 segundos' },
    { value: 60, label: '60 segundos' }
  ];

  const renderSelectedPose = () => {
    switch (selectedPose) {
      case 'tadasana':
        return <Tadasana timer={timer} />;
      case 'trikonasana':
        return <Trikonasana timer={timer} />;
      case 'virabhadrasana':
        return <Virabhadrasana timer={timer} />;
      default:
        return <Tadasana timer={timer} />;
    }
  };

  return (
    <div className="relative">
      {/* Selector flotante superior */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-4xl px-4">
        <div className="bg-white rounded-xl shadow-2xl p-4 backdrop-blur-sm bg-opacity-95">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selector de postura */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🧘 Selecciona la Postura
              </label>
              <div className="grid grid-cols-3 gap-2">
                {poses.map((pose) => {
                  const isActive = selectedPose === pose.id;
                  const borderColor = isActive 
                    ? pose.color === 'purple' ? 'border-purple-600 bg-purple-50'
                    : pose.color === 'blue' ? 'border-blue-600 bg-blue-50'
                    : 'border-orange-600 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-400';
                  
                  return (
                    <button
                      key={pose.id}
                      onClick={() => setSelectedPose(pose.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${borderColor}`}
                    >
                      <div className="text-2xl mb-1">{pose.icon}</div>
                      <div className="text-xs font-medium">{pose.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de tiempo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ⏱️ Tiempo Objetivo
              </label>
              <div className="grid grid-cols-2 gap-2">
                {timerOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimer(option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      timer === option.value
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <div className="font-semibold">{option.label}</div>
                  </button>
                ))}
              </div>
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

      {/* Renderizar componente de postura seleccionada */}
      <div className="mt-24">
        {renderSelectedPose()}
      </div>
    </div>
  );
}
