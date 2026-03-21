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
      const mockToken = `mock-token-nivel-${nivel}`
      config.headers.Authorization = `Bearer ${mockToken}`
      console.log('[api] mock request headers:', {
        Authorization: config.headers.Authorization,
        url: config.url,
      })
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
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
