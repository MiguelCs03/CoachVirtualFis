/**
 * StatCard - Tarjeta de estadísticas reutilizable
 * Usada en Home, Dashboard, y otras páginas
 */

import { TrendingUp, TrendingDown } from 'lucide-react';

export default function StatCard({
    icon: Icon,
    title,
    value,
    subtitle,
    trend,
    trendText,
    gradient = 'from-blue-500 to-blue-600',
    delay = 0,
    mounted = true,
}) {
    const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
    const trendColor = trend === 'up' ? 'text-green-300' : 'text-red-300';

    return (
        <div
            className={`bg-gradient-to-br ${gradient} rounded-xl shadow-lg p-6 text-white transform transition-all duration-700 hover:scale-105 hover:shadow-2xl ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
            style={{ transitionDelay: `${delay}ms` }}
        >
            <div className="flex items-center justify-between mb-2">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
                    {Icon && <Icon className="w-8 h-8" />}
                </div>
                {subtitle && (
                    <span className="text-xs text-white/80 font-semibold">{subtitle}</span>
                )}
            </div>
            <p className="text-4xl font-bold mb-1">{value}</p>
            <p className="text-sm text-white/90">{title}</p>
            {trendText && (
                <div className={`mt-3 flex items-center gap-1 text-xs ${trendColor}`}>
                    <TrendIcon className="w-3 h-3" />
                    <span>{trendText}</span>
                </div>
            )}
        </div>
    );
}
