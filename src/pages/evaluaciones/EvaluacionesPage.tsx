import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Evaluacion {
  id: string
  periodo: string
  estado: string
  puntaje_total?: number
  puntaje_puntualidad?: number
  puntaje_calidad?: number
  puntaje_actitud?: number
  comentarios?: string
  empleado: { id: string; usuarios: { nombre: string } }
  evaluador: { nombre: string }
}

interface Empleado { id: string; usuarios: { nombre: string } }

const SCORE_COLOR = (n?: number) => {
  if (!n) return 'text-gray-400'
  if (n >= 8) return 'text-green-600'
  if (n >= 6) return 'text-yellow-600'
  return 'text-red-600'
}

export default function EvaluacionesPage() {
  const { can } = useAuthStore()
  const [evals, setEvals]       = useState<Evaluacion[]>([])
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [periodo, setPeriodo]   = useState('')
  const [form, setForm]         = useState({
    empleado_id: '', periodo: '', puntaje_puntualidad: 8, puntaje_calidad: 8, puntaje_actitud: 8, comentarios: ''
  })
  const [saving, setSaving] = useState(false)

  const load = () => {
    const params: Record<string, string> = {}
    if (periodo) params.periodo = periodo
    api.get('/evaluaciones', { params }).then(r => setEvals(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api.get('/rrhh/empleados').then(r => setEmpleados(r.data))
  }, [])

  useEffect(() => { if (!loading) load() }, [periodo])

  async function crear() {
    if (!form.empleado_id || !form.periodo) return toast.error('Empleado y período son requeridos')
    setSaving(true)
    try {
      await api.post('/evaluaciones', {
        ...form,
        puntaje_puntualidad: Number(form.puntaje_puntualidad),
        puntaje_calidad:     Number(form.puntaje_calidad),
        puntaje_actitud:     Number(form.puntaje_actitud),
      })
      toast.success('Evaluación guardada')
      setShowForm(false)
      load()
    } catch { toast.error('Error al guardar') }
    finally { setSaving(false) }
  }

  async function publicar(id: string) {
    await api.patch(`/evaluaciones/${id}/publicar`)
    toast.success('Evaluación publicada')
    load()
  }

  const ScoreInput = ({ label, field }: { label: string; field: 'puntaje_puntualidad' | 'puntaje_calidad' | 'puntaje_actitud' }) => (
    <div>
      <label className="text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center gap-2 mt-1">
        <input type="range" min={0} max={10} step={0.5}
          value={form[field]}
          onChange={e => setForm({ ...form, [field]: parseFloat(e.target.value) })}
          className="flex-1" />
        <span className={`text-sm font-bold w-8 text-right ${SCORE_COLOR(form[field])}`}>{form[field]}</span>
      </div>
    </div>
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Evaluaciones de Desempeño</h1>
        <div className="flex gap-2">
          <input value={periodo} onChange={e => setPeriodo(e.target.value)}
            placeholder="Período (ej: 2026-Q1)"
            className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white w-36" />
          {can('evaluaciones', 'CREAR') && (
            <button onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700">
              + Nueva evaluación
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Nueva evaluación</p>
          <div className="grid grid-cols-2 gap-3">
            <select value={form.empleado_id} onChange={e => setForm({ ...form, empleado_id: e.target.value })}
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="">Seleccionar empleado *</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.usuarios?.nombre}</option>)}
            </select>
            <input value={form.periodo} onChange={e => setForm({ ...form, periodo: e.target.value })}
              placeholder="Período * (ej: 2026-Q1)"
              className="px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <div className="space-y-3">
            <ScoreInput label="Puntualidad" field="puntaje_puntualidad" />
            <ScoreInput label="Calidad de trabajo" field="puntaje_calidad" />
            <ScoreInput label="Actitud" field="puntaje_actitud" />
          </div>
          <textarea value={form.comentarios} onChange={e => setForm({ ...form, comentarios: e.target.value })}
            placeholder="Comentarios opcionales..." rows={2}
            className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <div className="flex gap-2">
            <button onClick={crear} disabled={saving}
              className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar borrador'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-sm text-gray-500">Cancelar</button>
          </div>
        </div>
      )}

      {loading ? <div className="text-center text-gray-400 py-8">Cargando...</div> : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Empleado</th>
                <th className="px-4 py-3 text-center">Período</th>
                <th className="px-4 py-3 text-center">Puntualidad</th>
                <th className="px-4 py-3 text-center">Calidad</th>
                <th className="px-4 py-3 text-center">Actitud</th>
                <th className="px-4 py-3 text-center">Total</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {evals.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{e.empleado?.usuarios?.nombre}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{e.periodo}</td>
                  {[e.puntaje_puntualidad, e.puntaje_calidad, e.puntaje_actitud].map((s, i) => (
                    <td key={i} className={`px-4 py-3 text-center font-semibold ${SCORE_COLOR(s)}`}>{s ?? '—'}</td>
                  ))}
                  <td className={`px-4 py-3 text-center text-base font-bold ${SCORE_COLOR(e.puntaje_total)}`}>
                    {e.puntaje_total ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      e.estado === 'publicada' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>{e.estado}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {e.estado === 'borrador' && can('evaluaciones', 'APROBAR') && (
                      <button onClick={() => publicar(e.id)}
                        className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700">
                        Publicar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {evals.length === 0 && <p className="text-center text-gray-400 py-8">Sin evaluaciones</p>}
        </div>
      )}
    </div>
  )
}
