import React, { useEffect, useState } from 'react';
import { iniciarPagoStripe } from '../../context/stripe';

function Pago() {
  const [status, setStatus] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success')) {
      setStatus('success');
    } else if (params.get('canceled')) {
      setStatus('canceled');
    }
  }, []);

  useEffect(() => {
    if (status === 'success' || status === 'canceled') {
      const timeout = setTimeout(() => setStatus(''), 2000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  const handlePago = () => {
    iniciarPagoStripe();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6">Pagar Suscripción</h2>
        {status === '' && (
          <>
            <p className="mb-4">Ingresa tus datos de tarjeta en la pasarela segura de Stripe.</p>
            <button
              onClick={handlePago}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded transition-colors duration-200"
            >
              Pagar con tarjeta
            </button>
          </>
        )}
        {status === 'success' && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-5 z-50 transition-all duration-300 cursor-pointer"
            onClick={() => setStatus('')}
          >
            <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center animate-bounceIn">
              <svg className="w-16 h-16 mb-4 text-green-500 animate-pop" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12l2 2l4-4" />
              </svg>
              <span className="text-2xl font-bold text-green-600 mb-2">¡Pago exitoso!</span>
              <p className="text-gray-700">Tu suscripción ha sido activada correctamente.</p>
            </div>
          </div>
        )}
        {status === 'canceled' && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-5 z-50 transition-all duration-300 cursor-pointer"
            onClick={() => setStatus('')}
          >
            <div className="bg-white p-8 rounded-lg shadow-2xl flex flex-col items-center animate-bounceIn">
              <svg className="w-16 h-16 mb-4 text-red-500 animate-pop" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 9l-6 6m0-6l6 6" />
              </svg>
              <span className="text-2xl font-bold text-red-600 mb-2">Pago cancelado o rechazado</span>
              <p className="text-gray-700">No se pudo completar el pago. Intenta nuevamente.</p>
            </div>
          </div>
        )}
    </div>
    </div>
  );
}

export default Pago;