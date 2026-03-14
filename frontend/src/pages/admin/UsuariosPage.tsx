import { useEffect, useState } from 'react'
import api from '../../services/api'
import { Usuario } from '../../types'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

export default function UsuariosPage() {
  const { user: me } = useAuthStore()
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading]   = useState(true)
  const [inviteEmail, setInviteEmail]   = useState('')
  const [inviteNombre, setInviteNombre] = useState('')
  const [inviteRol, setInviteRol]       = useState('')
  const [roles, setRoles] = useState<any[]>([])
  const [showInvite, setShowInvite] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get('/users'),
      api.get('/roles'),
    ]).then(([u, r]) => {
      setUsuarios(u.data)
      setRoles(r.data)
    }).finally(() => setLoading(false))
  }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/auth/invite', { email: inviteEmail, nombre: inviteNombre, rol_id: inviteRol })
      toast.success('Invitación enviada')
      setShowInvite(false)
      setInviteEmail(''); setInviteNombre(''); setInviteRol('')
      const { data } = await api.get('/users')
      setUsuarios(data)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error al invitar')
    }
  }

  const ESTADO_COLOR: Record<string, string> = {
    disponible:    'bg-green-500',
    ocupado:       'bg-red-500',
    comiendo:      'bg-yellow-500',
    no_disponible: 'bg-gray-400',
    ausente:       'bg-orange-500',
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
        {me?.roles?.nivel === 1 && (
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition"
          >
            + Invitar usuario
          </button>
        )}
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="font-semibold text-gray-800 dark:text-white">Nueva invitación</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text" placeholder="Nombre completo" required
              value={inviteNombre} onChange={e => setInviteNombre(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            />
            <input
              type="email" placeholder="Correo electrónico" required
              value={inviteEmail} onChange={e => setInviteEmail(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            />
            <select
              required value={inviteRol} onChange={e => setInviteRol(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
            >
              <option value="">Selecciona rol...</option>
              {roles.filter(r => r.nivel > 1).map(r => (
                <option key={r.id} value={r.id}>{r.nombre}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
              Enviar invitación
            </button>
            <button type="button" onClick={() => setShowInvite(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900">
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 text-xs uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 text-left">Usuario</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Sucursal</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {usuarios.map(u => (
              <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={u.foto_url ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(u.nombre)}&size=32&background=3b82f6&color=fff`}
                      alt={u.nombre}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{u.nombre}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{u.roles?.nombre}</td>
                <td className="px-4 py-3 text-gray-500">{u.sucursales?.nombre ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${ESTADO_COLOR[u.estado_presencia] ?? 'bg-gray-400'}`} />
                    <span className="text-gray-600 dark:text-gray-400 capitalize">{u.estado_presencia.replace('_', ' ')}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
