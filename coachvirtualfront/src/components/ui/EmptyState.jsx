/**
 * EmptyState - Estado vacío reutilizable
 * Para cuando no hay datos que mostrar
 */

import { Activity, ChevronRight } from 'lucide-react';

export default function EmptyState({
    icon: Icon = Activity,
    title = 'No hay datos',
    description = 'Aún no tienes datos para mostrar.',
    actionText,
    onAction,
    className = '',
}) {
    return (
        <div className={`text-center py-16 relative ${className}`}>
            {/* Efectos de fondo */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl opacity-50" />

            <div className="relative z-10">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full w-28 h-28 mx-auto mb-6 flex items-center justify-center shadow-xl animate-pulse">
                    <Icon className="w-14 h-14 text-white" />
                </div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
                    {title}
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
                    {description}
                </p>
                {actionText && onAction && (
                    <button
                        onClick={onAction}
                        className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 inline-flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:scale-105"
                    >
                        <span className="text-lg">{actionText}</span>
                        <ChevronRight className="w-6 h-6" />
                    </button>
                )}
            </div>
        </div>
    );
}
