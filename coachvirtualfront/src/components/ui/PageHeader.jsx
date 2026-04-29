/**
 * PageHeader - Encabezado de página reutilizable
 */

import { Sparkles } from 'lucide-react';

export default function PageHeader({
    title,
    subtitle,
    icon: Icon,
    showSparkles = false,
    mounted = true,
    className = '',
}) {
    return (
        <div
            className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                } ${className}`}
        >
            <div className="flex items-center gap-3 mb-2">
                {Icon && (
                    <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
                        <Icon className="w-6 h-6 text-white" />
                    </div>
                )}
                <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {title}
                </h1>
                {showSparkles && (
                    <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                )}
            </div>
            {subtitle && <p className="text-gray-600 text-lg">{subtitle}</p>}
        </div>
    );
}
