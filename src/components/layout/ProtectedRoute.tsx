import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface Props {
  modulo?: string
  accion?: string
}

export function ProtectedRoute({ modulo, accion }: Props) {
  const { user, can } = useAuthStore()

  if (!user) return <Navigate to="/login" replace />
  if (modulo && accion && !can(modulo, accion)) {
    return <Navigate to="/sin-permiso" replace />
  }

  return <Outlet />
}
