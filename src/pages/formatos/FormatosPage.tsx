import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Formato {
  id: string
  nombre: string
  categoria: string
  descripcion?: string
  url_plantilla: string
  subido_por?: { nombre: string }
  created_at: string
}

const CATEGORIAS = ['ventas', 'rrhh', 'inventario', 'general']

const CAT_COLOR: Record<string, string> = {
  ventas:     'bg-blue-100 text-blue-700',
  rrhh:       'bg-purple-100 text-purple-700',
  inventario: 'bg-orange-100 text-orange-700',
  general:    'bg-gray-100 text-gray-600',
}

const FILE_ICON = (url: string) => {
  const ext = url.split('.').pop()?.toLowerCase()
  if (ext === 'pdf')  return '📄'
  if (['xlsx','xls'].includes(ext ?? '')) return '📊'
  if (['docx','doc'].includes(ext ?? '')) return '📝'
  return '📎'
}

export default function FormatosPage() {
  const { can } = useAuthStore()
  const [formatos, setFormatos]   = useState<Formato[]>([])
  const [loading, setLoading]     = useState(true)
  const [catFiltro, setCatFiltro] = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState({ nombre: '', categoria: 'general', descripcion: '' })
  const [file, setFile]           = useState<File | null>(null)
  const [saving, setSaving]       = useState(false)

  const load = (cat = catFiltro) => {
    const params: Record<string, string> = {}
    if (cat) params.categoria = cat
    api.get('/formatos', { params }).then(r => setFormatos(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])
  useEffect(() => { if (!loading) load(catFiltro) }, [catFiltro])

  async function subir() {
    if (!file || !form.nombre.trim()) return toast.error('Nombre y archivo son requeridos')
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('archivo', file)
      fd.append('nombre', form.nombre)
      fd.append('categoria', form.categoria)
      fd.append('descripcion', form.descripcion)
      await api.post('/formatos', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      toast.success('Formato subido')
      setShowForm(false)
      setForm({ nombre: '', categoria: 'general', descripcion: '' })
      setFile(null)
      load()
    } catch { toast.error('Error al subir formato') }
    finally { setSaving(false) }
  }

  async function eliminar(id: string) {
    await api.delete(`/formatos/${id}`)
    toast.success('Formato eliminado')
    load()
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Formatos y Plantillas</h1>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button onClick={() => setCatFiltro('')}
              className={`px-3 py-1 text-xs rounded-md transition ${!catFiltro ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500'}`}>
              Todos
            </button>
            {CATEGORIAS.map(c => (
              <button key={c} onClick={() => setCatFiltro(c)}
                className={`px-3 py-1 text-xs rounded-md capitalize transition ${catFiltro === c ? 'bg-white dark:bg-gray-700 shadow' : 'text-gray-500'}`}>
                {c}
              </button>
            ))}
          </div>
          {can('formatos', 'CREAR') && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
              + Subir formato
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Nombre del formato *"
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <select value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {CATEGORIAS.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
            <input value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Descripción opcional"
              className="col-span-2 px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="flex gap-3 items-center flex-wrap">
            <label className="cursor-pointer px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-primary-400">
              {file ? file.name : '📎 Seleccionar archivo *'}
              <input type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
            </label>
            <button onClick={subir} disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Subiendo...' : 'Subir'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center text-gray-400 py-8">Cargando...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {formatos.map(f => (
            <div key={f.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{FILE_ICON(f.url_plantilla)}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-900 dark:text-white">{f.nombre}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium capitalize ${CAT_COLOR[f.categoria] ?? CAT_COLOR.general}`}>
                      {f.categoria}
                    </span>
                  </div>
                </div>
                {can('formatos', 'ELIMINAR') && (
                  <button onClick={() => eliminar(f.id)} className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                )}
              </div>
              {f.descripcion && <p className="text-xs text-gray-400 line-clamp-2">{f.descripcion}</p>}
              <div className="flex items-center justify-between mt-auto pt-2">
                <p className="text-xs text-gray-400">{f.subido_por?.nombre}</p>
                <a href={f.url_plantilla} target="_blank" rel="noopener noreferrer" download
                  className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  ⬇ Descargar
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {formatos.length === 0 && !loading && (
        <p className="text-center text-gray-400 py-10">Sin formatos registrados</p>
      )}
    </div>
  )
}
