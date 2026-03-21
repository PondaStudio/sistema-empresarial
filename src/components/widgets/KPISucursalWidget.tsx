import { Building2, TrendingUp, ShoppingCart, Package } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'

interface KPISucursal { ventas_dia: number; ventas_mes: number; pedidos_activos: number; stock_bajo: number; sucursal: string }

const MOCK: KPISucursal = { ventas_dia: 14200, ventas_mes: 89400, pedidos_activos: 6, stock_bajo: 3, sucursal: 'Sucursal Norte' }

export function KPISucursalWidget() {
  const [data] = useState<KPISucursal>(MOCK)
  const [loading] = useState(false)
  const user = useAuthStore(s => s.user)

  return (
    <WidgetWrapper
      title={`KPIs — ${(user as any)?.sucursales?.nombre ?? 'Mi Sucursal'}`}
      icon={<Building2 size={16} />}
      accentColor="blue"
      loading={loading}
    >
      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: <TrendingUp size={14} />, label: 'Ventas hoy',    value: `$${data.ventas_dia.toLocaleString('es-MX')}`, color: 'border-blue-500' },
          { icon: <TrendingUp size={14} />, label: 'Ventas mes',    value: `$${data.ventas_mes.toLocaleString('es-MX')}`, color: 'border-blue-400' },
          { icon: <ShoppingCart size={14} />, label: 'Pedidos activos', value: String(data.pedidos_activos), color: 'border-amber-500' },
          { icon: <Package size={14} />, label: 'Stock bajo',      value: String(data.stock_bajo), color: data.stock_bajo > 0 ? 'border-red-500' : 'border-gray-300' },
        ].map((t, i) => (
          <div key={i} className={`rounded-xl p-3 border-l-4 ${t.color} bg-gray-50 dark:bg-gray-800`}>
            <div className="flex items-center gap-1 text-gray-400 mb-1">{t.icon}<span className="text-[10px] uppercase">{t.label}</span></div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{t.value}</p>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  )
}
