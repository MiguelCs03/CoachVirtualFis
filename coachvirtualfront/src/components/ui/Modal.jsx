/**
 * Modal - Modal reutilizable
 */

import { X } from 'lucide-react';

export default function Modal({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    showCloseButton = true,
}) {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-2xl',
        lg: 'max-w-4xl',
        xl: 'max-w-6xl',
        full: 'max-w-[95vw]',
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[1000] animate-fadeIn"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
                <div
                    className={`relative bg-white rounded-2xl ${sizes[size]} w-full shadow-2xl animate-scaleIn max-h-[90vh] overflow-hidden flex flex-col`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    {(title || showCloseButton) && (
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            {title && (
                                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                            )}
                            {showCloseButton && (
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                    aria-label="Cerrar"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            )}
                        </div>
                    )}

                    {/* Content */}
                    <div className="p-6 overflow-y-auto flex-1">{children}</div>
                </div>
            </div>

            {/* Animations */}
            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
        </>
    );
}
