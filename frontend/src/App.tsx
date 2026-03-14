import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Wave 1 pages
import LoginPage      from './pages/auth/LoginPage'
import PerfilPage     from './pages/perfil/PerfilPage'
import UsuariosPage   from './pages/admin/UsuariosPage'
import PermisosPage   from './pages/admin/PermisosPage'
// Wave 2 pages
import InventarioPage from './pages/inventario/InventarioPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected — requiere autenticación */}
        <Route element={<ProtectedRoute />}>
          <Route path="/perfil"          element={<PerfilPage />} />
          <Route path="/admin/usuarios"  element={<UsuariosPage />} />
          <Route path="/admin/permisos"   element={<PermisosPage />} />
          <Route path="/inventario"      element={<InventarioPage />} />

          {/* Dashboard placeholder — Wave 5 */}
          <Route path="/dashboard" element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <p className="text-gray-500 mt-2">En construcción (Wave 5)</p>
            </div>
          } />

          {/* Sin permiso */}
          <Route path="/sin-permiso" element={
            <div className="p-8 text-center">
              <h1 className="text-xl font-bold text-red-600">Sin permiso</h1>
              <p className="text-gray-500 mt-2">No tienes acceso a esta sección.</p>
            </div>
          } />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
