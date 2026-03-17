import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { supabase } from '../services/supabase'
import { useAuthStore } from '../store/authStore'
import { Usuario, Permisos } from '../types'

export function useAuth() {
  const { user, token, setAuth, setPermisos, clearAuth, can } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (email: string, password: string) => {
    // 1. Autenticar con Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      const err: any = new Error(authError.message)
      err.response = { data: { error: authError.status === 400 ? 'INVALID_CREDENTIALS' : 'SERVER_ERROR' } }
      throw err
    }

    const session = authData.session!
    const userId  = authData.user!.id

    // 2. Obtener perfil + rol del usuario
    const { data: usuario, error: userError } = await supabase
      .from('usuarios')
      .select('*, roles(nivel, nombre)')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    setAuth(usuario as Usuario, session.access_token)

    // 3. Obtener permisos del rol
    const { data: permisosData } = await supabase
      .from('permisos_base')
      .select('modulo, accion, habilitado')
      .eq('rol_id', usuario.rol_id)

    const permisos: Permisos = {}
    for (const p of permisosData ?? []) {
      if (!permisos[p.modulo]) permisos[p.modulo] = {}
      permisos[p.modulo][p.accion] = p.habilitado
    }
    setPermisos(permisos)

    toast.success(`Bienvenido, ${usuario.nombre}`)
    navigate('/dashboard')
  }, [setAuth, setPermisos, navigate])

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    clearAuth()
    navigate('/login')
  }, [clearAuth, navigate])

  return { user, token, isAuthenticated: !!user, can, login, logout }
}
