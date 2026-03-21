import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { ESTADOS_PRESENCIA } from '../../types'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function PerfilPage() {
  const { user, setAuth, token } = useAuthStore()
  const [presencia, setPresencia] = useState<string>(user?.estado_presencia ?? 'disponible')
  const [saving, setSaving] = useState(false)
  const isMockInit = useAuthStore.getState().token?.startsWith('mock-token-') ?? false
  const [numAgente, setNumAgente] = useState<string>(
    isMockInit ? (localStorage.getItem('mock_numero_agente') ?? user?.numero_agente ?? '') : (user?.numero_agente ?? '')
  )
  const [savingAgente, setSavingAgente] = useState(false)

  if (!user) return null

  const estadoActual = ESTADOS_PRESENCIA.find(e => e.value === presencia)

  const isMock = token?.startsWith('mock-token-') ?? false

  async function saveNumAgente() {
    setSavingAgente(true)
    const value = numAgente.trim() || null
    try {
      if (isMock) {
        localStorage.setItem('mock_numero_agente', value ?? '')
        setAuth({ ...user!, numero_agente: value }, token!)
        toast.success('Guardado localmente (modo prueba)')
      } else {
        await api.patch('/users/me', { numero_agente: value })
        setAuth({ ...user!, numero_agente: value }, token!)
        toast.success('Número de agente actualizado')
      }
    } catch (err: any) {
      const msg = err.response?.data?.message ?? 'Error al actualizar número de agente'
      toast.error(msg)
    } finally {
      setSavingAgente(false)
    }
  }

  async function savePresencia(value: string) {
    setSaving(true)
    try {
      await api.patch(`/users/${user!.id}/profile`, { estado_presencia: value })
      setPresencia(value)
      setAuth({ ...user!, estado_presencia: value as any }, token!)
      toast.success('Estado actualizado')
    } catch {
      toast.error('Error al actualizar estado')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Perfil</h1>

      {/* Avatar y datos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm flex items-center gap-5">
        <div className="relative">
          <img
            src={user.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=3b82f6&color=fff`}
            alt={user.nombre}
            className="w-20 h-20 rounded-full object-cover"
          />
          <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${estadoActual?.color ?? 'bg-gray-400'}`} />
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">{user.nombre}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-sm text-primary-600 font-medium">{user.roles?.nombre}</p>
          {user.sucursales && (
            <p className="text-xs text-gray-400">{user.sucursales.nombre}</p>
          )}
        </div>
      </div>

      {/* Estado de presencia */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Estado de presencia</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {ESTADOS_PRESENCIA.map(e => (
            <button
              key={e.value}
              onClick={() => savePresencia(e.value)}
              disabled={saving || presencia === e.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition
                ${presencia === e.value
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                } disabled:opacity-50`}
            >
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${e.color}`} />
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* Número de agente */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Número de agente</h2>
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ej. AGT-001"
            value={numAgente}
            onChange={e => setNumAgente(e.target.value)}
          />
          <button
            onClick={saveNumAgente}
            disabled={savingAgente || numAgente === (user?.numero_agente ?? '')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {savingAgente ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Este número aparece en los pedidos que generes.
        </p>
      </div>

      <p className="text-xs text-gray-400 text-center">
        Para cambiar nombre, rol o sucursal contacta al administrador.
      </p>
    </div>
  )
}
