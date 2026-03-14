import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Pages — se agregan conforme se construyen las waves
// Wave 1
// import LoginPage from './pages/auth/LoginPage'
// import PerfilPage from './pages/perfil/PerfilPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/" element={<div className="p-8 text-center"><h1 className="text-2xl font-bold">Sistema Empresarial</h1><p className="text-gray-500 mt-2">En construcción...</p></div>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
