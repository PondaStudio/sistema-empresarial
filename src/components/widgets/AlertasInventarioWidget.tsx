import { AlertTriangle } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useEffect, useState } from 'react'
import api from '../../services/api'

interface Alerta { producto: string; sucursal: string; stock: number; minimo: number }

const MOCK: Alerta[] = [
  { producto: 'Aceite Motor 5W-30',   sucursal: 'Norte',    stock: 2,  minimo: 10 },
  { producto: 'Filtro de Aire K&N',   sucursal: 'Sur',      stock: 0,  minimo: 5  },
  { producto: 'Pastillas de Freno',   sucursal: 'Centro',   stock: 3,  minimo: 8  },
  { producto: 'Bujías NGK',           sucursal: 'CEDIS',    stock: 5,  minimo: 20 },
  { producto: 'Líquido de Frenos',    sucursal: 'Oriente',  stock: 1,  minimo: 6  },
]

export function AlertasInventarioWidget() {
  const [data, setData] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/inventario/alertas')
      .then(r => setData(Array.isArray(r.data) ? r.data : MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetWrapper
      title="Alertas de Inventario"
      icon={<AlertTriangle size={16} />}
      badge={data.length}
      accentColor="red"
      loading={loading}
      footer={<button className="text-red-500 hover:underline">Ver todos los productos →</button>}
    >
      <div className="space-y-2">
        {data.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Sin alertas activas ✓</p>
        ) : data.slice(0, 5).map((a, i) => (
          <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800">
            <div className="min-w-0">
              <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{a.producto}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{a.sucursal}</p>
            </div>
            <div className="shrink-0 text-right ml-2">
              <span className={`text-xs font-bold ${a.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                {a.stock === 0 ? 'AGOTADO' : `${a.stock} uds`}
              </span>
              <p className="text-xs text-gray-400">mín. {a.minimo}</p>
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
