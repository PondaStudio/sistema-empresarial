import { Package, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useEffect, useState } from 'react'
import api from '../../services/api'

interface Pedido { id: string; cliente: string; total: number; estado: string }

const MOCK: Pedido[] = [
  { id: 'P-1042', cliente: 'Refaccionaria El Piston', total: 3400, estado: 'en_proceso' },
  { id: 'P-1041', cliente: 'Auto Parts Norte',        total: 1850, estado: 'entregado'  },
  { id: 'P-1040', cliente: 'Servicio Express',        total: 920,  estado: 'cobrado'    },
]

const ESTADO_ICON: Record<string, JSX.Element> = {
  en_proceso: <Clock size={14} className="text-amber-500" />,
  entregado:  <CheckCircle size={14} className="text-blue-500" />,
  cobrado:    <CheckCircle size={14} className="text-green-500" />,
  cancelado:  <AlertCircle size={14} className="text-red-500" />,
}

export function MisPedidosHoyWidget() {
  const [data, setData] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/pedidos-venta/hoy')
      .then(r => setData(Array.isArray(r.data) ? r.data : MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetWrapper
      title="Mis Pedidos de Hoy"
      icon={<Package size={16} />}
      badge={data.length}
      accentColor="blue"
      loading={loading}
      footer={<button className="text-blue-500 hover:underline">Ver historial de pedidos →</button>}
    >
      {data.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">Sin pedidos hoy todavía</p>
      ) : (
        <div className="space-y-2">
          {data.map(p => (
            <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
              {ESTADO_ICON[p.estado] ?? <Clock size={14} className="text-gray-400" />}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 dark:text-white">{p.id}</p>
                <p className="text-xs text-gray-500 truncate">{p.cliente}</p>
              </div>
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                ${(p.total ?? 0).toLocaleString('es-MX')}
              </span>
            </div>
          ))}
        </div>
      )}
    </WidgetWrapper>
  )
}
