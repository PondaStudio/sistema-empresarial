import { useEffect, useState } from 'react'
import api from '../../services/api'

interface Entrada {
  id: string
  modulo: string
  accion: string
  created_at: string
  ip?: string
  usuarios?: { nombre: string; email: string }
}

const ACCION_COLOR: Record<string, string> = {
  CREAR:    'bg-green-100 text-green-700',
  EDITAR:   'bg-blue-100 text-blue-700',
  ELIMINAR: 'bg-red-100 text-red-700',
  VER:      'bg-gray-100 text-gray-600',
  APROBAR:  'bg-purple-100 text-purple-700',
  EXPORTAR: 'bg-yellow-100 text-yellow-700',
}

const MODULOS = ['auth','usuarios','roles','permisos','sucursales','productos','inventario','proveedores',
  'pedidos','clientes','comunicacion','tareas','rrhh','avisos','bitacora']

export default function BitacoraPage() {
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [filtros, setFiltros]   = useState({ modulo: '', accion: '', desde: '', hasta: '' })

  const load = (p = page) => {
    setLoading(true)
    const params: Record<string, string> = { page: String(p) }
    if (filtros.modulo) params.modulo = filtros.modulo
    if (filtros.accion) params.accion = filtros.accion
    if (filtros.desde)  params.desde  = filtros.desde
    if (filtros.hasta)  params.hasta  = filtros.hasta

    api.get('/bitacora', { params })
      .then(r => { setEntradas(r.data.data); setTotal(r.data.total) })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(1); setPage(1) }, [filtros])
  useEffect(() => { load() }, [page])

  const totalPages = Math.ceil(total / 50)

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bitácora de Actividad</h1>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex flex-wrap gap-3">
        <select value={filtros.modulo} onChange={e => setFiltros({ ...filtros, modulo: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <option value="">Todos los módulos</option>
          {MODULOS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filtros.accion} onChange={e => setFiltros({ ...filtros, accion: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white">
          <option value="">Todas las acciones</option>
          {['CREAR','EDITAR','ELIMINAR','VER','APROBAR','EXPORTAR'].map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input type="date" value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        <input type="date" value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })}
          className="px-3 py-1.5 border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
        {(filtros.modulo || filtros.accion || filtros.desde || filtros.hasta) && (
          <button onClick={() => setFiltros({ modulo: '', accion: '', desde: '', hasta: '' })}
            className="text-sm text-gray-400 hover:text-gray-600">
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-4 py-2 border-b dark:border-gray-700 text-xs text-gray-500">
          {total.toLocaleString()} registros
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Módulo</th>
                <th className="px-4 py-3 text-center">Acción</th>
                <th className="px-4 py-3 text-left">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {entradas.map(e => (
                <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                  <td className="px-4 py-2.5 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString('es-MX')}
                  </td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-900 dark:text-white">{e.usuarios?.nombre ?? '—'}</p>
                    <p className="text-xs text-gray-400">{e.usuarios?.email}</p>
                  </td>
                  <td className="px-4 py-2.5 text-gray-600 dark:text-gray-300">{e.modulo}</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACCION_COLOR[e.accion] ?? 'bg-gray-100 text-gray-600'}`}>
                      {e.accion}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-400">{e.ip ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            className="px-3 py-1 text-sm rounded border disabled:opacity-40 dark:border-gray-600 dark:text-gray-300">
            ← Anterior
          </button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
            Página {page} / {totalPages}
          </span>
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            className="px-3 py-1 text-sm rounded border disabled:opacity-40 dark:border-gray-600 dark:text-gray-300">
            Siguiente →
          </button>
        </div>
      )}
    </div>
  )
}
