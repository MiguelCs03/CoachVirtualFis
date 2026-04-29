/**
 * Button - Botón reutilizable con variantes
 */

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    disabled = false,
    className = '',
    onClick,
    type = 'button',
    fullWidth = false,
}) {
    const variants = {
        primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white',
        secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-800',
        success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white',
        danger: 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
        outline: 'border-2 border-gray-300 hover:border-gray-400 bg-transparent text-gray-700',
    };

    const sizes = {
        sm: 'py-2 px-3 text-sm',
        md: 'py-3 px-4 text-base',
        lg: 'py-4 px-6 text-lg',
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        font-bold rounded-xl transition-all duration-300 
        flex items-center justify-center gap-2 
        shadow-lg hover:shadow-xl transform hover:scale-[1.02]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${className}
      `}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
                    {children}
                    {Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
                </>
            )}
        </button>
    );
}
