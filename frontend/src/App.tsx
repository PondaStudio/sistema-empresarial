import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { AppLayout } from './components/layout/AppLayout'

// Wave 1 pages
import LoginPage      from './pages/auth/LoginPage'
import PerfilPage     from './pages/perfil/PerfilPage'
import UsuariosPage   from './pages/admin/UsuariosPage'
import PermisosPage   from './pages/admin/PermisosPage'
// Wave 2 pages
import InventarioPage    from './pages/inventario/InventarioPage'
// Wave 3 pages
import PedidosVentaPage  from './pages/pedidos/PedidosVentaPage'
import ClientesPage      from './pages/clientes/ClientesPage'
import ProveedoresPage   from './pages/proveedores/ProveedoresPage'
// Wave 4 pages
import TareasPage        from './pages/tareas/TareasPage'
import ComunicacionPage  from './pages/comunicacion/ComunicacionPage'
import RrhhPage          from './pages/rrhh/RrhhPage'
// Wave 5 pages
import DashboardPage     from './pages/dashboard/DashboardPage'
import AvisosPage        from './pages/avisos/AvisosPage'
import BitacoraPage      from './pages/bitacora/BitacoraPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — requiere autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/dashboard"        element={<DashboardPage />} />
            <Route path="/perfil"           element={<PerfilPage />} />
            <Route path="/admin/usuarios"   element={<UsuariosPage />} />
            <Route path="/admin/permisos"   element={<PermisosPage />} />
            <Route path="/inventario"       element={<InventarioPage />} />
            <Route path="/pedidos/venta"    element={<PedidosVentaPage />} />
            <Route path="/clientes"         element={<ClientesPage />} />
            <Route path="/proveedores"      element={<ProveedoresPage />} />
            <Route path="/tareas"           element={<TareasPage />} />
            <Route path="/comunicacion"     element={<ComunicacionPage />} />
            <Route path="/rrhh"             element={<RrhhPage />} />
            <Route path="/avisos"           element={<AvisosPage />} />
            <Route path="/bitacora"         element={<BitacoraPage />} />

            {/* Sin permiso */}
            <Route path="/sin-permiso" element={
              <div className="p-8 text-center">
                <h1 className="text-xl font-bold text-red-600">Sin permiso</h1>
                <p className="text-gray-500 mt-2">No tienes acceso a esta sección.</p>
              </div>
            } />
          </Route>
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
