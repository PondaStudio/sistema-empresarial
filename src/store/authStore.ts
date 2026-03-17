import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Usuario, Permisos } from '../types'

interface AuthState {
  user: Usuario | null
  token: string | null
  permisos: Permisos
  setAuth: (user: Usuario, token: string) => void
  setPermisos: (permisos: Permisos) => void
  clearAuth: () => void
  can: (modulo: string, accion: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      permisos: {},
      setAuth: (user, token) => set({ user, token }),
      setPermisos: (permisos) => set({ permisos }),
      clearAuth: () => set({ user: null, token: null, permisos: {} }),
      can: (modulo, accion) => {
        const { permisos, user } = get()
        if (user?.roles?.nivel === 1) return true // Creador tiene todo
        return permisos[modulo]?.[accion] ?? false
      },
    }),
    { name: 'auth-storage' }
  )
)
