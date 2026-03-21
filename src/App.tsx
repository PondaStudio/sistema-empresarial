import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Component, ErrorInfo, ReactNode } from 'react'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'
import { useAuthStore } from './store/authStore'

// ── ErrorBoundary global ─────────────────────────────────────────────────────
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              <h1 className="text-xl font-bold text-red-600">Error en la aplicación</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm">
              Ocurrió un error inesperado. Revisa la consola para más detalles.
            </p>
            <pre className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 text-xs text-red-500 overflow-auto max-h-48 whitespace-pre-wrap">
              {err.message}
            </pre>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ error: null })}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Reintentar
              </button>
              <button
                onClick={() => { this.setState({ error: null }); window.location.href = '/login' }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 text-sm font-medium py-2 rounded-lg transition-colors"
              >
                Volver al inicio
              </button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
// ────────────────────────────────────────────────────────────────────────────

// Wave 1 pages
import MockLoginPage  from './pages/auth/MockLoginPage'
import LoginPage      from './pages/auth/LoginPage'
import PerfilPage     from './pages/perfil/PerfilPage'
import UsuariosPage         from './pages/admin/UsuariosPage'
import PermisosPage         from './pages/admin/PermisosPage'
import GestionPermisosPage  from './pages/admin/GestionPermisosPage'
// Wave 2 pages
import InventarioPage    from './pages/inventario/InventarioPage'
// Wave 3 pages
import PedidosVentaPage  from './pages/pedidos/PedidosVentaPage'
import VistaCajaPage     from './pages/pedidos/VistaCajaPage'
import VistaSurtidoPage  from './pages/pedidos/VistaSurtidoPage'
import VistaChecadorPage from './pages/pedidos/VistaChecadorPage'
import ClientesPage      from './pages/clientes/ClientesPage'
import ProveedoresPage   from './pages/proveedores/ProveedoresPage'
// Wave 4 pages
import TareasPage        from './pages/tareas/TareasPage'
import ComunicacionPage  from './pages/comunicacion/ComunicacionPage'
import RrhhPage          from './pages/rrhh/RrhhPage'
// Wave 5 pages
import DashboardPage      from './pages/dashboard/DashboardPage'
import AvisosPage         from './pages/avisos/AvisosPage'
import BitacoraPage       from './pages/bitacora/BitacoraPage'
import CapacitacionesPage from './pages/capacitaciones/CapacitacionesPage'
import EvaluacionesPage   from './pages/evaluaciones/EvaluacionesPage'
import FormatosPage       from './pages/formatos/FormatosPage'

function PedidosRouter() {
  const nivel = useAuthStore(s => s.user?.roles?.nivel ?? 99)
  if (nivel >= 11) return <Navigate to="/pedidos/venta" replace />
  if (nivel === 10) return <Navigate to="/pedidos/surtido" replace />
  if (nivel === 9)  return <Navigate to="/pedidos/caja" replace />
  // nivel <= 8: supervisores y admin ven todas las notas (vista vendedora)
  return <Navigate to="/pedidos/venta" replace />
}

function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login"      element={<MockLoginPage />} />
        <Route path="/login-real" element={<LoginPage />} />

        {/* Protected — requiere autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/perfil"           element={<PerfilPage />} />
            <Route path="/admin/usuarios"   element={<UsuariosPage />} />
            <Route path="/admin/permisos"         element={<GestionPermisosPage />} />
            <Route path="/admin/permisos/legacy" element={<PermisosPage />} />
            <Route path="/inventario"       element={<InventarioPage />} />

            {/* Pedidos — vistas por rol */}
            <Route path="/pedidos"          element={<PedidosRouter />} />
            <Route path="/pedidos/venta"    element={<PedidosVentaPage />} />
            <Route path="/pedidos/caja"     element={<VistaCajaPage />} />
            <Route path="/pedidos/surtido"  element={<VistaSurtidoPage />} />
            <Route path="/pedidos/checador" element={<VistaChecadorPage />} />

            <Route path="/clientes"         element={<ClientesPage />} />
            <Route path="/proveedores"      element={<ProveedoresPage />} />
            <Route path="/tareas"           element={<TareasPage />} />
            <Route path="/comunicacion"     element={<ComunicacionPage />} />
            <Route path="/rrhh"             element={<RrhhPage />} />
            <Route path="/avisos"           element={<AvisosPage />} />
            <Route path="/bitacora"           element={<BitacoraPage />} />
            <Route path="/capacitaciones"    element={<CapacitacionesPage />} />
            <Route path="/evaluaciones"      element={<EvaluacionesPage />} />
            <Route path="/formatos"          element={<FormatosPage />} />

            {/* Sin permiso */}
            <Route path="/sin-permiso" element={
              <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-red-600">Sin permiso</h1>
                <p className="text-gray-500 mt-2">No tienes acceso a esta sección.</p>
              </div>
            } />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
