import { BarChart2 } from 'lucide-react'
import { WidgetWrapper } from './WidgetWrapper'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { useEffect, useState } from 'react'
import api from '../../services/api'

interface SucursalVenta { sucursal: string; total: number }

const MOCK: SucursalVenta[] = [
  { sucursal: 'CEDIS',     total: 98400 },
  { sucursal: 'Norte',     total: 67200 },
  { sucursal: 'Sur',       total: 54800 },
  { sucursal: 'Centro',    total: 72100 },
  { sucursal: 'Oriente',   total: 43600 },
  { sucursal: 'Poniente',  total: 51300 },
]

const COLORS = ['#2563eb','#3b82f6','#60a5fa','#1d4ed8','#1e40af','#1a2f5e']

export function VentasSucursalWidget() {
  const [data, setData] = useState<SucursalVenta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard/ventas-sucursal')
      .then(r => setData(Array.isArray(r.data) ? r.data : MOCK))
      .catch(() => setData(MOCK))
      .finally(() => setLoading(false))
  }, [])

  return (
    <WidgetWrapper
      title="Ventas por Sucursal"
      icon={<BarChart2 size={16} />}
      accentColor="blue"
      loading={loading}
      footer={<span>Datos del mes actual → <button className="text-blue-500 hover:underline">Ver reporte completo</button></span>}
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: -20 }}>
          <XAxis dataKey="sucursal" tick={{ fontSize: 11, fill: '#6b7280' }} />
          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
          <Tooltip formatter={(v: number) => [`$${v.toLocaleString('es-MX')}`, 'Ventas']} />
          <Bar dataKey="total" radius={[4,4,0,0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </WidgetWrapper>
  )
}
