/**
 * LoadingSpinner - Indicador de carga reutilizable
 */

export default function LoadingSpinner({
    size = 'md',
    text = 'Cargando...',
    fullScreen = false,
    className = '',
}) {
    const sizes = {
        sm: 'w-6 h-6 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-16 h-16 border-4',
    };

    const spinner = (
        <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
            <div
                className={`${sizes[size]} border-white border-t-transparent rounded-full animate-spin`}
            />
            {text && <p className="text-white text-sm">{text}</p>}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
                {spinner}
            </div>
        );
    }

    return spinner;
}
