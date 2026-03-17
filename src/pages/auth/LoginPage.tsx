import { useState, FormEvent } from 'react'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
    } catch (err: any) {
      const msg = err.response?.data?.error === 'INVALID_CREDENTIALS'
        ? 'Correo o contraseña incorrectos'
        : 'Error al iniciar sesión'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-blue-800">
      <div className="w-full max-w-md mx-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header azul */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-8 py-8 text-center">
            {/* Logo / ícono */}
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Sistema Empresarial</h1>
            <p className="text-blue-200 text-sm mt-1">Gestión integral de operaciones</p>
          </div>

          {/* Formulario */}
          <div className="px-8 py-8">
            <p className="text-gray-500 text-sm text-center mb-6">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200"
                  placeholder="tu@correo.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white outline-none transition-all duration-200"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 active:bg-blue-900 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Ingresando...
                  </span>
                ) : 'Ingresar'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              ¿Olvidaste tu contraseña? Contacta al administrador del sistema.
            </p>
          </div>
        </div>

        <p className="text-center text-blue-300/60 text-xs mt-4">
          © {new Date().getFullYear()} Sistema Empresarial · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
