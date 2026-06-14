import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

/**
 * Error Boundary - Captura errores de React y muestra un mensaje amigable
 * En lugar de una pantalla en blanco o oscura
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/home'
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl border border-white/20">
            {/* Icono de error */}
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-pulse">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>

            {/* Título */}
            <h1 className="text-2xl font-bold text-white mb-3">Error</h1>

            {/* Mensaje del error real */}
            {this.state.error && (
              <div className="mb-4 p-3 bg-black/40 rounded-lg overflow-auto max-h-28">
                <pre className="text-red-300 text-xs whitespace-pre-wrap font-mono">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            {/* Mensaje amigable */}
            <p className="text-gray-300 mb-6">
              Ocurrió un error inesperado. Puedes reintentar o volver al inicio.
            </p>

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all shadow-lg"
              >
                <RefreshCw className="w-5 h-5" />
                Reintentar
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-white/20 text-white font-semibold rounded-xl hover:bg-white/30 transition-all border border-white/30"
              >
                <Home className="w-5 h-5" />
                Ir al Inicio
              </button>
            </div>

            {/* Emoji de ánimo */}
            <p className="mt-6 text-4xl">💪</p>
            <p className="text-gray-400 text-sm mt-2">¡Tu entrenamiento te espera!</p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
