import { Inbox, ArrowRight } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useEffect, useState } from 'react'
import api from '../../services/api'
import { useNavigate } from 'react-router-dom'

interface PedidoCola { id: string; cliente: string; productos: number; urgente: boolean; creado: string }

const MOCK: PedidoCola[] = [
  { id: 'P-1042', cliente: 'Refaccionaria El Piston', productos: 8,  urgente: true,  creado: '10:32 AM' },
  { id: 'P-1041', cliente: 'Auto Parts Norte',        productos: 3,  urgente: false, creado: '09:15 AM' },
  { id: 'P-1039', cliente: 'Servicio Rápido SA',      productos: 12, urgente: true,  creado: 'Ayer 5pm' },
]

export function ColaPedidosWidget() {
  const [data, setData] = useState<PedidoCola[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/pedidos/venta?estados=capturada,en_surtido,surtido_parcial')
      .then(r => setData(Array.isArray(r.data) ? r.data : MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetWrapper
      title="Cola de Pedidos por Surtir"
      icon={<Inbox size={16} />}
      badge={data.length}
      accentColor="blue"
      loading={loading}
      footer={<button className="text-blue-500 hover:underline">Ver cola completa →</button>}
    >
      <div className="space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Cola vacía ✓</p>
        ) : data.map(p => (
          <div key={p.id} className={`flex items-center gap-3 p-2 rounded-lg border ${p.urgente ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}>
            {p.urgente && <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded font-bold shrink-0">URGENTE</span>}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white">{p.id} · {p.cliente}</p>
              <p className="text-xs text-gray-400">{p.productos} productos · {p.creado}</p>
            </div>
            <button onClick={() => navigate('/pedidos/surtido')} className="text-blue-500 hover:text-blue-700">
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
