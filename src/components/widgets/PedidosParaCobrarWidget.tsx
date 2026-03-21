import { CreditCard, ArrowRight } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

interface PedidoCobro { id: string; cliente: string; total: number; entregado: string }

const MOCK: PedidoCobro[] = [
  { id: 'P-1042', cliente: 'Refaccionaria El Piston', total: 3400, entregado: '11:20 AM' },
  { id: 'P-1038', cliente: 'Taller Mecánico Ramos',   total: 1200, entregado: '09:45 AM' },
  { id: 'P-1035', cliente: 'CEDIS Central',            total: 8900, entregado: 'Ayer'      },
]

export function PedidosParaCobrarWidget() {
  const [data, setData] = useState<PedidoCobro[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/pedidos-venta/listos-cobro')
      .then(r => setData(Array.isArray(r.data) ? r.data : MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const total = data.reduce((s, p) => s + p.total, 0)

  return (
    <WidgetWrapper
      title="Pedidos Listos para Cobrar"
      icon={<CreditCard size={16} />}
      badge={data.length}
      accentColor="green"
      loading={loading}
      footer={<span className="font-semibold text-gray-700 dark:text-gray-300">Total pendiente: ${total.toLocaleString('es-MX')}</span>}
    >
      <div className="space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin pedidos por cobrar</p>
        ) : data.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white">{p.id} · {p.cliente}</p>
              <p className="text-xs text-gray-400">Entregado: {p.entregado}</p>
            </div>
            <span className="text-sm font-bold text-green-700 dark:text-green-400 shrink-0">
              ${p.total.toLocaleString('es-MX')}
            </span>
            <button onClick={() => navigate(`/pedidos-venta/${p.id}`)} className="text-green-600 hover:text-green-800">
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
