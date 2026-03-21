import axios from 'axios'
import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'https://lightcoral-guanaco-765978.hostingersite.com'}/api`,
  timeout: 30000,
})

// Attach JWT from Supabase session on every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  if (data.session?.access_token) {
    config.headers.Authorization = `Bearer ${data.session.access_token}`
  } else {
    // Fallback: mock session token (dev mode)
    const { token, user } = useAuthStore.getState()
    if (token) config.headers.Authorization = `Bearer ${token}`
    // Si el token es mock, agrega headers especiales para el backend
    if (token?.startsWith('mock-')) {
      config.headers['X-Mock-User'] = 'true'
      config.headers['X-Mock-Level'] = String(user?.roles?.nivel ?? 99)
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { token } = useAuthStore.getState()
      // En modo mock no redirigir; el dashboard mostrará estado vacío
      if (!token?.startsWith('mock-')) {
        supabase.auth.signOut()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
