import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Activity, Calendar, Shield, ChevronRight, ChevronLeft, Zap, Target } from 'lucide-react'
import api from '../api/api'

export default function PerfilClinicoWizard({ onComplete }) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Estado del formulario
  const [objetivo, setObjetivo] = useState('Rehabilitación')
  const [nivel, setNivel] = useState('Principiante')
  const [dias, setDias] = useState(3)
  
  // Lesiones
  const [dolorLumbar, setDolorLumbar] = useState(false)
  const [lesionMenisco, setLesionMenisco] = useState(false)
  const [dolorCervical, setDolorCervical] = useState(false)
  const [lesionHombro, setLesionHombro] = useState(false)
  const [tendinitis, setTendinitis] = useState(false)
  
  const [otrasLesiones, setOtrasLesiones] = useState('')
  const [observaciones, setObservaciones] = useState('')

  const handleNext = () => setStep((prev) => Math.min(prev + 1, 3))
  const handlePrev = () => setStep((prev) => Math.max(prev - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const payload = {
      objetivo_principal: objetivo,
      experiencia_deporte: nivel,
      dias_entrenamiento: dias,
      tiene_dolor_lumbar: dolorLumbar,
      tiene_lesion_menisco: lesionMenisco,
      tiene_dolor_cervical: dolorCervical,
      tiene_lesion_hombro: lesionHombro,
      tiene_tendinitis: tendinitis,
      otras_lesiones: otrasLesiones,
      observaciones: observaciones
    }

    try {
      await api.post('/usuarios/perfil-clinico/', payload)
      onComplete()
    } catch (err) {
      console.error('Error guardando perfil clínico:', err)
      setError('Fallo de sincronización con el servidor clínico. Reintente por favor.')
    } finally {
      setLoading(false)
    }
  }

  const stepVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-2xl bg-[#0a0a0a] border border-white/10 relative overflow-hidden p-1 shadow-[0_0_50px_rgba(255,230,0,0.15)] rounded-none"
      >
        {/* Glow animado superior */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent" />
        
        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <div>
              <h2 className="text-2xl font-black italic tracking-tighter uppercase leading-none">
                PERFIL <span className="text-yellow-400">CLÍNICO Y DEPORTIVO</span>
              </h2>
              <p className="text-white/40 font-mono text-[8px] tracking-[0.3em] mt-2 uppercase">
                FORMULARIO DE EVALUACIÓN OBLIGATORIO_V.1.0
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-white/30">
              <span className={step >= 1 ? 'text-yellow-400 font-bold' : ''}>01</span>
              <span>/</span>
              <span className={step >= 2 ? 'text-yellow-400 font-bold' : ''}>02</span>
              <span>/</span>
              <span className={step >= 3 ? 'text-yellow-400 font-bold' : ''}>03</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-950/50 border border-red-500/30 text-red-400 text-xs font-mono p-3 uppercase tracking-wider text-center">
              [ERROR]: {error}
            </div>
          )}

          {/* Steps */}
          <div className="min-h-[250px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase flex items-center gap-2">
                      <Target className="w-3.5 h-3.5 text-yellow-400" /> OBJETIVO PRINCIPAL
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {['Rehabilitación', 'Pérdida de Peso', 'Ganar Fuerza', 'Acondicionamiento'].map((obj) => (
                        <button
                          key={obj}
                          onClick={() => setObjetivo(obj)}
                          className={`p-4 border font-mono text-xs text-left transition-all uppercase tracking-wider rounded-none ${
                            objetivo === obj
                              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.1)]'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          {obj}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase flex items-center gap-2">
                      <Zap className="w-3.5 h-3.5 text-yellow-400" /> NIVEL DE EXPERIENCIA
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {['Principiante', 'Intermedio', 'Avanzado'].map((n) => (
                        <button
                          key={n}
                          onClick={() => setNivel(n)}
                          className={`p-3 border font-mono text-[10px] text-center transition-all uppercase tracking-wider rounded-none ${
                            nivel === n
                              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.1)]'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-yellow-400" /> LESIONES O DOLORES ACTUADOS (MARQUE SI APLICA)
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <CheckboxCard
                        checked={dolorLumbar}
                        onChange={setDolorLumbar}
                        label="Dolor Lumbar (Espalda baja)"
                        desc="Evitar cargas excesivas axiales"
                      />
                      <CheckboxCard
                        checked={lesionMenisco}
                        onChange={setLesionMenisco}
                        label="Lesión de Menisco (Rodilla)"
                        desc="Cuidado con flexiones profundas"
                      />
                      <CheckboxCard
                        checked={dolorCervical}
                        onChange={setDolorCervical}
                        label="Dolor Cervical (Cuello)"
                        desc="Evitar hiperextensiones del cuello"
                      />
                      <CheckboxCard
                        checked={lesionHombro}
                        onChange={setLesionHombro}
                        label="Lesión de Hombro"
                        desc="Evitar press militar o rangos altos"
                      />
                      <CheckboxCard
                        checked={tendinitis}
                        onChange={setTendinitis}
                        label="Tendinitis Activa"
                        desc="Limitar intensidad y repeticiones"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase ml-1">
                      OTRAS LIMITACIONES O LESIONES ESPECÍFICAS
                    </label>
                    <textarea
                      value={otrasLesiones}
                      onChange={(e) => setOtrasLesiones(e.target.value)}
                      placeholder="EJ: Fractura de clavícula hace 6 meses, hernia discal L4-L5..."
                      className="w-full h-16 bg-white/[0.03] border-l-2 border-white/20 p-3 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all placeholder:text-white/10 uppercase resize-none"
                    />
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-yellow-400" /> FRECUENCIA DE ENTRENAMIENTO SEMANAL
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {[2, 3, 4, 5].map((d) => (
                        <button
                          key={d}
                          onClick={() => setDias(d)}
                          className={`p-4 border font-mono text-sm text-center transition-all uppercase tracking-wider rounded-none ${
                            dias === d
                              ? 'bg-yellow-400/10 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(255,230,0,0.1)]'
                              : 'bg-white/[0.02] border-white/5 text-white/60 hover:border-white/20'
                          }`}
                        >
                          {d} DÍAS
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-white/40 tracking-widest uppercase ml-1">
                      OBSERVACIONES MÉDICAS O RECOMENDACIONES
                    </label>
                    <textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Indique si tiene recomendación médica explícita para hacer ejercicio..."
                      className="w-full h-20 bg-white/[0.03] border-l-2 border-white/20 p-3 text-white font-mono text-xs focus:border-yellow-400 outline-none transition-all placeholder:text-white/10 uppercase resize-none"
                    />
                  </div>

                  <div className="border-l-2 border-yellow-400/50 bg-yellow-400/5 p-4 space-y-1">
                    <h4 className="text-[10px] font-black tracking-widest text-yellow-400 uppercase">AVISO BIOMÉDICO</h4>
                    <p className="text-[9px] font-mono text-white/50 leading-relaxed uppercase">
                      LOS DATOS REGISTRADOS SERÁN EVALUADOS POR EL ENTORNO DE INTELIGENCIA ARTIFICIAL PARA OMITIR O SUGERIR EJERCICIOS QUE NO VAYAN EN CONTRA DE SUS LESIONES.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Controls */}
          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            {step > 1 ? (
              <button
                onClick={handlePrev}
                disabled={loading}
                className="px-6 py-3 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4.5 h-4.5" /> ATRÁS
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                onClick={handleNext}
                className="bg-white text-black px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all flex items-center gap-2"
              >
                SIGUIENTE <ChevronRight className="w-4.5 h-4.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-yellow-400 text-black px-10 py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? 'SINCRONIZANDO...' : 'FINALIZAR REGISTRO'} <Heart className="w-4.5 h-4.5 fill-current" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function CheckboxCard({ checked, onChange, label, desc }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={`p-3 border transition-all cursor-pointer flex items-center justify-between gap-3 ${
        checked
          ? 'bg-yellow-400/10 border-yellow-400 shadow-[0_0_10px_rgba(255,230,0,0.05)]'
          : 'bg-white/[0.02] border-white/5 hover:border-white/20'
      }`}
    >
      <div className="min-w-0">
        <p className={`text-[10px] font-black uppercase tracking-tight ${checked ? 'text-yellow-400' : 'text-white'}`}>
          {label}
        </p>
        <p className="text-[8px] font-mono text-white/40">{desc}</p>
      </div>
      <div className={`w-4 h-4 border flex items-center justify-center ${checked ? 'bg-yellow-400 border-yellow-400' : 'bg-transparent border-white/20'}`}>
        {checked && <Zap className="w-2.5 h-2.5 text-black fill-current" />}
      </div>
    </div>
  )
}
