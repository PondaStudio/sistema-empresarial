import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const { user, token, setAuth, setPermisos, clearAuth, can } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password })
    setAuth(data.user, data.access_token)

    const { data: permisos } = await api.get('/permisos/me', {
      headers: { Authorization: `Bearer ${data.access_token}` },
    })
    setPermisos(permisos)

    toast.success(`Bienvenido, ${data.user.nombre}`)
    navigate('/dashboard')
  }, [setAuth, setPermisos, navigate])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch { /* ignore */ }
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])

  return { user, token, isAuthenticated: !!user, can, login, logout }
}
