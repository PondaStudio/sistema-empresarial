import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Cliente {
  id: string
  nombre: string
  telefono?: string
  email?: string
  domicilios_cliente?: { id: string; tipo: string; direccion: string; predeterminado: boolean }[]
  datos_fiscales_cliente?: { rfc: string; razon_social: string }[]
}

export default function ClientesPage() {
  const { can } = useAuthStore()
  const [clientes, setClientes]   = useState<Cliente[]>([])
  const [loading, setLoading]     = useState(true)
  const [q, setQ]                 = useState('')
  const [selected, setSelected]   = useState<Cliente | null>(null)
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ nombre: '', telefono: '', email: '' })
  const [saving, setSaving]       = useState(false)

  const load = (busq = q) =>
    api.get('/clientes', { params: busq ? { q: busq } : {} })
      .then(r => setClientes(r.data))
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  async function crear() {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      await api.post('/clientes', form)
      toast.success('Cliente creado')
      setShowForm(false)
      setForm({ nombre: '', telefono: '', email: '' })
      load()
    } catch { toast.error('Error al crear cliente') }
    finally { setSaving(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando clientes...</div>

  return (
    <div className="p-6 flex gap-4 h-full">
      {/* Lista */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white shrink-0">Clientes</h1>
          <input value={q} onChange={e => setQ(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(q)}
            placeholder="Buscar cliente..."
            className="flex-1 max-w-xs px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          {can('clientes', 'CREAR') && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 shrink-0">
              + Nuevo cliente
            </button>
          )}
        </div>

        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre *" className="flex-1 min-w-40 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
              placeholder="Teléfono" className="w-36 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Email" type="email" className="w-48 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <button onClick={crear} disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden flex-1">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">Teléfono</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-center">Domicilios</th>
                <th className="px-4 py-3 text-center">RFC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {clientes.map(c => (
                <tr key={c.id} onClick={() => setSelected(c)}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.nombre}</td>
                  <td className="px-4 py-3 text-gray-500">{c.telefono ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">{c.domicilios_cliente?.length ?? 0}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-400">
                    {c.datos_fiscales_cliente?.[0]?.rfc ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {clientes.length === 0 && (
            <p className="text-center text-gray-400 py-10 text-sm">Sin clientes</p>
          )}
        </div>
      </div>

      {/* Panel detalle */}
      {selected && (
        <div className="w-80 shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 overflow-y-auto">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{selected.nombre}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4">
            {selected.telefono && <p>📞 {selected.telefono}</p>}
            {selected.email    && <p>✉️ {selected.email}</p>}
          </div>

          {(selected.domicilios_cliente?.length ?? 0) > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Domicilios</p>
              <div className="space-y-1">
                {selected.domicilios_cliente!.map(d => (
                  <div key={d.id} className="text-xs bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
                    <span className="font-medium capitalize">{d.tipo}</span>
                    {d.predeterminado && <span className="ml-1 text-primary-500">★</span>}
                    <p className="text-gray-500 mt-0.5">{d.direccion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selected.datos_fiscales_cliente?.[0] && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Datos fiscales</p>
              <div className="text-xs bg-gray-50 dark:bg-gray-700 rounded-lg p-2 space-y-0.5">
                <p><span className="font-medium">RFC:</span> {selected.datos_fiscales_cliente[0].rfc}</p>
                <p><span className="font-medium">Razón social:</span> {selected.datos_fiscales_cliente[0].razon_social}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
