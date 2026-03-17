import { useEffect, useState, useRef } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

interface InventarioItem {
  id: string
  cantidad: number
  stock_minimo: number
  productos: { codigo: string; nombre: string; foto_url?: string; categorias?: { nombre: string } }
  sucursales: { nombre: string }
}

export default function InventarioPage() {
  const { can } = useAuthStore()
  const [items, setItems]     = useState<InventarioItem[]>([])
  const [alertas, setAlertas] = useState<InventarioItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'todos' | 'alertas' | 'cedis'>('todos')
  const fileRef = useRef<HTMLInputElement>(null)
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    Promise.all([api.get('/inventario'), api.get('/inventario/alertas')])
      .then(([inv, al]) => { setItems(inv.data); setAlertas(al.data) })
      .finally(() => setLoading(false))
  }, [])

  async function handleCedisImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImporting(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const { data } = await api.post('/inventario/import-cedis', form)
      toast.success(`CEDIS importado: ${data.updated} productos actualizados, ${data.skipped} omitidos`)
      const [inv, al] = await Promise.all([api.get('/inventario'), api.get('/inventario/alertas')])
      setItems(inv.data); setAlertas(al.data)
    } catch (err: any) {
      toast.error(err.response?.data?.detail ?? 'Error al importar')
    } finally {
      setImporting(false)
      e.target.value = ''
    }
  }

  const display = tab === 'alertas' ? alertas : items

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando inventario...</div>

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Inventario
          {alertas.length > 0 && (
            <span className="ml-2 text-sm font-medium bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {alertas.length} alerta{alertas.length > 1 ? 's' : ''}
            </span>
          )}
        </h1>
        {can('inventario', 'CREAR') && (
          <div>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleCedisImport} />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
            >
              {importing ? 'Importando...' : '↑ Import CEDIS'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        {(['todos', 'alertas'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm rounded-md font-medium transition ${tab === t ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
            {t === 'todos' ? `Todos (${items.length})` : `Stock bajo (${alertas.length})`}
          </button>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Producto</th>
              <th className="px-4 py-3 text-left">Sucursal</th>
              <th className="px-4 py-3 text-right">Cantidad</th>
              <th className="px-4 py-3 text-right">Stock mínimo</th>
              <th className="px-4 py-3 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {display.map(item => {
              const bajo = item.cantidad <= item.stock_minimo
              return (
                <tr key={item.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 ${bajo ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.productos.nombre}</p>
                      <p className="text-xs text-gray-400">{item.productos.codigo} · {item.productos.categorias?.nombre}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{item.sucursales.nombre}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${bajo ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                    {item.cantidad}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.stock_minimo}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${bajo ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {bajo ? 'Bajo' : 'OK'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {display.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin registros</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
