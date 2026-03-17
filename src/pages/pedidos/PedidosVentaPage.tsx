import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

interface PedidoResumen {
  id: string
  folio: string
  estado: string
  nombre_cliente?: string
  created_at: string
  vendedora: { nombre: string }
  sucursales: { nombre: string }
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  borrador:             { label: 'Borrador',           color: 'bg-gray-100 text-gray-600' },
  pendiente_almacen:    { label: 'Pend. Almacén',      color: 'bg-yellow-100 text-yellow-700' },
  en_revision:          { label: 'En revisión',        color: 'bg-blue-100 text-blue-700' },
  confirmado:           { label: 'Confirmado',         color: 'bg-indigo-100 text-indigo-700' },
  impreso:              { label: 'Impreso',            color: 'bg-purple-100 text-purple-700' },
  surtido:              { label: 'Surtido',            color: 'bg-orange-100 text-orange-700' },
  verificado_vendedora: { label: 'Verificado',         color: 'bg-teal-100 text-teal-700' },
  en_checador:          { label: 'En checador',        color: 'bg-cyan-100 text-cyan-700' },
  cerrado:              { label: 'Cerrado ✓',          color: 'bg-green-100 text-green-700' },
  cancelado:            { label: 'Cancelado',          color: 'bg-red-100 text-red-700' },
}

export default function PedidosVentaPage() {
  const { can } = useAuthStore()
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  useEffect(() => {
    api.get('/pedidos/venta').then(r => setPedidos(r.data)).finally(() => setLoading(false))
  }, [])

  async function loadDetail(id: string) {
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/pedidos/venta/${id}`)
      setSelected(data)
    } finally {
      setDetailLoading(false)
    }
  }

  async function confirmarItem(pedidoId: string, itemId: string, estado: string) {
    try {
      await api.patch(`/pedidos/venta/${pedidoId}/items/${itemId}`, { estado_confirmacion: estado })
      toast.success('Item actualizado')
      await loadDetail(pedidoId)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error')
    }
  }

  async function avanzarEstado(pedidoId: string, endpoint: string) {
    try {
      await api.patch(`/pedidos/venta/${pedidoId}/${endpoint}`)
      toast.success('Estado actualizado')
      const [list, detail] = await Promise.all([api.get('/pedidos/venta'), api.get(`/pedidos/venta/${pedidoId}`)])
      setPedidos(list.data)
      setSelected(detail.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'Error')
    }
  }

  async function imprimirNota(pedidoId: string) {
    try {
      await api.post(`/pedidos/venta/${pedidoId}/imprimir`)
      toast.success('Nota marcada como impresa')
      const [list, detail] = await Promise.all([api.get('/pedidos/venta'), api.get(`/pedidos/venta/${pedidoId}`)])
      setPedidos(list.data)
      setSelected(detail.data)
    } catch (err: any) {
      toast.error(err.response?.data?.message ?? 'No se puede imprimir aún')
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando pedidos...</div>

  return (
    <div className="p-6 flex gap-5 h-full">
      {/* Lista de pedidos */}
      <div className="w-80 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">Pedidos de Venta</h1>
          {can('pedidos_venta', 'CREAR') && (
            <button className="text-xs px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
              + Nuevo
            </button>
          )}
        </div>
        {pedidos.map(p => {
          const est = ESTADO_LABELS[p.estado] ?? { label: p.estado, color: 'bg-gray-100 text-gray-600' }
          return (
            <button key={p.id} onClick={() => loadDetail(p.id)}
              className={`w-full text-left p-3 rounded-xl border transition ${selected?.id === p.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs font-semibold text-gray-700 dark:text-gray-300">{p.folio}</span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${est.color}`}>{est.label}</span>
              </div>
              <p className="text-sm text-gray-800 dark:text-white truncate">{p.nombre_cliente ?? 'Sin nombre'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{p.vendedora?.nombre} · {new Date(p.created_at).toLocaleDateString('es-MX')}</p>
            </button>
          )
        })}
      </div>

      {/* Detalle del pedido */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5">
        {!selected && !detailLoading && (
          <div className="h-full flex items-center justify-center text-gray-400">
            Selecciona un pedido para ver el detalle
          </div>
        )}
        {detailLoading && <div className="text-center text-gray-500 py-10">Cargando...</div>}
        {selected && !detailLoading && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{selected.folio}</h2>
                <p className="text-sm text-gray-500">{selected.nombre_cliente ?? selected.clientes_frecuentes?.nombre}</p>
              </div>
              <div className="flex gap-2 flex-wrap justify-end">
                {/* Acciones según estado */}
                {selected.estado === 'confirmado' && can('pedidos_venta', 'IMPRIMIR') && (
                  <button onClick={() => imprimirNota(selected.id)}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                    Imprimir nota
                  </button>
                )}
                {selected.estado === 'impreso' && can('pedidos_venta', 'EDITAR') && (
                  <button onClick={() => avanzarEstado(selected.id, 'surtir')}
                    className="px-3 py-1.5 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    Confirmar surtido
                  </button>
                )}
                {selected.estado === 'surtido' && can('pedidos_venta', 'EDITAR') && (
                  <button onClick={() => avanzarEstado(selected.id, 'verificar-vendedora')}
                    className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700">
                    Verificar pedido
                  </button>
                )}
                {selected.estado === 'verificado_vendedora' && can('pedidos_venta', 'APROBAR') && (
                  <button onClick={() => avanzarEstado(selected.id, 'checador')}
                    className="px-3 py-1.5 text-sm bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
                    Escanear (Checador)
                  </button>
                )}
                {selected.estado === 'en_checador' && can('pedidos_venta', 'APROBAR') && (
                  <button onClick={() => avanzarEstado(selected.id, 'puerta')}
                    className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700">
                    Cerrar (Puerta)
                  </button>
                )}
              </div>
            </div>

            {/* Items */}
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2 text-left">Producto</th>
                  <th className="px-3 py-2 text-center">Cant.</th>
                  <th className="px-3 py-2 text-center">Estado</th>
                  {['pendiente_almacen','en_revision'].includes(selected.estado) && can('pedidos_venta', 'EDITAR') && (
                    <th className="px-3 py-2 text-center">Acción almacén</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {selected.items_pedido_venta?.map((item: any) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2 text-gray-800 dark:text-gray-200">
                      <p className="font-medium">{item.productos?.nombre}</p>
                      <p className="text-xs text-gray-400">{item.productos?.codigo}</p>
                      {item.sustituto && <p className="text-xs text-blue-500">Sustituto: {item.sustituto.nombre}</p>}
                    </td>
                    <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-300">{item.cantidad}</td>
                    <td className="px-3 py-2 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.estado_confirmacion === 'confirmado'   ? 'bg-green-100 text-green-700' :
                        item.estado_confirmacion === 'no_disponible'? 'bg-red-100 text-red-700' :
                        item.estado_confirmacion === 'sustituto'    ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {item.estado_confirmacion}
                      </span>
                    </td>
                    {['pendiente_almacen','en_revision'].includes(selected.estado) && can('pedidos_venta', 'EDITAR') && (
                      <td className="px-3 py-2 text-center">
                        {item.estado_confirmacion === 'pendiente' && (
                          <div className="flex gap-1 justify-center">
                            <button onClick={() => confirmarItem(selected.id, item.id, 'confirmado')}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">✓</button>
                            <button onClick={() => confirmarItem(selected.id, item.id, 'no_disponible')}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">✗</button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
