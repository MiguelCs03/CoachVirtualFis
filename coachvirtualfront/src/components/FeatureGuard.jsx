import { useSubscription } from '../context/SubscriptionContext';
import { useNavigate } from 'react-router-dom';

export default function FeatureGuard({ feature, children, fallback }) {
  const { puedeUsar, subscriptionsEnabled, planActual } = useSubscription();
  const navigate = useNavigate();

  // Si el sistema no está activo, mostrar todo
  if (!subscriptionsEnabled) {
    return children;
  }

  // Si puede usar la feature, mostrar el contenido
  if (puedeUsar(feature)) {
    return children;
  }

  // Si no puede usar, mostrar fallback o mensaje de upgrade
  if (fallback) {
    return fallback;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-6 text-center">
      <div className="text-5xl mb-3">🔒</div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        Función Premium
      </h3>
      <p className="text-gray-600 mb-4">
        Esta característica requiere un plan superior para ser utilizada.
      </p>
      <p className="text-sm text-gray-500 mb-4">
        Tu plan actual: <span className="font-semibold text-purple-600">{planActual?.plan_nombre || 'Gratis'}</span>
      </p>
      <button
        onClick={() => navigate('/planes')}
        className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-full font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
      >
        Ver Planes Premium
      </button>
    </div>
  );
}
