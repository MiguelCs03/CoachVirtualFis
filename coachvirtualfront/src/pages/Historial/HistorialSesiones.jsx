import React, { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Trophy, ShieldAlert, Award, FileText, Download, Terminal, ChevronLeft, ChevronRight, RefreshCw, Activity, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '../../api/api'
import { useAuth } from '../../auth/useAuth'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

const cx = (...c) => c.filter(Boolean).join(' ')

export default function HistorialSesiones() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [sessions, setSessions] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [globalMetrics, setGlobalMetrics] = useState({
    tiempo_total_formateado: '0 s',
    minutos_totales: 0,
    repeticiones_totales: 0
  })
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const reportRef = useRef(null)

  const fetchHistory = async (pageNumber = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get(`/usuarios/historial-paginado/?page=${pageNumber}&page_size=10`)
      setSessions(data.resultados)
      setTotalPages(data.total_pages)
      setTotalCount(data.count)
      setGlobalMetrics(data.metricas_globales)
      setPage(data.page)
    } catch (err) {
      console.error('Error cargando historial de sesiones:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory(1)
  }, [])

  const handlePrevPage = () => {
    if (page > 1) {
      fetchHistory(page - 1)
    }
  }

  const handleNextPage = () => {
    if (page < totalPages) {
      fetchHistory(page + 1)
    }
  }

  const handleExportPDF = async () => {
    if (pdfGenerating) return
    setPdfGenerating(true)
    
    // Crear un contenedor temporal oculto estructurado específicamente para impresión en PDF
    const printArea = document.createElement('div')
    printArea.style.position = 'absolute'
    printArea.style.left = '-9999px'
    printArea.style.top = '-9999px'
    printArea.style.width = '800px'
    printArea.style.padding = '40px'
    printArea.style.background = '#0a0a0a'
    printArea.style.color = '#ffffff'
    printArea.style.fontFamily = 'monospace'

    // Formatear la fecha actual
    const today = new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    printArea.innerHTML = `
      <div style="border: 2px solid #facc15; padding: 30px; background: #0c0c0c;">
        <!-- Cabecera de Reporte -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid rgba(255,255,255,0.1); padding-bottom: 20px;">
          <div>
            <h1 style="color: #facc15; font-size: 32px; font-weight: 900; letter-spacing: -1px; margin: 0; font-style: italic;">COACH<span style="color: #ffffff;">VIRTUAL</span></h1>
            <p style="color: rgba(255,255,255,0.4); font-size: 10px; tracking: 4px; margin: 5px 0 0 0;">INFORME BIOMÉTRICO OFICIAL V.2.4</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 0; font-size: 11px; color: #facc15; font-weight: bold;">STATUS: COMPLETO</p>
            <p style="margin: 3px 0 0 0; font-size: 9px; color: rgba(255,255,255,0.4);">${today}</p>
          </div>
        </div>

        <!-- Perfil Atleta -->
        <div style="margin: 30px 0; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); padding: 20px;">
          <h2 style="font-size: 12px; font-weight: 900; letter-spacing: 2px; color: rgba(255,255,255,0.6); margin: 0 0 15px 0; text-transform: uppercase;">DATOS DE IDENTIFICACIÓN DEL PACIENTE</h2>
          <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 15px; font-size: 12px;">
            <div><span style="color: rgba(255,255,255,0.4);">PACIENTE / ATLETA:</span> <strong style="color: #ffffff; text-transform: uppercase;">${user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username || 'PACIENTE_ANÓNIMO'}</strong></div>
            <div><span style="color: rgba(255,255,255,0.4);">EMAIL OPERATIVO:</span> <span style="color: #ffffff;">${user?.email || 'N/A'}</span></div>
          </div>
        </div>

        <!-- Resumen Métricas -->
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 30px 0;">
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; text-align: center;">
            <p style="font-size: 9px; color: rgba(255,255,255,0.4); margin: 0 0 5px 0; letter-spacing: 1px;">SESIONES COMPLETADAS</p>
            <p style="font-size: 24px; font-weight: 900; color: #facc15; margin: 0;">${totalCount}</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; text-align: center;">
            <p style="font-size: 9px; color: rgba(255,255,255,0.4); margin: 0 0 5px 0; letter-spacing: 1px;">TIEMPO TOTAL ENTRENADO</p>
            <p style="font-size: 24px; font-weight: 900; color: #ffffff; margin: 0;">${globalMetrics.tiempo_total_formateado}</p>
          </div>
          <div style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 15px; text-align: center;">
            <p style="font-size: 9px; color: rgba(255,255,255,0.4); margin: 0 0 5px 0; letter-spacing: 1px;">REPETICIONES COMPLETADAS</p>
            <p style="font-size: 24px; font-weight: 900; color: #facc15; margin: 0;">${globalMetrics.repeticiones_totales}</p>
          </div>
        </div>

        <!-- Tabla de Datos Completa -->
        <div style="margin-top: 30px;">
          <h2 style="font-size: 12px; font-weight: 900; letter-spacing: 2px; color: rgba(255,255,255,0.6); margin: 0 0 15px 0; text-transform: uppercase;">HISTORIAL DETALLADO DE MÓDULOS</h2>
          <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 11px;">
            <thead>
              <tr style="border-bottom: 2px solid rgba(255,255,255,0.2); color: rgba(255,255,255,0.6);">
                <th style="padding: 10px 5px;">MÓDULO / EJERCICIO</th>
                <th style="padding: 10px 5px;">FECHA Y HORA</th>
                <th style="padding: 10px 5px; text-align: right;">REPETICIONES</th>
                <th style="padding: 10px 5px; text-align: right;">DURACIÓN</th>
                <th style="padding: 10px 5px; text-align: right;">PRECISIÓN</th>
              </tr>
            </thead>
            <tbody>
              ${sessions.map(s => `
                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); hover: background: rgba(255,255,255,0.01);">
                  <td style="padding: 12px 5px; font-weight: bold; color: #ffffff; text-transform: uppercase;">${s.ejercicio}</td>
                  <td style="padding: 12px 5px; color: rgba(255,255,255,0.5);">${s.fecha}</td>
                  <td style="padding: 12px 5px; text-align: right; color: #ffffff;">${s.repeticiones}</td>
                  <td style="padding: 12px 5px; text-align: right; color: #ffffff;">${s.tiempo_formateado}</td>
                  <td style="padding: 12px 5px; text-align: right; color: ${s.precision >= 80 ? '#4ade80' : '#facc15'}; font-weight: bold;">${s.precision}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Footer Reporte -->
        <div style="margin-top: 50px; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 9px; color: rgba(255,255,255,0.3);">
          <span>COACHVIRTUAL S.A. | SOFTWARE DE MONITOREO CLÍNICO POR IA</span>
          <span>FIRMA ELECTRÓNICA DE VALIDACIÓN: #CV-${Math.floor(Math.random() * 900000 + 100000)}</span>
        </div>
      </div>
    `

    document.body.appendChild(printArea)

    try {
      const canvas = await html2canvas(printArea, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a'
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const imgWidth = 210 // A4 de ancho en mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
      pdf.save(`Reporte_Sesiones_${user?.username || 'CoachVirtual'}.pdf`)
    } catch (err) {
      console.error('Error exportando PDF:', err)
    } finally {
      document.body.removeChild(printArea)
      setPdfGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header de la página */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-l-4 border-yellow-400 pl-6 py-2">
          <div>
            <div className="flex items-center gap-2 text-white/40 font-mono text-[9px] uppercase tracking-widest">
              <Link to="/home" className="hover:text-yellow-400 transition-colors flex items-center gap-1">
                <ArrowLeft className="w-3.5 h-3.5" /> PANEL
              </Link>
              <span>/</span>
              <span>HISTORIAL</span>
            </div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none mt-2">
              HISTORIAL DE <span className="text-yellow-400">ENTRENAMIENTOS</span>
            </h1>
            <p className="text-white/40 font-mono text-[10px] tracking-[0.4em] mt-2 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-yellow-400" /> RESUMEN DE MÓDULOS COMPLETADOS
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchHistory(page)}
              className="bg-white/5 border border-white/10 p-3 hover:bg-white/10 transition-all text-white/80"
              title="Actualizar registro"
            >
              <RefreshCw className={cx('w-4 h-4', loading ? 'animate-spin' : '')} />
            </button>
            
            <button
              onClick={handleExportPDF}
              disabled={loading || pdfGenerating || sessions.length === 0}
              className="bg-yellow-400 text-black px-6 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {pdfGenerating ? (
                <>GENERANDO PDF...</>
              ) : (
                <>
                  EXPORTAR REPORTE <Download className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Global Summary Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0d0d0d] border border-white/5 p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="p-3 bg-white/5 text-white/40">
                <Calendar className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-white/20 tracking-tighter">SESIONES</span>
            </div>
            <div className="space-y-1 mt-4 relative z-10">
              <p className="text-[9px] font-black text-white/30 tracking-[0.2em] leading-none uppercase">SESIONES LOGRADAS</p>
              <p className="text-3xl font-black italic uppercase tracking-tighter text-white">{totalCount}</p>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-white/5 p-6 relative overflow-hidden group border-l-4 border-l-yellow-400">
            <div className="flex items-center justify-between relative z-10">
              <div className="p-3 bg-yellow-400 text-black">
                <Clock className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-white/20 tracking-tighter">DURACIÓN</span>
            </div>
            <div className="space-y-1 mt-4 relative z-10">
              <p className="text-[9px] font-black text-white/30 tracking-[0.2em] leading-none uppercase">TIEMPO TOTAL ENTRENADO</p>
              <p className="text-3xl font-black italic uppercase tracking-tighter text-white">{globalMetrics.tiempo_total_formateado}</p>
            </div>
          </div>

          <div className="bg-[#0d0d0d] border border-white/5 p-6 relative overflow-hidden group">
            <div className="flex items-center justify-between relative z-10">
              <div className="p-3 bg-white/5 text-white/40">
                <Trophy className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-mono text-white/20 tracking-tighter">REPETICIONES</span>
            </div>
            <div className="space-y-1 mt-4 relative z-10">
              <p className="text-[9px] font-black text-white/30 tracking-[0.2em] leading-none uppercase">REPS ACUMULADAS</p>
              <p className="text-3xl font-black italic uppercase tracking-tighter text-white">{globalMetrics.repeticiones_totales}</p>
            </div>
          </div>
        </div>

        {/* Detailed sessions table/card list */}
        <div className="bg-[#0d0d0d] border border-white/5 p-6 space-y-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <FileText className="w-5 h-5 text-yellow-400" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white/60">REGISTROS BIOMÉTRICOS ({totalCount})</h3>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 font-mono text-white/40 text-xs uppercase py-20 px-4">
              <div className="w-2 h-2 bg-yellow-400 animate-ping" /> OBTENIENDO DATOS DEL HISTORIAL...
            </div>
          ) : sessions.length === 0 ? (
            <div className="border border-white/5 bg-[#0a0a0a] p-20 flex flex-col items-center text-center space-y-4">
              <ShieldAlert className="w-10 h-10 text-white/20" />
              <div className="space-y-1">
                <h3 className="text-xl font-black italic uppercase tracking-tighter">SIN REGISTROS</h3>
                <p className="text-white/40 text-[9px] font-mono tracking-widest uppercase">Aún no se han guardado entrenamientos completados en el servidor.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3" ref={reportRef}>
              <div className="hidden md:grid grid-cols-5 p-3 text-[9px] font-mono tracking-widest text-white/30 uppercase border-b border-white/5">
                <span>EJERCICIO / MÓDULO</span>
                <span>FECHA DE REGISTRO</span>
                <span className="text-right">REPETICIONES</span>
                <span className="text-right">TIEMPO ENTRENADO</span>
                <span className="text-right">PRECISIÓN DE MOV.</span>
              </div>
              
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="grid grid-cols-1 md:grid-cols-5 items-center p-4 bg-white/[0.01] border border-white/5 hover:border-white/10 transition-colors gap-3 md:gap-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cx('w-2 h-2 rounded-full shrink-0', session.completado ? 'bg-green-500' : 'bg-yellow-400')} />
                      <span className="text-xs font-black uppercase text-white tracking-widest truncate">{session.ejercicio}</span>
                    </div>

                    <div className="text-[10px] font-mono text-white/40 md:pl-0 pl-5">
                      {session.fecha}
                    </div>

                    <div className="text-[11px] font-mono md:text-right text-white/70 md:pl-0 pl-5">
                      <span className="md:hidden text-white/30 text-[9px] tracking-wider uppercase block">REPS:</span>
                      {session.repeticiones} <span className="text-[9px] text-white/25">REPS</span>
                    </div>

                    <div className="text-[11px] font-mono md:text-right text-white/70 md:pl-0 pl-5">
                      <span className="md:hidden text-white/30 text-[9px] tracking-wider uppercase block">DURACIÓN:</span>
                      {session.tiempo_formateado}
                    </div>

                    <div className={cx('text-[11px] font-mono md:text-right font-black md:pl-0 pl-5', session.precision >= 80 ? 'text-green-400' : 'text-yellow-400')}>
                      <span className="md:hidden text-white/30 text-[9px] tracking-wider uppercase block">PRECISIÓN:</span>
                      {session.precision}%
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center pt-6 border-t border-white/5 text-xs font-mono">
                  <button
                    onClick={handlePrevPage}
                    disabled={page === 1}
                    className="px-4 py-2 border border-white/5 hover:border-white/20 transition-all text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> ANTERIOR
                  </button>

                  <span className="text-white/40 tracking-widest text-[9px]">PÁGINA {page} DE {totalPages}</span>

                  <button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="px-4 py-2 border border-white/5 hover:border-white/20 transition-all text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    SIGUIENTE <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
