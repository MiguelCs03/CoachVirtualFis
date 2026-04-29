// Hook simple para síntesis de voz usando la Web Speech API
import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeech({ voiceName, rate = 1, pitch = 1, lang = 'es-ES' } = {}) {
  const [supported, setSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voices, setVoices] = useState([])
  const utteranceRef = useRef(null)

  // Cargar voces
  useEffect(() => {
    function loadVoices() {
      const list = window.speechSynthesis?.getVoices?.() || []
      setVoices(list)
      setSupported(list.length > 0)
    }
    loadVoices()
    window.speechSynthesis?.addEventListener?.('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis?.removeEventListener?.('voiceschanged', loadVoices)
    }
  }, [])

  const speak = useCallback((text) => {
    if (!window.speechSynthesis) return
    if (!text) return
    // Cancelar lo anterior
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.pitch = pitch
    u.lang = lang
    if (voiceName) {
      const v = voices.find(v => v.name === voiceName)
      if (v) u.voice = v
    }
    u.onstart = () => setSpeaking(true)
    u.onend = () => setSpeaking(false)
    u.onerror = () => setSpeaking(false)
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
  }, [rate, pitch, lang, voiceName, voices])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
    setSpeaking(false)
  }, [])

  return { supported, speaking, voices, speak, stop }
}
