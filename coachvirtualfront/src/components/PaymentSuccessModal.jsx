/**
 * Modal de felicitación por pago exitoso
 * Se muestra en la página de inicio después de completar un pago
 */

import { useState, useEffect } from 'react';
import { Check, X, Sparkles } from 'lucide-react';

export default function PaymentSuccessModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        // Verificar si hay datos de pago exitoso en sessionStorage
        const storedData = sessionStorage.getItem('payment_success');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                setPaymentData(data);
                setIsOpen(true);
                // Limpiar después de mostrar
                sessionStorage.removeItem('payment_success');
            } catch (e) {
                console.error('Error parsing payment data:', e);
            }
        }
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        setPaymentData(null);
    };

    if (!isOpen || !paymentData) return null;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[2000] animate-fadeIn"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[2001] flex items-center justify-center p-4">
                <div
                    className="relative bg-gradient-to-br from-slate-800 via-purple-900 to-slate-800 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-white/20 animate-scaleIn"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    {/* Confetti animation placeholder */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-4 left-1/4 text-4xl animate-bounce">🎊</div>
                        <div className="absolute -top-4 right-1/4 text-4xl animate-bounce delay-100">🎉</div>
                        <div className="absolute top-1/3 left-0 text-2xl animate-pulse">✨</div>
                        <div className="absolute top-1/3 right-0 text-2xl animate-pulse delay-200">✨</div>
                    </div>

                    {/* Content */}
                    <div className="relative text-center">
                        {/* Icon */}
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mb-6 animate-pulse">
                            <Check className="w-10 h-10 text-white" />
                        </div>

                        {/* Plan Icon */}
                        <div className="text-6xl mb-4">{paymentData.planIcon}</div>

                        {/* Title */}
                        <h2 className="text-3xl font-extrabold text-white mb-2">
                            ¡Felicidades!
                        </h2>
                        <p className="text-xl text-purple-200 mb-1">
                            Has activado el plan
                        </p>
                        <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent mb-6">
                            {paymentData.planName}
                        </p>

                        {/* Features */}
                        <div className="bg-white/10 rounded-2xl p-5 mb-6">
                            <p className="text-sm text-gray-300 mb-3 flex items-center justify-center gap-2">
                                <Sparkles className="w-4 h-4 text-yellow-400" />
                                Ahora tienes acceso a:
                            </p>
                            <ul className="space-y-2">
                                {paymentData.features?.map((feature, index) => (
                                    <li
                                        key={index}
                                        className="flex items-center gap-2 text-white"
                                    >
                                        <span className="text-green-400">✓</span>
                                        <span className="text-sm">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA */}
                        <button
                            onClick={handleClose}
                            className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
                        >
                            ¡Comenzar a entrenar! 💪
                        </button>
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0; 
            transform: scale(0.9) translateY(20px);
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
        .delay-100 {
          animation-delay: 100ms;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
      `}</style>
        </>
    );
}
