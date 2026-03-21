import { Outlet, useNavigate } from 'react-router-dom'
import { Moon, Sun } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { NotificationBell } from './NotificationBell'
import { useAuthStore } from '../../store/authStore'
import { useTheme } from '../../hooks/useTheme'

export function AppLayout() {
  const { token, user, clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const isMock = token?.startsWith('mock-') ?? false
  const { theme, toggle } = useTheme()

  const handleChangeMockUser = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <Sidebar />
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
        <header className="h-12 shrink-0 bg-white dark:bg-gray-800 border-b dark:border-gray-700 flex items-center justify-end gap-2 px-4">
          <button
            onClick={toggle}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <NotificationBell />
        </header>
        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
