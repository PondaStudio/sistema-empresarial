import { useEffect, useState } from 'react'
import api from '../../services/api'

interface KPIs {
  ventas_mes: number
  pedidos_pendientes: number
  tareas: Record<string, number>
  stock_bajo: number
  usuarios_activos: number
}

interface VentaDia {
  fecha: string
  total: number
}

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border-l-4 ${color}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [ventas, setVentas] = useState<VentaDia[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/kpis'),
      api.get('/dashboard/ventas-semana'),
    ]).then(([k, v]) => {
      setKpis(k.data)
      setVentas(v.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando dashboard...</div>
  if (!kpis)   return null

  const tareasTotal = Object.values(kpis.tareas).reduce((a, b) => a + b, 0)
  const maxVenta = Math.max(...ventas.map(v => v.total), 1)

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Ventas del mes"
          value={`$${kpis.ventas_mes.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`}
          color="border-green-500"
        />
        <KPICard
          label="Pedidos pendientes"
          value={kpis.pedidos_pendientes}
          sub="Requieren atención"
          color="border-yellow-500"
        />
        <KPICard
          label="Tareas activas"
          value={tareasTotal}
          sub={`${kpis.tareas.completada ?? 0} completadas`}
          color="border-blue-500"
        />
        <KPICard
          label="Stock bajo mínimo"
          value={kpis.stock_bajo}
          sub="Productos a reponer"
          color={kpis.stock_bajo > 0 ? 'border-red-500' : 'border-gray-300'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventas últimos 7 días */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Ventas — últimos 7 días</h2>
          {ventas.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Sin datos</p>
          ) : (
            <div className="flex items-end gap-2 h-32">
              {ventas.map(v => (
                <div key={v.fecha} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-primary-500 rounded-t-sm"
                    style={{ height: `${Math.round((v.total / maxVenta) * 100)}%`, minHeight: 4 }}
                    title={`$${v.total.toLocaleString('es-MX')}`}
                  />
                  <span className="text-[10px] text-gray-400 rotate-45 origin-left">
                    {v.fecha.slice(5)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tareas por estado */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tareas por estado</h2>
          <div className="space-y-2">
            {[
              { key: 'pendiente',   label: 'Pendiente',    color: 'bg-gray-400' },
              { key: 'en_progreso', label: 'En progreso',  color: 'bg-blue-500' },
              { key: 'en_revision', label: 'En revisión',  color: 'bg-yellow-500' },
              { key: 'rechazada',   label: 'Rechazada',    color: 'bg-red-500' },
              { key: 'completada',  label: 'Completada',   color: 'bg-green-500' },
            ].map(({ key, label, color }) => {
              const count = kpis.tareas[key] ?? 0
              const pct = tareasTotal > 0 ? Math.round((count / tareasTotal) * 100) : 0
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400 w-24 shrink-0">{label}</span>
                  <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                    <div className={`${color} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Usuarios activos */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-semibold text-gray-900 dark:text-white">{kpis.usuarios_activos}</span> usuario(s) disponibles ahora
        </p>
      </div>
    </div>
  )
}
