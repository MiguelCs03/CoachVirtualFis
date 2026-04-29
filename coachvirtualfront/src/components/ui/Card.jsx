/**
 * Card - Tarjeta base reutilizable
 */

export default function Card({
    children,
    className = '',
    padding = 'p-6',
    hover = true,
    onClick,
}) {
    return (
        <div
            className={`bg-white rounded-xl shadow-xl border border-gray-100 ${padding} ${hover ? 'transition-all duration-300 hover:shadow-2xl hover:scale-[1.02]' : ''
                } ${onClick ? 'cursor-pointer' : ''} ${className}`}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
