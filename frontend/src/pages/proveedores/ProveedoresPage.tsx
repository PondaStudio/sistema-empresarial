import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Proveedor {
  id: string
  nombre: string
  contacto_nombre?: string
  contacto_tel?: string
  contacto_email?: string
  notas?: string
  activo: boolean
}

export default function ProveedoresPage() {
  const { can } = useAuthStore()
  const [proveedores, setProveedores] = useState<Proveedor[]>([])
  const [loading, setLoading]         = useState(true)
  const [editing, setEditing]         = useState<Proveedor | null>(null)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState({ nombre: '', contacto_nombre: '', contacto_tel: '', contacto_email: '', notas: '' })
  const [saving, setSaving]           = useState(false)

  const load = () => api.get('/proveedores').then(r => setProveedores(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function guardar() {
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      if (editing) {
        await api.patch(`/proveedores/${editing.id}`, form)
        toast.success('Proveedor actualizado')
      } else {
        await api.post('/proveedores', form)
        toast.success('Proveedor creado')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ nombre: '', contacto_nombre: '', contacto_tel: '', contacto_email: '', notas: '' })
      load()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  function startEdit(p: Proveedor) {
    setEditing(p)
    setForm({
      nombre:          p.nombre,
      contacto_nombre: p.contacto_nombre ?? '',
      contacto_tel:    p.contacto_tel    ?? '',
      contacto_email:  p.contacto_email  ?? '',
      notas:           p.notas           ?? '',
    })
    setShowForm(true)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando proveedores...</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
        {can('proveedores', 'CREAR') && (
          <button onClick={() => { setEditing(null); setForm({ nombre: '', contacto_nombre: '', contacto_tel: '', contacto_email: '', notas: '' }); setShowForm(!showForm) }}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
            + Nuevo proveedor
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {editing ? 'Editar proveedor' : 'Nuevo proveedor'}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre *" className="col-span-2 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input value={form.contacto_nombre} onChange={e => setForm({ ...form, contacto_nombre: e.target.value })}
              placeholder="Contacto" className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input value={form.contacto_tel} onChange={e => setForm({ ...form, contacto_tel: e.target.value })}
              placeholder="Teléfono" className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input value={form.contacto_email} onChange={e => setForm({ ...form, contacto_email: e.target.value })}
              placeholder="Email" type="email" className="col-span-2 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })}
              placeholder="Notas internas..." rows={2}
              className="col-span-2 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="flex gap-2">
            <button onClick={guardar} disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => { setShowForm(false); setEditing(null) }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {proveedores.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white">{p.nombre}</h3>
              {can('proveedores', 'EDITAR') && (
                <button onClick={() => startEdit(p)}
                  className="text-xs text-gray-400 hover:text-primary-600 shrink-0">✎ Editar</button>
              )}
            </div>
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              {p.contacto_nombre && <p>👤 {p.contacto_nombre}</p>}
              {p.contacto_tel    && <p>📞 {p.contacto_tel}</p>}
              {p.contacto_email  && <p>✉️ {p.contacto_email}</p>}
              {p.notas && (
                <p className="mt-1 text-gray-400 italic line-clamp-2">{p.notas}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {proveedores.length === 0 && (
        <p className="text-center text-gray-400 py-10 text-sm">Sin proveedores registrados</p>
      )}
    </div>
  )
}
