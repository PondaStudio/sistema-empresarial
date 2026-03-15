import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Aviso {
  id: string
  titulo: string
  contenido: string
  tipo: 'info' | 'alerta' | 'urgente'
  fijado: boolean
  created_at: string
  expires_at?: string
  creado_por_user?: { nombre: string }
}

const TIPO_STYLE = {
  info:    'border-blue-400 bg-blue-50  dark:bg-blue-900/20 text-blue-800 dark:text-blue-200',
  alerta:  'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200',
  urgente: 'border-red-500 bg-red-50   dark:bg-red-900/20   text-red-800   dark:text-red-200',
}

const TIPO_ICON = { info: 'ℹ️', alerta: '⚠️', urgente: '🚨' }

export default function AvisosPage() {
  const { can } = useAuthStore()
  const [avisos, setAvisos]     = useState<Aviso[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]         = useState({ titulo: '', contenido: '', tipo: 'info', fijado: false })
  const [saving, setSaving]     = useState(false)

  const load = () => api.get('/avisos').then(r => setAvisos(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function crear() {
    if (!form.titulo || !form.contenido) return
    setSaving(true)
    try {
      await api.post('/avisos', form)
      toast.success('Aviso publicado')
      setShowForm(false)
      setForm({ titulo: '', contenido: '', tipo: 'info', fijado: false })
      load()
    } catch { toast.error('Error al publicar aviso') }
    finally { setSaving(false) }
  }

  async function toggleFijado(aviso: Aviso) {
    await api.patch(`/avisos/${aviso.id}`, { fijado: !aviso.fijado })
    load()
  }

  async function eliminar(id: string) {
    await api.delete(`/avisos/${id}`)
    toast.success('Aviso eliminado')
    load()
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando avisos...</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Avisos Generales</h1>
        {can('avisos', 'CREAR') && (
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
            + Nuevo aviso
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-3">
          <input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
            placeholder="Título del aviso" maxLength={200}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <textarea value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })}
            placeholder="Contenido del aviso..." rows={3}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="flex gap-3 flex-wrap">
            <select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}
              className="px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="info">ℹ️ Informativo</option>
              <option value="alerta">⚠️ Alerta</option>
              <option value="urgente">🚨 Urgente</option>
            </select>
            <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <input type="checkbox" checked={form.fijado} onChange={e => setForm({ ...form, fijado: e.target.checked })} />
              Fijar al inicio
            </label>
            <button onClick={crear} disabled={saving}
              className="px-4 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Publicando...' : 'Publicar'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-1.5 text-sm text-gray-500 hover:text-gray-700">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {avisos.length === 0 && (
        <div className="text-center py-12 text-gray-400">No hay avisos activos</div>
      )}

      <div className="space-y-3">
        {avisos.map(a => (
          <div key={a.id} className={`border-l-4 rounded-xl p-4 ${TIPO_STYLE[a.tipo]}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span>{TIPO_ICON[a.tipo]}</span>
                {a.fijado && <span className="text-xs bg-white/50 dark:bg-black/20 px-1.5 py-0.5 rounded">📌 Fijado</span>}
                <h3 className="font-semibold">{a.titulo}</h3>
              </div>
              {can('avisos', 'EDITAR') && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => toggleFijado(a)} title={a.fijado ? 'Desfijar' : 'Fijar'}
                    className="text-xs px-2 py-1 rounded bg-white/40 dark:bg-black/20 hover:bg-white/60">
                    📌
                  </button>
                  {can('avisos', 'ELIMINAR') && (
                    <button onClick={() => eliminar(a.id)}
                      className="text-xs px-2 py-1 rounded bg-white/40 dark:bg-black/20 hover:bg-red-200">
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="mt-2 text-sm">{a.contenido}</p>
            <p className="mt-2 text-xs opacity-60">
              {a.creado_por_user?.nombre} · {new Date(a.created_at).toLocaleDateString('es-MX')}
              {a.expires_at && ` · Expira: ${new Date(a.expires_at).toLocaleDateString('es-MX')}`}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
