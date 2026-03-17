import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Tarea {
  id: string
  titulo: string
  descripcion?: string
  estado: string
  fecha_limite?: string
  asignada_por_user: { nombre: string }
  asignada_a_user: { nombre: string; foto_url?: string }
  evidencias_tarea: { url: string }[]
  subtareas: { id: string; titulo: string; completada: boolean }[]
}

const ESTADOS = ['pendiente', 'en_progreso', 'en_revision', 'rechazada', 'completada']

const ESTADO_STYLE: Record<string, string> = {
  pendiente:    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  en_progreso:  'bg-blue-100 text-blue-700',
  en_revision:  'bg-yellow-100 text-yellow-700',
  rechazada:    'bg-red-100 text-red-700',
  completada:   'bg-green-100 text-green-700',
}

const NEXT_ACTION: Record<string, { label: string; endpoint: string; color: string }> = {
  pendiente:   { label: 'Iniciar',            endpoint: 'en_progreso',  color: 'bg-blue-600' },
  en_progreso: { label: 'Enviar a revisión',  endpoint: 'en_revision',  color: 'bg-yellow-600' },
  en_revision: { label: 'Aprobar',            endpoint: 'completada',   color: 'bg-green-600' },
}

export default function TareasPage() {
  const { can } = useAuthStore()
  const [tareas, setTareas]   = useState<Tarea[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Tarea | null>(null)
  const [vista, setVista]     = useState<'kanban' | 'lista'>('kanban')

  const load = () => api.get('/tareas').then(r => setTareas(r.data)).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  async function cambiarEstado(tareaId: string, estado: string, notas_rechazo?: string) {
    try {
      await api.patch(`/tareas/${tareaId}/estado`, { estado, notas_rechazo })
      toast.success('Estado actualizado')
      load()
      if (selected?.id === tareaId) {
        const { data } = await api.get('/tareas')
        setSelected(data.find((t: Tarea) => t.id === tareaId) ?? null)
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error')
    }
  }

  async function rechazar(tareaId: string) {
    const motivo = window.prompt('Motivo del rechazo:')
    if (!motivo) return
    await cambiarEstado(tareaId, 'rechazada', motivo)
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tareas...</div>

  return (
    <div className="p-6 h-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tareas</h1>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            {(['kanban', 'lista'] as const).map(v => (
              <button key={v} onClick={() => setVista(v)}
                className={`px-3 py-1.5 text-sm rounded-md transition ${vista === v ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                {v === 'kanban' ? 'Kanban' : 'Lista'}
              </button>
            ))}
          </div>
          {can('tareas', 'CREAR') && (
            <button className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
              + Nueva tarea
            </button>
          )}
        </div>
      </div>

      {vista === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {ESTADOS.map(estado => {
            const col = tareas.filter(t => t.estado === estado)
            return (
              <div key={estado} className="w-64 flex-shrink-0">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ESTADO_STYLE[estado]}`}>
                    {estado.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-gray-400">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map(t => (
                    <button key={t.id} onClick={() => setSelected(t)}
                      className="w-full text-left bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-primary-300 transition">
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{t.titulo}</p>
                      <p className="text-xs text-gray-400 mt-1">→ {t.asignada_a_user?.nombre}</p>
                      {t.fecha_limite && (
                        <p className={`text-xs mt-1 ${new Date(t.fecha_limite) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                          {new Date(t.fecha_limite).toLocaleDateString('es-MX')}
                        </p>
                      )}
                      {t.evidencias_tarea?.length > 0 && (
                        <p className="text-xs text-blue-500 mt-1">📎 {t.evidencias_tarea.length} evidencia(s)</p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Tarea</th>
                <th className="px-4 py-3 text-left">Asignado a</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Límite</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {tareas.map(t => {
                const next = NEXT_ACTION[t.estado]
                return (
                  <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{t.titulo}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.asignada_a_user?.nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_STYLE[t.estado]}`}>
                        {t.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-gray-500">
                      {t.fecha_limite ? new Date(t.fecha_limite).toLocaleDateString('es-MX') : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {next && (
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => cambiarEstado(t.id, next.endpoint)}
                            className={`px-2 py-1 text-xs text-white rounded ${next.color} hover:opacity-90`}>
                            {next.label}
                          </button>
                          {t.estado === 'en_revision' && (
                            <button onClick={() => rechazar(t.id)}
                              className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:opacity-90">
                              Rechazar
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-96 bg-white dark:bg-gray-800 shadow-2xl p-6 overflow-y-auto z-50">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white pr-4">{selected.titulo}</h2>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0">✕</button>
          </div>
          <span className={`text-xs px-2 py-1 rounded-full ${ESTADO_STYLE[selected.estado]}`}>
            {selected.estado.replace(/_/g, ' ')}
          </span>
          {selected.descripcion && <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">{selected.descripcion}</p>}
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>Por: {selected.asignada_por_user?.nombre}</p>
            <p>Para: {selected.asignada_a_user?.nombre}</p>
            {selected.fecha_limite && <p>Límite: {new Date(selected.fecha_limite).toLocaleDateString('es-MX')}</p>}
          </div>
          {selected.evidencias_tarea?.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-gray-500 mb-2">Evidencias</p>
              <div className="grid grid-cols-3 gap-2">
                {selected.evidencias_tarea.map((e, i) => (
                  <a key={i} href={e.url} target="_blank" rel="noopener noreferrer">
                    <img src={e.url} alt={`evidencia ${i+1}`} className="w-full h-20 object-cover rounded-lg border" />
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 flex gap-2 flex-wrap">
            {NEXT_ACTION[selected.estado] && (
              <button onClick={() => cambiarEstado(selected.id, NEXT_ACTION[selected.estado].endpoint)}
                className={`px-3 py-1.5 text-sm text-white rounded-lg ${NEXT_ACTION[selected.estado].color}`}>
                {NEXT_ACTION[selected.estado].label}
              </button>
            )}
            {selected.estado === 'en_revision' && (
              <button onClick={() => rechazar(selected.id)}
                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg">
                Rechazar
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
