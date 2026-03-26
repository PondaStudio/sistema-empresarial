import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { Moon, Sun, Menu, X } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'

export function AppLayout() {
  const { token, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const isMock = token?.startsWith('mock-') ?? false
  const { theme, toggle } = useTheme()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleChangeMockUser = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — drawer on mobile, fixed on desktop */}
      <div className={`fixed inset-y-0 left-0 z-40 transition-transform duration-300 md:relative md:translate-x-0 md:z-auto ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Banner modo prueba */}
        {isMock && (
          <div className="shrink-0 bg-yellow-400/10 border-b border-yellow-400/20 px-4 py-1.5 flex items-center justify-between">
            <p className="text-yellow-300 text-xs font-medium">
              ⚠️ Modo Prueba — {user?.nombre} · {user?.roles?.nombre}
            </p>
            <button
              onClick={handleChangeMockUser}
              className="text-yellow-400 hover:text-yellow-200 text-xs underline underline-offset-2 transition-colors"
            >
              Cambiar usuario
            </button>
          </div>
        )}
        {/* Top bar */}
        <header className="h-12 shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-between gap-2 px-4">
          {/* Mobile: hamburger + system name */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu size={20} />
            </button>
            <span className="text-sm font-semibold text-primary-600 truncate">Sistema Empresarial</span>
          </div>
          {/* Desktop: spacer */}
          <div className="hidden md:block" />

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <NotificationBell />
          </div>
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
