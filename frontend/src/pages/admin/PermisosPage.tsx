import { useEffect, useState } from 'react'
import api from '../../services/api'
import { MODULOS, ACCIONES } from '../../types'
import toast from 'react-hot-toast'

interface UserOption { id: string; nombre: string; roles?: { nombre: string } }

export default function PermisosPage() {
  const [usuarios, setUsuarios]     = useState<UserOption[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [matrix, setMatrix]         = useState<Record<string, Record<string, boolean>>>({})
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    api.get('/users').then(r => setUsuarios(r.data))
  }, [])

  async function loadPermisos(userId: string) {
    setLoading(true)
    setSelectedId(userId)
    try {
      const { data } = await api.get(`/permisos/${userId}`)
      setMatrix(data)
    } finally {
      setLoading(false)
    }
  }

  function toggle(modulo: string, accion: string) {
    setMatrix(prev => ({
      ...prev,
      [modulo]: { ...prev[modulo], [accion]: !prev[modulo]?.[accion] },
    }))
  }

  async function savePermisos() {
    setSaving(true)
    const permisos = Object.entries(matrix).flatMap(([modulo, acciones]) =>
      Object.entries(acciones).map(([accion, habilitado]) => ({ modulo, accion, habilitado }))
    )
    try {
      await api.patch(`/permisos/${selectedId}`, { permisos })
      toast.success('Permisos guardados')
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al guardar permisos')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Permisos</h1>

      <div className="flex items-center gap-4">
        <select
          value={selectedId}
          onChange={e => loadPermisos(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
        >
          <option value="">Seleccionar usuario...</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nombre} — {u.roles?.nombre}</option>
          ))}
        </select>
        {selectedId && (
          <button
            onClick={savePermisos} disabled={saving}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        )}
      </div>

      {loading && <div className="text-center text-gray-500 py-8">Cargando permisos...</div>}

      {selectedId && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto">
          <table className="text-xs min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400 font-semibold sticky left-0 bg-gray-50 dark:bg-gray-700/50">Módulo</th>
                {ACCIONES.map(a => (
                  <th key={a} className="px-3 py-2 text-gray-600 dark:text-gray-400 font-medium">{a}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {MODULOS.map(modulo => (
                <tr key={modulo} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                  <td className="px-4 py-2 font-medium text-gray-800 dark:text-gray-200 sticky left-0 bg-white dark:bg-gray-800 capitalize">
                    {modulo.replace(/_/g, ' ')}
                  </td>
                  {ACCIONES.map(accion => (
                    <td key={accion} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={matrix[modulo]?.[accion] ?? false}
                        onChange={() => toggle(modulo, accion)}
                        className="w-4 h-4 rounded accent-primary-600 cursor-pointer"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
