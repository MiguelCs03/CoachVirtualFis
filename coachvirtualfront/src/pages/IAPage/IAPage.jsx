import { useState } from "react";
import { fetchGroqCompletion } from "../../services/IA/groqClient";
import postureExamples from "../../data/posture_examples.json"
import { useSpeech } from "../../utils/useSpeech";
import { Bot, Settings, MessageSquare, Lightbulb, Sparkles, Square, XCircle, Volume2 } from 'lucide-react';


export default function IAPage() {
  // Estado para el formulario Groq
  const [prompt, setPrompt] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [model, setModel] = useState('llama-3.1-8b-instant') // Cambia por el modelo real que tengas habilitado
  const [autoVoice, setAutoVoice] = useState(true)
  const [selectedVoice, setSelectedVoice] = useState('')
  const { supported, speaking, voices, speak, stop } = useSpeech({ voiceName: selectedVoice, lang: 'es-ES', rate: 1 })

  // Puedes agregar más modelos si tienes acceso a otros
  const availableModels = [
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'llama-2-70b-4096', label: 'Llama 2 70B 4096' },
    // { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B 32768' },
    // ...otros modelos Groq
  ]

  // Manejar envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResponse('')
    try {
      // Construir prompt few-shot usando ejemplos de entrenamiento
      const maxExamples = 3
      const few = postureExamples.slice(0, maxExamples).map((ex, i) => {
        return `Ejemplo ${i + 1} - Entrada: ${ex.prompt}\nSalida: ${ex.completion}`
      }).join('\n\n')

      const combined = `${few}\n\nConsulta: ${prompt}\nRespuesta:`

      // Llamar al modelo con el prompt combinado
      const res = await fetchGroqCompletion({ prompt: combined, model })
      setResponse(res)
      if (autoVoice && supported) {
        speak(res)
      }
    } catch (err) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Bot className="w-10 h-10 text-blue-600" /> Asistente de IA
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Consulta con nuestro asistente inteligente para obtener respuestas personalizadas sobre postura y entrenamiento.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel de configuración y consulta */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <Settings className="w-6 h-6 mr-3" />
              Configuración
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selector de modelo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modelo de IA
                </label>
                <select
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  {availableModels.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              {/* Selector de voz */}
              {supported && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voz del asistente
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={e => setSelectedVoice(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value=''>Voz automática</option>
                    {voices.map(v => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Checkbox de voz automática */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoVoice"
                  checked={autoVoice}
                  onChange={e => setAutoVoice(e.target.checked)}
                  disabled={loading}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:cursor-not-allowed"
                />
                <label htmlFor="autoVoice" className="ml-3 text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Volume2 className="w-4 h-4" /> Leer respuesta automáticamente
                </label>
              </div>

              {/* Campo de consulta */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tu consulta
                </label>
                <textarea
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                  placeholder="¿Cómo puedo mejorar mi postura al trabajar? ¿Qué ejercicios me recomiendas?"
                  disabled={loading}
                  required
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Botones */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={loading || !prompt}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Consultar IA
                    </>
                  )}
                </button>

                {speaking && (
                  <button
                    type="button"
                    onClick={stop}
                    className="bg-red-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    Detener voz
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Panel de respuesta */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center">
              <MessageSquare className="w-6 h-6 mr-3" />
              Respuesta del Asistente
            </h2>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <XCircle className="w-5 h-5 text-red-500 mr-3" />
                  <div>
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Respuesta */}
            {response ? (
              <div className="bg-gray-900 rounded-lg p-6 text-gray-100 font-mono text-sm leading-relaxed max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-green-400 font-semibold flex items-center gap-2"><Bot className="w-5 h-5" /> Asistente IA:</span>
                  <span className="text-gray-400 text-xs">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="whitespace-pre-wrap">{response}</div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Bot className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">¡Listo para ayudarte!</h3>
                <p>Escribe tu consulta y presiona "Consultar IA" para recibir una respuesta personalizada.</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-12 text-center">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center justify-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" /> Consejos para mejores resultados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>Sé específico en tus consultas sobre postura y ejercicios</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>Menciona tu nivel de experiencia y objetivos</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>Pregunta sobre rutinas personalizadas</span>
              </div>
              <div className="flex items-start">
                <span className="mr-2">•</span>
                <span>Incluye detalles sobre lesiones o limitaciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
