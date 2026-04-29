import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RoutineService from '../../services/RoutineService';
import { PlayCircle, ArrowLeft, Clock, Activity, Target } from 'lucide-react';
import routeForExercise from '../../utils/exerciseRouter';
// import { useNavigate } from 'react-router-dom';

export default function DetalleRutina() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rutina, setRutina] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await RoutineService.getById(id);
        // si data tiene datos embebidos en string, tratar de parsear
        if (data && typeof data === 'string') {
          try { setRutina(JSON.parse(data)); }
          catch { setRutina(null); }
        } else {
          setRutina(data);
        }
      } catch (err) {
        console.error('Error cargando rutina:', err);
        setRutina(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleBack = () => navigate('/home');

  const handleStartExercise = (ej) => {
    const route = routeForExercise(ej);
    if (route && route.path) {
      navigate(route.path, { state: { imageUrl: ej.url, nombre: ej.nombre } });
      return;
    }
    // fallback: abrir la página genérica con los datos
    navigate('/ejercicio/generico', { state: ej });
  };

  if (loading) return <div className="p-6">Cargando rutina…</div>;
  if (!rutina) return (
    <div className="p-6">
      <button onClick={handleBack} className="mb-4">← Volver</button>
      <div>No se encontró la rutina.</div>
    </div>
  );

  // datos_rutina esperado: array de { id, nombre, url, ... }
  const ejercicios = rutina.datos_rutina || rutina.exercises || rutina.datos || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <button onClick={handleBack} className="text-sm text-gray-600 mb-1">← Volver</button>
            <h1 className="text-3xl font-bold">{rutina.nombre || 'Rutina'}</h1>
            <div className="text-sm text-gray-500">{(rutina.categoria || '')?.toString()}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">{ejercicios.length} ejercicios</div>
            <button onClick={() => alert('Empezando la rutina...')} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <PlayCircle className="w-5 h-5" /> Empezar
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {ejercicios.map((ej, idx) => (
            <div key={ej.id || idx} className="bg-white rounded-xl shadow p-4">
              {ej.url ? (
                <div className="w-full h-40 bg-gray-100 rounded-md mb-3 overflow-hidden">
                  <img src={ej.url} alt={ej.nombre} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-purple-50 rounded-md mb-3 flex items-center justify-center text-gray-300">Imagen</div>
              )}

              <h3 className="text-lg font-semibold mb-1">{ej.nombre || ej.title || `Ejercicio ${ej.id || idx}`}</h3>
              <p className="text-sm text-gray-500 mb-3">{ej.descripcion || ej.porcentaje ? `Porcentaje: ${ej.porcentaje || ''}` : ''}</p>

              <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-2 bg-blue-50 p-2 rounded-md">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{ej.duracion || '15 min'}</span>
                </div>
                <div className="flex items-center gap-2 bg-green-50 p-2 rounded-md">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span>{ej.calorias || '40 kcal'}</span>
                </div>
              </div>

              <button onClick={() => handleStartExercise(ej)} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg flex items-center justify-center gap-2">
                <PlayCircle className="w-5 h-5" /> Comenzar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
