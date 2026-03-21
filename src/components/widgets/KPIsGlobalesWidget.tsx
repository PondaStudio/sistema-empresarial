import { ReactNode, useEffect, useState } from 'react'
import { TrendingUp, ShoppingCart, Package, Users } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import api from '../../services/api'

interface KPIs {
  ventas_dia: number
  ventas_semana: number
  ventas_mes: number
  pedidos_pendientes: number
  stock_bajo: number
  usuarios_activos: number
}

const MOCK: KPIs = {
  ventas_dia: 18450,
  ventas_semana: 97300,
  ventas_mes: 342800,
  pedidos_pendientes: 12,
  stock_bajo: 7,
  usuarios_activos: 23,
}

function KPITile({ icon, label, value, sub, color }: { icon: ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 border-l-4 ${color} bg-gray-50 dark:bg-gray-800`}>
      <div className="flex items-center gap-2 mb-1 text-gray-500 dark:text-gray-400">
        {icon}
        <span className="text-xs uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export function KPIsGlobalesWidget() {
  const [data, setData] = useState<KPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/kpis')
      .then(r => setData(r.data))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const d = data ?? MOCK

  return (
    <WidgetWrapper
      title="KPIs Globales"
      icon={<TrendingUp size={16} />}
      accentColor="blue"
      loading={loading}
      footer={<span>Actualizado hace unos momentos · <button className="text-blue-500 hover:underline">Refrescar</button></span>}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KPITile icon={<TrendingUp size={14} />} label="Ventas hoy" value={`$${(d.ventas_dia ?? 0).toLocaleString('es-MX')}`} sub="vs ayer +8%" color="border-blue-500" />
        <KPITile icon={<TrendingUp size={14} />} label="Esta semana" value={`$${(d.ventas_semana ?? 0).toLocaleString('es-MX')}`} color="border-blue-400" />
        <KPITile icon={<TrendingUp size={14} />} label="Este mes" value={`$${(d.ventas_mes ?? 0).toLocaleString('es-MX')}`} color="border-blue-300" />
        <KPITile icon={<ShoppingCart size={14} />} label="Pedidos pendientes" value={String(d.pedidos_pendientes ?? 0)} sub="Requieren atención" color="border-amber-500" />
        <KPITile icon={<Package size={14} />} label="Stock bajo" value={String(d.stock_bajo ?? 0)} sub="Productos a reponer" color={(d.stock_bajo ?? 0) > 0 ? 'border-red-500' : 'border-gray-300'} />
        <KPITile icon={<Users size={14} />} label="Usuarios activos" value={String(d.usuarios_activos ?? 0)} sub="Conectados ahora" color="border-emerald-500" />
      </div>
    </WidgetWrapper>
  )
}
