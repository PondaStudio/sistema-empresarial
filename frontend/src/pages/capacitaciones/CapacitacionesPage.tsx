import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Capacitacion {
  id: string
  titulo: string
  descripcion?: string
  url_material?: string
  obligatoria: boolean
  completada_por_mi: boolean
  total_completadas: number
}

export default function CapacitacionesPage() {
  const { can } = useAuthStore()
  const [caps, setCaps]         = useState<Capacitacion[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ titulo: '', descripcion: '', obligatoria: false })
  const [file, setFile]         = useState<File | null>(null)
  const [saving, setSaving]     = useState(false)

  const load = () => api.get('/capacitaciones').then(r => setCaps(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function crear() {
    if (!form.titulo.trim()) return
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('titulo', form.titulo)
      fd.append('descripcion', form.descripcion)
      fd.append('obligatoria', String(form.obligatoria))
      if (file) fd.append('material', file)
      await api.post('/capacitaciones', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Capacitación creada')
      setShowForm(false)
      setForm({ titulo: '', descripcion: '', obligatoria: false })
      setFile(null)
      load()
    } catch { toast.error('Error al crear capacitación') }
    finally { setSaving(false) }
  }

  async function completar(id: string) {
    await api.post(`/capacitaciones/${id}/completar`)
    toast.success('Marcada como completada')
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando capacitaciones...</div>

  const obligatorias  = caps.filter(c => c.obligatoria)
  const opcionales    = caps.filter(c => !c.obligatoria)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Capacitaciones</h1>
        {can('capacitaciones', 'CREAR') && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
            + Nueva capacitación
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-3">
          <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título *" className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <textarea value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
            placeholder="Descripción..." rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="flex gap-4 flex-wrap items-center">
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={form.obligatoria} onChange={e => setForm({ ...form, obligatoria: e.target.checked })} />
              Obligatoria
            </label>
            <label className="cursor-pointer px-3 py-1.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-500 hover:border-primary-400">
              {file ? file.name : '📎 Material (PDF, video, etc.)'}
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={crear} disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancelar</button>
          </div>
        </div>
      )}

      {[{ label: 'Obligatorias', items: obligatorias }, { label: 'Opcionales', items: opcionales }].map(group => (
        group.items.length > 0 && (
          <div key={group.label}>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">{group.label}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.items.map(c => (
                <div key={c.id} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border-2 transition ${
                  c.completada_por_mi ? 'border-green-400' : 'border-gray-100 dark:border-gray-700'
                }`}>
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{c.titulo}</h3>
                    {c.completada_por_mi && <span className="text-green-500 text-xs shrink-0">✓ Completada</span>}
                  </div>
                  {c.descripcion && <p className="text-xs text-gray-500 mb-2 line-clamp-2">{c.descripcion}</p>}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-400">{c.total_completadas} completaron</span>
                    <div className="flex gap-2">
                      {c.url_material && (
                        <a href={c.url_material} target="_blank" rel="noopener noreferrer"
                          className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200">
                          📄 Ver material
                        </a>
                      )}
                      {!c.completada_por_mi && (
                        <button onClick={() => completar(c.id)}
                          className="text-xs px-2 py-1 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                          Marcar completada
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}

      {caps.length === 0 && <p className="text-center text-gray-400 py-10">Sin capacitaciones registradas</p>}
    </div>
  )
}
