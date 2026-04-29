import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PlayCircle, ArrowLeft, Clock, Activity } from 'lucide-react';

export default function EjercicioDetalleGenerico() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ejercicio = state || {};

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="text-sm text-gray-600 mb-4">← Volver</button>
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{ejercicio.nombre || ejercicio.title || 'Ejercicio'}</h1>
              <p className="text-sm text-gray-500 mt-1">{ejercicio.descripcion || ''}</p>
            </div>
            <div>
              <div className="text-sm text-gray-500 text-right">{ejercicio.duracion || '15 min'}</div>
              <button onClick={() => alert('Iniciando sesión del ejercicio')} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <PlayCircle className="w-5 h-5" /> Empezar
              </button>
            </div>
          </div>

          {ejercicio.url && (
            <div className="w-full h-64 bg-gray-100 rounded-md overflow-hidden mb-4">
              <img src={ejercicio.url} alt={ejercicio.nombre} className="w-full h-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Duración</div>
                <div className="font-semibold">{ejercicio.duracion || '15 min'}</div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
              <Activity className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Calorías</div>
                <div className="font-semibold">{ejercicio.calorias || '40 kcal'}</div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-2">Instrucciones</h4>
            <p className="text-sm text-gray-600">{ejercicio.instrucciones || 'Sigue la guía del ejercicio. Mantén postura y respiración correctas.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
