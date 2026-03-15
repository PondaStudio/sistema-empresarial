import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface Empleado {
  id: string
  puesto?: string
  salario?: number
  fecha_ingreso?: string
  usuarios: { nombre: string; email: string; foto_url?: string; rol_id?: string; roles?: { nombre: string }; sucursales?: { nombre: string } }
}

export default function RrhhPage() {
  const { can } = useAuthStore()
  const [empleados, setEmpleados] = useState<Empleado[]>([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState<'empleados' | 'asistencia'>('empleados')
  const [csvFile, setCsvFile]     = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    api.get('/rrhh/empleados').then(r => setEmpleados(r.data)).finally(() => setLoading(false))
  }, [])

  async function importarCSV() {
    if (!csvFile) return
    setImporting(true)
    const fd = new FormData()
    fd.append('file', csvFile)
    try {
      const { data } = await api.post('/rrhh/asistencia/import', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      toast.success(`Importados: ${data.imported} | Omitidos: ${data.skipped}`)
      setCsvFile(null)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Error al importar')
    } finally { setImporting(false) }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando RRHH...</div>

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recursos Humanos</h1>
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {(['empleados', 'asistencia'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm rounded-md transition ${tab === t ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-500'}`}>
              {t === 'empleados' ? 'Empleados' : 'Asistencia'}
            </button>
          ))}
        </div>
      </div>

      {tab === 'empleados' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Empleado</th>
                <th className="px-4 py-3 text-left">Puesto</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Sucursal</th>
                <th className="px-4 py-3 text-center">Ingreso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {empleados.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-xs font-bold text-primary-600">
                        {e.usuarios?.nombre?.charAt(0)?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{e.usuarios?.nombre}</p>
                        <p className="text-xs text-gray-400">{e.usuarios?.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.puesto ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.usuarios?.roles?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{e.usuarios?.sucursales?.nombre ?? '—'}</td>
                  <td className="px-4 py-3 text-center text-xs text-gray-500">
                    {e.fecha_ingreso ? new Date(e.fecha_ingreso).toLocaleDateString('es-MX') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'asistencia' && can('rrhh', 'CREAR') && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Importar asistencia del checador (CSV)</h2>
          <p className="text-xs text-gray-400">
            Columnas esperadas: <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">email</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">fecha</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">hora_entrada</code>,{' '}
            <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">hora_salida</code>
          </p>
          <div className="flex gap-3 items-center">
            <label className="cursor-pointer px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 hover:border-primary-400 hover:text-primary-600 transition">
              {csvFile ? csvFile.name : 'Seleccionar archivo CSV'}
              <input type="file" accept=".csv" className="hidden" onChange={e => setCsvFile(e.target.files?.[0] ?? null)} />
            </label>
            {csvFile && (
              <button onClick={importarCSV} disabled={importing}
                className="px-4 py-2 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 disabled:opacity-50">
                {importing ? 'Importando...' : 'Importar'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
