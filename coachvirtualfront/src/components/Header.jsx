import React from 'react'
import { useAuth } from '../auth/useAuth'
import { useNavigate } from 'react-router-dom'
import { useCategory } from '../context/CategoryContext'
import { LogOut, Menu, Dumbbell, ChevronRight, User, Settings, Activity } from 'lucide-react'

const Header = ({ onMenuClick }) => {
  const { user, isAuthenticated, signOut } = useAuth()
  const { category, clearCategory } = useCategory()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login', { replace: true })
  }

  const changeCategory = () => {
    clearCategory()
    navigate('/seleccionar')
  }

  const categoryLabel = (() => {
    if (!category) return ''
    if (typeof category === 'string') {
      return category === 'gym' ? 'GYM / HIIT' : 'FISIOTERAPIA'
    }
    return (category.nombre || `TIPO #${category.id}`).toUpperCase()
  })()

  return (
    <nav className="fixed top-0 left-0 w-full h-16 bg-[#0f0f0f] border-b border-white/10 px-4 flex items-center z-50">
      {/* Detalle decorativo superior (línea amarilla fina) */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 opacity-50" />

      <div className="w-full flex items-center justify-between gap-4">
        {/* Lado Izquierdo: Menú + Logo */}
        <div className="flex items-center gap-4">
          <button
            className="p-2 hover:bg-white/5 rounded-none border border-transparent hover:border-white/10 text-white transition-all group"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
          </button>

          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/home')}
          >
            <div className="w-8 h-8 bg-yellow-400 flex items-center justify-center">
              <Dumbbell className="text-black w-5 h-5" />
            </div>
            <span className="hidden md:block font-black text-white italic tracking-tighter uppercase text-xl">
              V-COACH <span className="text-yellow-400">SYSTEM</span>
            </span>
          </div>
        </div>

        {/* Lado Derecho: Categoría + Usuario + Logout */}
        <div className="flex items-center gap-3">
          {isAuthenticated && category && (
            <button
              onClick={changeCategory}
              className="hidden sm:flex items-center gap-3 bg-white/[0.03] border border-white/10 px-4 py-2 hover:bg-white/[0.08] transition-all group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase leading-none">
                  MODO ACTIVO
                </span>
                <span className="text-xs font-mono text-yellow-400 tracking-wider uppercase">
                  {categoryLabel}
                </span>
              </div>
              <ChevronRight className="w-3 h-3 text-white/20 group-hover:text-yellow-400 group-hover:translate-x-1 transition-all" />
            </button>
          )}

          {isAuthenticated && (
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              <div className="hidden lg:flex flex-col items-end mr-2">
                <span className="text-[8px] font-black text-white/40 tracking-[0.2em] uppercase leading-none">
                  OPERADOR
                </span>
                <span className="text-xs font-mono text-white tracking-wider truncate max-w-[120px]">
                  {(user?.name || user?.email || 'ATLETA').toUpperCase()}
                </span>
              </div>

              <button
                className="p-2 text-white/40 hover:text-white transition-colors"
                title="Perfil"
              >
                <User className="w-5 h-5" />
              </button>

              <button
                onClick={handleLogout}
                className="ml-2 p-2 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all group"
                title="Cerrar terminal"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Header
