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
    // Modo mock: construir token con nivel embebido
    const { token, user } = useAuthStore.getState()
    if (token?.startsWith('mock-')) {
      const nivel = user?.roles?.nivel ?? 99
      const uid = user?.id ?? 'mock-user'
      const mockToken = `mock-token-nivel-${nivel}-uid-${uid}`
      config.headers.Authorization = `Bearer ${mockToken}`
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { token } = useAuthStore.getState()
      // En modo mock no redirigir; el dashboard mostrará estado vacío
      if (!token?.startsWith('mock-')) {
        supabase.auth.signOut()
        window.location.href = '/login'
      }
    }

    // Reintento temporal ante errores de red (CORS preflight, timeout corto)
    const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED')
    if (isNetworkError && !error.config?._retried) {
      error.config._retried = true
      error.config.withCredentials = false
      try {
        return await api.request(error.config)
      } catch { /* propagar error original */ }
    }

    return Promise.reject(error)
  }
)

export default api
